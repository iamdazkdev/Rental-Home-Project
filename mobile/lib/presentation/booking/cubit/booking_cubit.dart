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
  /// For Entire Place Rental with 3 payment options:
  /// - VNPay Full (100%)
  /// - VNPay Deposit (30%)
  /// - Cash (100%)
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
      // For cash payment, create booking directly without intent
      if (paymentType == 'cash') {
        final booking = await _bookingRepository.createCashBooking(
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

      // For VNPay payments, create intent first
      final intent = await _bookingRepository.createBookingIntent(
        listingId: listingId,
        hostId: hostId,
        startDate: checkIn,
        endDate: checkOut,
        totalPrice: totalPrice,
        paymentType: paymentType, // 'full' or 'deposit'
      );

      if (intent == null) {
        emit(const BookingError(
          message: 'This listing is currently being reserved by another user. Please try again.',
          errorCode: 'LISTING_LOCKED',
        ));
        return;
      }

      if (!intent.isValid) {
        emit(BookingIntentExpired(
          intentId: intent.id,
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
      emit(BookingError(message: e.toString()));
    } finally {
      _isProcessing = false;
    }
  }

  /// Step 2: Initiate VNPay payment (redirect to payment gateway)
  Future<String?> initiateVNPayPayment({
    required BookingIntentModel intent,
    required String returnUrl,
  }) async {
    if (_isProcessing) return null;
    _isProcessing = true;

    try {
      final orderInfo = intent.isFullPayment
          ? 'Full payment - ${intent.tempOrderId}'
          : 'Deposit ${intent.depositPercentage.toInt()}% - ${intent.tempOrderId}';

      final paymentUrl = await _bookingRepository.createVNPayPaymentUrl(
        tempOrderId: intent.tempOrderId,
        amount: intent.paymentAmount,
        orderInfo: orderInfo,
        returnUrl: returnUrl,
      );

      if (paymentUrl != null) {
        emit(BookingPaymentProcessing(
          booking: BookingModel.empty(), // Will be created after payment
          paymentId: intent.tempOrderId,
          paymentUrl: paymentUrl,
        ));
      }

      return paymentUrl;
    } finally {
      _isProcessing = false;
    }
  }

  /// Step 3: Handle VNPay payment callback
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
        // Payment successful - create booking
        final booking = await _bookingRepository.handlePaymentCallback(
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
        // Payment failed
        emit(const BookingError(
          message: 'Payment failed. Please try again.',
          canRetry: true,
        ));
      }
    } finally {
      _isProcessing = false;
    }
  }

  /// Handle state transitions based on backend response
  void _handleBookingStateTransition(BookingModel booking) {
    final status = booking.bookingStatus;

    switch (status) {
      case BookingStatus.agreementRequired:
        emit(BookingAgreementRequired(
          booking: booking,
          agreementId: '', // Will be populated when Room Rental agreement is available
          agreementUrl: null,
        ));
        break;

      case BookingStatus.pendingPayment:
      case BookingStatus.partiallyPaid:
        emit(BookingPaymentRequired(
          booking: booking,
          amountDue: booking.remainingAmount > 0 ? booking.remainingAmount : booking.totalPrice,
          depositAmount: booking.depositAmount,
          availablePaymentTypes: _getAvailablePaymentTypes(booking),
          paymentStatus: status == BookingStatus.partiallyPaid
              ? PaymentStatus.partiallyPaid
              : PaymentStatus.unpaid,
        ));
        break;

      case BookingStatus.pendingApproval:
        emit(BookingPendingApproval(booking: booking));
        break;

      case BookingStatus.approved:
      case BookingStatus.checkedIn:
        emit(BookingConfirmed(booking: booking));
        break;

      case BookingStatus.cancelled:
      case BookingStatus.rejected:
        emit(BookingCancelled(
          bookingId: booking.id,
          reason: '', // Cancellation reason will be handled separately
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
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Signing agreement...'));

    try {
      final result = await _bookingRepository.signAgreement(
        bookingId: bookingId,
        agreementId: agreementId,
      );

      if (result) {
        await loadBooking(bookingId);
      } else {
        emit(const BookingError(message: 'Failed to sign agreement'));
      }
    } catch (e) {
      emit(BookingError(message: e.toString()));
    } finally {
      _isProcessing = false;
    }
  }

  /// Initiate payment
  Future<void> initiatePayment({
    required String bookingId,
    required PaymentType paymentType,
    double? amount,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    emit(const BookingLoading(message: 'Processing payment...'));

    try {
      final booking = await _bookingRepository.getBookingById(bookingId);

      if (booking == null) {
        emit(const BookingError(message: 'Booking not found'));
        return;
      }

      final paymentAmount = amount ?? booking.totalPrice;

      final paymentUrl = await _bookingRepository.initiatePayment(
        bookingId: bookingId,
        paymentType: paymentType.value,
        amount: paymentAmount,
      );

      if (paymentUrl != null) {
        emit(BookingPaymentProcessing(
          booking: booking,
          paymentId: bookingId,
          paymentUrl: paymentUrl,
        ));
        // Start polling for payment status
        _startPaymentPolling(bookingId, bookingId);
      } else {
        emit(const BookingError(
          message: 'Failed to initiate payment',
          canRetry: true,
        ));
      }
    } catch (e) {
      emit(BookingError(message: e.toString()));
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
      final booking = await _bookingRepository.getBookingById(bookingId);

      if (booking != null) {
        _handleBookingStateTransition(booking);
      } else {
        emit(const BookingError(message: 'Booking not found'));
      }
    } catch (e) {
      emit(BookingError(message: e.toString()));
    }
  }

  /// Load all bookings for current user
  Future<void> loadUserBookings() async {
    emit(const BookingLoading());

    try {
      final bookings = await _bookingRepository.getUserBookings();
      emit(BookingsLoaded(bookings: bookings));
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
        bookingId,
        reason: reason,
      );

      if (result) {
        emit(BookingCancelled(bookingId: bookingId, reason: reason));
      } else {
        emit(const BookingError(message: 'Failed to cancel booking'));
      }
    } catch (e) {
      emit(BookingError(message: 'Error: $e'));
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
    // Default payment types for booking
    return [PaymentType.full, PaymentType.deposit];
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
      case BookingStatus.approved:
      case BookingStatus.checkedIn:
        return ['CANCEL'];
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

      try {
        final result = await _bookingRepository.checkPaymentStatus(paymentId);

        if (result != null) {
          final paymentStatus = result['paymentStatus'] as String?;

          if (paymentStatus == 'paid') {
            timer.cancel();
            loadBooking(bookingId);
          } else if (paymentStatus == 'failed' || paymentStatus == 'unpaid') {
            timer.cancel();
            emit(const BookingError(
              message: 'Payment failed. Please try again.',
              canRetry: true,
            ));
          }
        }
      } catch (_) {
        // Continue polling on error
      }
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

