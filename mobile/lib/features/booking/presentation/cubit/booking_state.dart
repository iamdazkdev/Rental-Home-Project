import 'package:equatable/equatable.dart';

import '../../domain/entities/booking_entity.dart';
import '../../domain/entities/booking_intent_entity.dart';

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

class BookingIntentCreated extends BookingState {
  final BookingIntentEntity intent;
  final Duration timeRemaining;

  const BookingIntentCreated({
    required this.intent,
    required this.timeRemaining,
  });

  @override
  List<Object?> get props => [intent, timeRemaining];
}

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

class BookingPaymentRequired extends BookingState {
  final BookingEntity booking;

  const BookingPaymentRequired({
    required this.booking,
  });

  @override
  List<Object?> get props => [booking];
}

class BookingPaymentProcessing extends BookingState {
  final BookingEntity booking;
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

class BookingConfirmed extends BookingState {
  final BookingEntity booking;

  const BookingConfirmed({required this.booking});

  @override
  List<Object?> get props => [booking];
}

class BookingLoaded extends BookingState {
  final BookingEntity booking;
  final String status;
  final List<String> availableActions;

  const BookingLoaded({
    required this.booking,
    required this.status,
    required this.availableActions,
  });

  @override
  List<Object?> get props => [booking, status, availableActions];
}

class BookingsLoaded extends BookingState {
  final List<BookingEntity> bookings;

  const BookingsLoaded({required this.bookings});

  @override
  List<Object?> get props => [bookings];
}

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
