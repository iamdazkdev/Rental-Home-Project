import 'package:equatable/equatable.dart';

import '../../../core/enums/booking_enums.dart';
import '../../../models/booking.dart';
import '../../../models/booking_intent.dart';

abstract class BookingState extends Equatable {
  const BookingState();

  @override
  List<Object?> get props => [];
}

class BookingInitial extends BookingState {}

class BookingLoading extends BookingState {
  final String? message;

  const BookingLoading({this.message});

  @override
  List<Object?> get props => [message];
}

/// When listing is locked by current user (BookingIntent created)
class BookingIntentCreated extends BookingState {
  final BookingIntentModel intent;
  final Duration timeRemaining;

  const BookingIntentCreated({
    required this.intent,
    required this.timeRemaining,
  });

  @override
  List<Object?> get props => [intent, timeRemaining];
}

/// When listing is locked by another user
class BookingListingLocked extends BookingState {
  final String listingId;
  final String? lockedByUserId;
  final DateTime? lockExpiresAt;
  final String message;

  const BookingListingLocked({
    required this.listingId,
    this.lockedByUserId,
    this.lockExpiresAt,
    this.message = 'This listing is currently being booked by another user.',
  });

  @override
  List<Object?> get props =>
      [listingId, lockedByUserId, lockExpiresAt, message];
}

/// Booking requires agreement to be signed
class BookingAgreementRequired extends BookingState {
  final BookingModel booking;
  final String agreementId;
  final String? agreementUrl;

  const BookingAgreementRequired({
    required this.booking,
    required this.agreementId,
    this.agreementUrl,
  });

  @override
  List<Object?> get props => [booking, agreementId, agreementUrl];
}

/// Booking requires payment
class BookingPaymentRequired extends BookingState {
  final BookingModel booking;
  final double amountDue;
  final double? depositAmount;
  final List<PaymentType> availablePaymentTypes;
  final PaymentStatus paymentStatus;

  const BookingPaymentRequired({
    required this.booking,
    required this.amountDue,
    this.depositAmount,
    required this.availablePaymentTypes,
    required this.paymentStatus,
  });

  bool get isPartiallyPaid => paymentStatus == PaymentStatus.partiallyPaid;

  @override
  List<Object?> get props =>
      [booking, amountDue, depositAmount, availablePaymentTypes, paymentStatus];
}

/// Payment is being processed
class BookingPaymentProcessing extends BookingState {
  final BookingModel booking;
  final String paymentId;
  final String? paymentUrl;

  const BookingPaymentProcessing({
    required this.booking,
    required this.paymentId,
    this.paymentUrl,
  });

  @override
  List<Object?> get props => [booking, paymentId, paymentUrl];
}

/// Booking is pending approval from landlord
class BookingPendingApproval extends BookingState {
  final BookingModel booking;

  const BookingPendingApproval({required this.booking});

  @override
  List<Object?> get props => [booking];
}

/// Booking confirmed successfully
class BookingConfirmed extends BookingState {
  final BookingModel booking;

  const BookingConfirmed({required this.booking});

  @override
  List<Object?> get props => [booking];
}

/// Booking loaded successfully
class BookingLoaded extends BookingState {
  final BookingModel booking;
  final BookingStatus status;
  final List<String> availableActions;

  const BookingLoaded({
    required this.booking,
    required this.status,
    required this.availableActions,
  });

  bool get canCancel => availableActions.contains('CANCEL');

  bool get canPay => availableActions.contains('PAY');

  bool get canSignAgreement => availableActions.contains('SIGN_AGREEMENT');

  @override
  List<Object?> get props => [booking, status, availableActions];
}

/// Multiple bookings loaded
class BookingsLoaded extends BookingState {
  final List<BookingModel> bookings;

  const BookingsLoaded({required this.bookings});

  @override
  List<Object?> get props => [bookings];
}

/// Booking cancelled
class BookingCancelled extends BookingState {
  final String bookingId;
  final String reason;

  const BookingCancelled({
    required this.bookingId,
    required this.reason,
  });

  @override
  List<Object?> get props => [bookingId, reason];
}

/// Intent expired
class BookingIntentExpired extends BookingState {
  final String intentId;
  final String listingId;

  const BookingIntentExpired({
    required this.intentId,
    required this.listingId,
  });

  @override
  List<Object?> get props => [intentId, listingId];
}

/// Error state
class BookingError extends BookingState {
  final String message;
  final String? errorCode;
  final bool canRetry;

  const BookingError({
    required this.message,
    this.errorCode,
    this.canRetry = true,
  });

  @override
  List<Object?> get props => [message, errorCode, canRetry];
}
