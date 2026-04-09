import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/enums/booking_enums.dart';
import '../../domain/entities/booking_intent_entity.dart';
import '../../domain/entities/booking_entity.dart';
import '../../domain/usecases/booking_usecases.dart';
import 'booking_state.dart';

@injectable
class BookingCubit extends Cubit<BookingState> {
  final CreateCashBookingUseCase _createCashBooking;
  final CreateBookingIntentUseCase _createBookingIntent;
  final InitiateVNPayPaymentUseCase _initiateVNPayPayment;
  final HandlePaymentCallbackUseCase _handlePaymentCallback;
  final GetUserTripsUseCase _getUserTrips;
  final CancelBookingIntentUseCase _cancelBookingIntent;

  Timer? _intentExpiryTimer;
  bool _isProcessing = false;

  BookingCubit(
    this._createCashBooking,
    this._createBookingIntent,
    this._initiateVNPayPayment,
    this._handlePaymentCallback,
    this._getUserTrips,
    this._cancelBookingIntent,
  ) : super(BookingInitial());

  Future<void> createBookingIntent({
    required String listingId,
    required String hostId,
    required DateTime checkIn,
    required DateTime checkOut,
    required double totalPrice,
    required String paymentType, // 'full', 'deposit', or 'cash'
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Reserving listing...'));

    try {
      if (paymentType == 'cash') {
        final booking = await _createCashBooking(
          listingId: listingId,
          hostId: hostId,
          startDate: checkIn,
          endDate: checkOut,
          totalPrice: totalPrice,
        );

        if (booking != null) {
          emit(BookingConfirmed(booking: booking));
        } else {
          emit(const BookingError(
            message: 'Failed to create cash booking. Please try again.',
            canRetry: true,
          ));
        }
        return;
      }

      final intent = await _createBookingIntent(
        listingId: listingId,
        hostId: hostId,
        startDate: checkIn,
        endDate: checkOut,
        totalPrice: totalPrice,
        paymentType: paymentType,
      );

      if (intent == null) {
        emit(const BookingError(
          message: 'Unable to reserve this listing. It may be booked by another user or unavailable.',
          errorCode: 'LISTING_LOCKED',
          canRetry: true,
        ));
        return;
      }

      if (!intent.isValid) {
        emit(BookingIntentExpired(
          intentId: intent.intentId,
          listingId: listingId,
        ));
        return;
      }

      _startIntentExpiryTimer(intent);
      emit(BookingIntentCreated(
        intent: intent,
        timeRemaining: intent.timeRemaining,
      ));
    } catch (e) {
      emit(BookingError(
        message: 'An unexpected error occurred: ${e.toString()}',
        canRetry: true,
      ));
    } finally {
      _isProcessing = false;
    }
  }

  Future<String?> initiateVNPayPayment({
    required BookingIntentEntity intent,
    required String returnUrl,
  }) async {
    if (_isProcessing) return null;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Initiating payment...'));

    try {
      final tempOrderId = intent.tempOrderId ?? intent.intentId;
      final orderInfo = intent.isFullPayment
          ? 'Full payment - $tempOrderId'
          : 'Deposit ${intent.depositPercentage}% - $tempOrderId';

      final paymentUrl = await _initiateVNPayPayment(
        tempOrderId: tempOrderId,
        amount: intent.paymentAmount,
        orderInfo: orderInfo,
        returnUrl: returnUrl,
      );

      if (paymentUrl != null) {
        // Here we just pass an empty booking reference as it expects an entity
        // We will receive the complete booking when payment is done.
        emit(BookingPaymentProcessing(
          booking: _createEmptyBooking(), // Placeholder
          paymentId: tempOrderId,
          paymentUrl: paymentUrl,
        ));
        return paymentUrl;
      } else {
        emit(const BookingError(
          message: 'Failed to create payment URL. Please try again.',
          canRetry: true,
        ));
        return null;
      }
    } catch (e) {
      emit(BookingError(
        message: 'Failed to initiate payment: ${e.toString()}',
        canRetry: true,
      ));
      return null;
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> handleVNPayCallback({
    required String tempOrderId,
    required Map<String, String> queryParams,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Confirming payment...'));

    try {
      final responseCode = queryParams['vnp_ResponseCode'];
      final transactionId = queryParams['vnp_TransactionNo'] ?? '';

      if (responseCode == '00') {
        final booking = await _handlePaymentCallback(
          tempOrderId: tempOrderId,
          transactionId: transactionId,
          paymentData: queryParams,
        );

        if (booking != null) {
          _cancelIntentExpiryTimer();
          _handleBookingStateTransition(booking);
        } else {
          emit(const BookingError(
            message: 'Payment confirmed but booking creation failed. Please contact support.',
          ));
        }
      } else {
        emit(const BookingError(
          message: 'Payment failed. Please try again.',
          canRetry: true,
        ));
      }
    } catch (e) {
      emit(BookingError(
        message: 'Payment confirmation error: ${e.toString()}',
        canRetry: true,
      ));
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> loadUserBookings() async {
    emit(const BookingLoading());
    try {
      final bookings = await _getUserTrips();
      emit(BookingsLoaded(bookings: bookings));
    } catch (e) {
      emit(BookingError(message: e.toString()));
    }
  }

  Future<void> cancelBookingIntent(String intentId) async {
    _cancelIntentExpiryTimer();
    try {
      await _cancelBookingIntent(intentId);
    } catch (_) {
      // Ignored
    }
    emit(BookingInitial());
  }

  void reset() {
    _cancelIntentExpiryTimer();
    emit(BookingInitial());
  }

  // ============ PRIVATE HELPERS ============

  void _handleBookingStateTransition(BookingEntity booking) {
    final status = BookingStatus.fromString(booking.bookingStatus);
    
    switch (status) {
      case BookingStatus.approved:
      case BookingStatus.checkedIn:
        emit(BookingConfirmed(booking: booking));
        break;
      case BookingStatus.cancelled:
      case BookingStatus.rejected:
        emit(BookingCancelled(bookingId: booking.id, reason: ''));
        break;
      default:
        emit(BookingConfirmed(booking: booking)); // Standard outcome
    }
  }

  BookingEntity _createEmptyBooking() {
    return BookingEntity(
      id: '',
      customerId: '',
      hostId: '',
      listingId: '',
      startDate: DateTime.now(),
      endDate: DateTime.now(),
      totalPrice: 0,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      paymentType: 'cash',
    );
  }

  void _startIntentExpiryTimer(BookingIntentEntity intent) {
    _cancelIntentExpiryTimer();

    _intentExpiryTimer = Timer(intent.timeRemaining, () {
      emit(BookingIntentExpired(
        intentId: intent.intentId,
        listingId: intent.listingId,
      ));
    });

    Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state is BookingIntentCreated) {
        final remaining = intent.expiresAt.difference(DateTime.now());
        if (remaining <= Duration.zero) {
          timer.cancel();
        } else {
          emit(BookingIntentCreated(
            intent: intent,
            timeRemaining: remaining,
          ));
        }
      } else {
        timer.cancel();
      }
    });
  }

  void _cancelIntentExpiryTimer() {
    _intentExpiryTimer?.cancel();
    _intentExpiryTimer = null;
  }

  @override
  Future<void> close() {
    _cancelIntentExpiryTimer();
    return super.close();
  }
}
