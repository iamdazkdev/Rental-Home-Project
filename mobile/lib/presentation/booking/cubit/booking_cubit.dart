import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/enums/booking_enums.dart';
import '../../../data/models/booking_intent_model.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/repositories/booking_repository.dart';
import 'booking_state.dart';

class BookingCubit extends Cubit<BookingState> {
  final BookingRepository _bookingRepository;
  Timer? _intentExpiryTimer;
  Timer? _paymentPollingTimer;

  // Prevent double submissions
  bool _isProcessing = false;

  BookingCubit({required BookingRepository bookingRepository})
      : _bookingRepository = bookingRepository,
        super(BookingInitial());

  /// Step 1: Create booking intent (lock the listing)
  Future<void> createBookingIntent({
    required String listingId,
    required DateTime checkIn,
    required DateTime checkOut,
    int? guests,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Reserving listing...'));

    try {
      final result = await _bookingRepository.createBookingIntent(
        listingId: listingId,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
      );

      result.fold(
        (failure) {
          if (failure.code == 'LISTING_LOCKED') {
            emit(BookingListingLocked(
              listingId: listingId,
              message: failure.message,
            ));
          } else {
            emit(BookingError(
              message: failure.message,
              errorCode: failure.code,
            ));
          }
        },
        (intent) {
          _startIntentExpiryTimer(intent);
          emit(BookingIntentCreated(
            intent: intent,
            timeRemaining: intent.timeRemaining,
          ));
        },
      );
    } finally {
      _isProcessing = false;
    }
  }

  /// Step 2: Confirm intent and create booking
  Future<void> confirmBookingIntent({
    required String intentId,
    required PaymentType paymentType,
    String? notes,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Creating booking...'));

    try {
      final result = await _bookingRepository.confirmBookingIntent(
        intentId: intentId,
        paymentType: paymentType,
        notes: notes,
      );

      result.fold(
        (failure) {
          if (failure.code == 'INTENT_EXPIRED') {
            emit(BookingIntentExpired(
              intentId: intentId,
              listingId: '', // Will be handled by UI
            ));
          } else {
            emit(BookingError(
              message: failure.message,
              errorCode: failure.code,
            ));
          }
        },
        (booking) => _handleBookingStateTransition(booking),
      );
    } finally {
      _isProcessing = false;
      _cancelIntentExpiryTimer();
    }
  }

  /// Handle state transitions based on backend response
  void _handleBookingStateTransition(BookingModel booking) {
    final status = BookingStatus.fromString(booking.status);

    switch (status) {
      case BookingStatus.agreementRequired:
        emit(BookingAgreementRequired(
          booking: booking,
          agreementId: booking.agreementId ?? '',
          agreementUrl: booking.agreementUrl,
        ));
        break;

      case BookingStatus.pendingPayment:
      case BookingStatus.partiallyPaid:
        emit(BookingPaymentRequired(
          booking: booking,
          amountDue: booking.amountDue ?? booking.totalPrice,
          depositAmount: booking.depositAmount,
          availablePaymentTypes: _getAvailablePaymentTypes(booking),
          paymentStatus: status == BookingStatus.partiallyPaid
              ? PaymentStatus.partiallyPaid
              : PaymentStatus.pending,
        ));
        break;

      case BookingStatus.pendingApproval:
        emit(BookingPendingApproval(booking: booking));
        break;

      case BookingStatus.confirmed:
      case BookingStatus.active:
        emit(BookingConfirmed(booking: booking));
        break;

      case BookingStatus.cancelled:
      case BookingStatus.rejected:
        emit(BookingCancelled(
          bookingId: booking.id,
          reason: booking.cancellationReason ?? 'Booking was cancelled',
        ));
        break;

      default:
        emit(BookingLoaded(
          booking: booking,
          status: status,
          availableActions: _getAvailableActions(status),
        ));
    }
  }

  /// Sign digital agreement
  Future<void> signAgreement({
    required String bookingId,
    required String agreementId,
    required String signature,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Signing agreement...'));

    try {
      final result = await _bookingRepository.signAgreement(
        bookingId: bookingId,
        agreementId: agreementId,
        signature: signature,
      );

      result.fold(
        (failure) => emit(BookingError(message: failure.message)),
        (booking) => _handleBookingStateTransition(booking),
      );
    } finally {
      _isProcessing = false;
    }
  }

  /// Initiate payment
  Future<void> initiatePayment({
    required String bookingId,
    required PaymentType paymentType,
    required String paymentMethod,
    double? amount,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Processing payment...'));

    try {
      final result = await _bookingRepository.initiatePayment(
        bookingId: bookingId,
        paymentType: paymentType,
        paymentMethod: paymentMethod,
        amount: amount,
      );

      result.fold(
        (failure) => emit(BookingError(message: failure.message)),
        (paymentResponse) {
          // Get booking from current state if possible
          final currentState = state;
          BookingModel? booking;
          if (currentState is BookingPaymentRequired) {
            booking = currentState.booking;
          }

          if (paymentResponse.requiresRedirect && paymentResponse.paymentUrl != null) {
            emit(BookingPaymentProcessing(
              booking: booking ?? BookingModel.empty(),
              paymentId: paymentResponse.paymentId,
              paymentUrl: paymentResponse.paymentUrl,
            ));
            // Start polling for payment status
            _startPaymentPolling(bookingId, paymentResponse.paymentId);
          } else {
            // Payment completed immediately (e.g., cash on arrival)
            loadBooking(bookingId);
          }
        },
      );
    } finally {
      _isProcessing = false;
    }
  }

  /// Handle payment callback result
  Future<void> handlePaymentCallback({
    required String bookingId,
    required String paymentId,
    required bool success,
    String? transactionId,
  }) async {
    _cancelPaymentPolling();

    if (success) {
      await loadBooking(bookingId);
    } else {
      emit(const BookingError(
        message: 'Payment failed. Please try again.',
        canRetry: true,
      ));
    }
  }

  /// Load booking by ID
  Future<void> loadBooking(String bookingId) async {
    emit(const BookingLoading());

    try {
      final result = await _bookingRepository.getBookingById(bookingId);

      result.fold(
        (failure) => emit(BookingError(message: failure.message)),
        (booking) => _handleBookingStateTransition(booking),
      );
    } catch (e) {
      emit(BookingError(message: e.toString()));
    }
  }

  /// Load all bookings for current user
  Future<void> loadUserBookings() async {
    emit(const BookingLoading());

    try {
      final result = await _bookingRepository.getUserBookings();

      result.fold(
        (failure) => emit(BookingError(message: failure.message)),
        (bookings) => emit(BookingsLoaded(bookings: bookings)),
      );
    } catch (e) {
      emit(BookingError(message: e.toString()));
    }
  }

  /// Cancel booking
  Future<void> cancelBooking({
    required String bookingId,
    required String reason,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Cancelling booking...'));

    try {
      final result = await _bookingRepository.cancelBooking(
        bookingId: bookingId,
        reason: reason,
      );

      result.fold(
        (failure) => emit(BookingError(message: failure.message)),
        (_) => emit(BookingCancelled(bookingId: bookingId, reason: reason)),
      );
    } finally {
      _isProcessing = false;
    }
  }

  /// Cancel booking intent (release lock)
  Future<void> cancelBookingIntent(String intentId) async {
    _cancelIntentExpiryTimer();

    try {
      await _bookingRepository.cancelBookingIntent(intentId);
    } catch (_) {
      // Silent fail - intent will expire anyway
    }

    emit(BookingInitial());
  }

  // ============ PRIVATE HELPERS ============

  List<PaymentType> _getAvailablePaymentTypes(BookingModel booking) {
    // This should come from backend, but fallback to defaults
    return booking.availablePaymentTypes?.map(PaymentType.fromString).toList() ??
        [PaymentType.full, PaymentType.deposit];
  }

  List<String> _getAvailableActions(BookingStatus status) {
    switch (status) {
      case BookingStatus.pending:
      case BookingStatus.pendingApproval:
        return ['CANCEL'];
      case BookingStatus.agreementRequired:
        return ['SIGN_AGREEMENT', 'CANCEL'];
      case BookingStatus.pendingPayment:
      case BookingStatus.partiallyPaid:
        return ['PAY', 'CANCEL'];
      case BookingStatus.confirmed:
        return ['CANCEL'];
      case BookingStatus.active:
        return ['VIEW'];
      default:
        return [];
    }
  }

  void _startIntentExpiryTimer(BookingIntentModel intent) {
    _cancelIntentExpiryTimer();

    _intentExpiryTimer = Timer(intent.timeRemaining, () {
      emit(BookingIntentExpired(
        intentId: intent.id,
        listingId: intent.listingId,
      ));
    });

    // Also emit updates every second for countdown UI
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

  void _startPaymentPolling(String bookingId, String paymentId) {
    _cancelPaymentPolling();

    int attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals

    _paymentPollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      attempts++;

      if (attempts >= maxAttempts) {
        timer.cancel();
        emit(const BookingError(
          message: 'Payment verification timed out. Please check your booking status.',
          canRetry: true,
        ));
        return;
      }

      final result = await _bookingRepository.checkPaymentStatus(paymentId);
      result.fold(
        (_) {}, // Continue polling on error
        (status) {
          if (status == PaymentStatus.completed) {
            timer.cancel();
            loadBooking(bookingId);
          } else if (status == PaymentStatus.failed) {
            timer.cancel();
            emit(const BookingError(
              message: 'Payment failed. Please try again.',
              canRetry: true,
            ));
          }
        },
      );
    });
  }

  void _cancelPaymentPolling() {
    _paymentPollingTimer?.cancel();
    _paymentPollingTimer = null;
  }

  @override
  Future<void> close() {
    _cancelIntentExpiryTimer();
    _cancelPaymentPolling();
    return super.close();
  }
}

