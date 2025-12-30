/// Booking enums for state management
/// Synced with backend booking states

/// Booking Status enum matching backend states
enum BookingStatus {
  draft,
  pending,
  approved,
  checkedIn,
  checkedOut,
  completed,
  cancelled,
  rejected,
  expired;

  String get value {
    switch (this) {
      case BookingStatus.draft:
        return 'draft';
      case BookingStatus.pending:
        return 'pending';
      case BookingStatus.approved:
        return 'approved';
      case BookingStatus.checkedIn:
        return 'checked_in';
      case BookingStatus.checkedOut:
        return 'checked_out';
      case BookingStatus.completed:
        return 'completed';
      case BookingStatus.cancelled:
        return 'cancelled';
      case BookingStatus.rejected:
        return 'rejected';
      case BookingStatus.expired:
        return 'expired';
    }
  }

  static BookingStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return BookingStatus.draft;
      case 'pending':
        return BookingStatus.pending;
      case 'approved':
      case 'accepted':
        return BookingStatus.approved;
      case 'checked_in':
      case 'checkedin':
        return BookingStatus.checkedIn;
      case 'checked_out':
      case 'checkedout':
        return BookingStatus.checkedOut;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
        return BookingStatus.cancelled;
      case 'rejected':
        return BookingStatus.rejected;
      case 'expired':
        return BookingStatus.expired;
      default:
        return BookingStatus.pending;
    }
  }
}

/// Payment Status enum matching backend states
enum PaymentStatus {
  unpaid,
  partiallyPaid,
  paid,
  refunded;

  String get value {
    switch (this) {
      case PaymentStatus.unpaid:
        return 'unpaid';
      case PaymentStatus.partiallyPaid:
        return 'partially_paid';
      case PaymentStatus.paid:
        return 'paid';
      case PaymentStatus.refunded:
        return 'refunded';
    }
  }

  static PaymentStatus fromString(String? status) {
    switch (status?.toLowerCase()) {
      case 'unpaid':
        return PaymentStatus.unpaid;
      case 'partially_paid':
        return PaymentStatus.partiallyPaid;
      case 'paid':
        return PaymentStatus.paid;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.unpaid;
    }
  }
}

/// Payment Method enum
enum PaymentMethod {
  vnpay,
  cash;

  String get value {
    switch (this) {
      case PaymentMethod.vnpay:
        return 'vnpay';
      case PaymentMethod.cash:
        return 'cash';
    }
  }

  static PaymentMethod fromString(String? method) {
    switch (method?.toLowerCase()) {
      case 'vnpay':
        return PaymentMethod.vnpay;
      case 'cash':
        return PaymentMethod.cash;
      default:
        return PaymentMethod.cash;
    }
  }
}

/// Payment Type enum
enum PaymentType {
  full,
  deposit,
  cash;

  String get value {
    switch (this) {
      case PaymentType.full:
        return 'full';
      case PaymentType.deposit:
        return 'deposit';
      case PaymentType.cash:
        return 'cash';
    }
  }

  static PaymentType fromString(String? type) {
    switch (type?.toLowerCase()) {
      case 'full':
        return PaymentType.full;
      case 'deposit':
        return PaymentType.deposit;
      case 'cash':
        return PaymentType.cash;
      default:
        return PaymentType.cash;
    }
  }

  String get displayName {
    switch (this) {
      case PaymentType.full:
        return 'Full Payment';
      case PaymentType.deposit:
        return 'Deposit (30%)';
      case PaymentType.cash:
        return 'Pay at Check-in';
    }
  }
}

/// Booking Intent Status
enum BookingIntentStatus {
  pending,
  locked,
  confirmed,
  expired,
  cancelled;

  String get value {
    switch (this) {
      case BookingIntentStatus.pending:
        return 'PENDING';
      case BookingIntentStatus.locked:
        return 'LOCKED';
      case BookingIntentStatus.confirmed:
        return 'CONFIRMED';
      case BookingIntentStatus.expired:
        return 'EXPIRED';
      case BookingIntentStatus.cancelled:
        return 'CANCELLED';
    }
  }

  static BookingIntentStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return BookingIntentStatus.pending;
      case 'LOCKED':
        return BookingIntentStatus.locked;
      case 'CONFIRMED':
        return BookingIntentStatus.confirmed;
      case 'EXPIRED':
        return BookingIntentStatus.expired;
      case 'CANCELLED':
        return BookingIntentStatus.cancelled;
      default:
        return BookingIntentStatus.pending;
    }
  }
}

