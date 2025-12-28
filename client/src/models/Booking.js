import { BookingStatus } from './types';
import PaymentInfo from './PaymentInfo';

/**
 * Booking Model
 * Represents a booking with all its details
 */
export class Booking {
  constructor({
    id = null,
    customerId = null,
    hostId = null,
    listingId = null,
    startDate = null,
    endDate = null,
    totalPrice = 0,
    finalTotalPrice = 0,
    status = BookingStatus.PENDING,
    paymentInfo = null,
    createdAt = null,
    updatedAt = null,
    // Rejection
    rejectionReason = null,
    // Checkout fields (from server model)
    checkedOutAt = null,
    isCheckedOut = false,
    // Extension requests (from server model)
    extensionRequests = [],
    finalEndDate = null,
    // Legacy extension fields (for backward compatibility)
    extensionDays = null,
    newEndDate = null,
    extensionCost = null,
    extensionStatus = null,
    // Review data
    homeReview = null,
    homeRating = null,
    hostReview = null,
    hostRating = null,
    // Populated data
    customer = null,
    host = null,
    listing = null,
  } = {}) {
    this.id = id;
    this.customerId = customerId;
    this.hostId = hostId;
    this.listingId = listingId;
    this.startDate = startDate ? new Date(startDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
    this.totalPrice = totalPrice;
    this.finalTotalPrice = finalTotalPrice;
    this.status = status;
    this.paymentInfo = paymentInfo instanceof PaymentInfo ? paymentInfo : null;
    this.createdAt = createdAt ? new Date(createdAt) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;

    // Rejection
    this.rejectionReason = rejectionReason;

    // Checkout (from server model)
    this.checkedOutAt = checkedOutAt ? new Date(checkedOutAt) : null;
    this.isCheckedOut = isCheckedOut;

    // Extension requests (from server model)
    this.extensionRequests = extensionRequests || [];
    this.finalEndDate = finalEndDate ? new Date(finalEndDate) : null;

    // Legacy extension (backward compatibility)
    this.extensionDays = extensionDays;
    this.newEndDate = newEndDate ? new Date(newEndDate) : null;
    this.extensionCost = extensionCost;
    this.extensionStatus = extensionStatus;

    // Reviews
    this.homeReview = homeReview;
    this.homeRating = homeRating;
    this.hostReview = hostReview;
    this.hostRating = hostRating;

    // Populated data
    this.customer = customer;
    this.host = host;
    this.listing = listing;
  }

  // Computed properties
  get numberOfNights() {
    if (!this.startDate || !this.endDate) return 0;
    const effectiveEndDate = this.newEndDate || this.endDate;
    return Math.ceil((effectiveEndDate - this.startDate) / (1000 * 60 * 60 * 24));
  }

  get isPending() {
    return this.status === BookingStatus.PENDING;
  }

  get isApproved() {
    return this.status === BookingStatus.APPROVED || this.status === BookingStatus.ACCEPTED;
  }

  get isRejected() {
    return this.status === BookingStatus.REJECTED;
  }

  get isCancelled() {
    return this.status === BookingStatus.CANCELLED;
  }

  get isCompleted() {
    return this.status === BookingStatus.COMPLETED;
  }

  get hasCheckedOutStatus() {
    return this.status === BookingStatus.CHECKED_OUT;
  }

  get isActive() {
    return this.isPending || this.isApproved;
  }

  get hasExtension() {
    return this.extensionRequests && this.extensionRequests.length > 0;
  }

  get hasPendingExtension() {
    return this.extensionRequests?.some(req => req.status === 'pending');
  }

  get hasApprovedExtension() {
    return this.extensionRequests?.some(req => req.status === 'approved');
  }

  get canCheckout() {
    return this.isApproved && new Date() >= this.startDate;
  }

  get canReview() {
    return this.hasCheckedOutStatus && !this.homeReview;
  }

  get formattedDateRange() {
    if (!this.startDate || !this.endDate) return '';
    const start = this.startDate.toLocaleDateString('vi-VN');
    const end = (this.newEndDate || this.endDate).toLocaleDateString('vi-VN');
    return `${start} - ${end}`;
  }

  // Static factory method
  static fromApiResponse(data) {
    if (!data) return null;

    return new Booking({
      id: data._id || data.id,
      customerId: typeof data.customerId === 'string' ? data.customerId : data.customerId?._id,
      hostId: typeof data.hostId === 'string' ? data.hostId : data.hostId?._id,
      listingId: typeof data.listingId === 'string' ? data.listingId : data.listingId?._id,
      startDate: data.startDate,
      endDate: data.endDate,
      totalPrice: data.totalPrice || 0,
      finalTotalPrice: data.finalTotalPrice || data.totalPrice || 0,
      status: data.status,
      paymentInfo: PaymentInfo.fromApiResponse(data),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Rejection
      rejectionReason: data.rejectionReason,
      // Checkout
      checkedOutAt: data.checkedOutAt,
      isCheckedOut: data.isCheckedOut || false,
      // Extensions
      extensionRequests: data.extensionRequests || [],
      finalEndDate: data.finalEndDate,
      // Legacy extension fields
      extensionDays: data.extensionDays,
      newEndDate: data.newEndDate,
      extensionCost: data.extensionCost,
      extensionStatus: data.extensionStatus,
      // Reviews
      homeReview: data.homeReview,
      homeRating: data.homeRating,
      hostReview: data.hostReview,
      hostRating: data.hostRating,
      // Populated
      customer: typeof data.customerId === 'object' ? data.customerId : null,
      host: typeof data.hostId === 'object' ? data.hostId : null,
      listing: typeof data.listingId === 'object' ? data.listingId : null,
    });
  }

  // Convert to API payload
  toApiPayload() {
    return {
      customerId: this.customerId,
      hostId: this.hostId,
      listingId: this.listingId,
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      totalPrice: this.totalPrice,
      finalTotalPrice: this.finalTotalPrice,
      status: this.status,
      ...(this.paymentInfo?.toApiPayload() || {}),
    };
  }

  // Clone
  clone() {
    return new Booking({
      id: this.id,
      customerId: this.customerId,
      hostId: this.hostId,
      listingId: this.listingId,
      startDate: this.startDate,
      endDate: this.endDate,
      totalPrice: this.totalPrice,
      finalTotalPrice: this.finalTotalPrice,
      status: this.status,
      paymentInfo: this.paymentInfo?.clone(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Rejection
      rejectionReason: this.rejectionReason,
      // Checkout
      checkedOutAt: this.checkedOutAt,
      isCheckedOut: this.isCheckedOut,
      // Extensions
      extensionRequests: [...this.extensionRequests],
      finalEndDate: this.finalEndDate,
      // Legacy
      extensionDays: this.extensionDays,
      newEndDate: this.newEndDate,
      extensionCost: this.extensionCost,
      extensionStatus: this.extensionStatus,
      // Reviews
      homeReview: this.homeReview,
      homeRating: this.homeRating,
      hostReview: this.hostReview,
      hostRating: this.hostRating,
      // Populated
      customer: this.customer,
      host: this.host,
      listing: this.listing,
    });
  }
}

export default Booking;

