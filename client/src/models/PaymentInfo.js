import { PaymentMethod, PaymentStatus } from './types';

/**
 * Payment Information Model
 * Handles all payment-related data
 */
export class PaymentInfo {
  constructor({
    method = null,
    status = null,
    depositAmount = 0,
    depositPercentage = 0,
    totalAmount = 0,
    transactionId = null,
    paidAt = null,
  } = {}) {
    this.method = method;
    this.status = status;
    this.depositAmount = depositAmount;
    this.depositPercentage = depositPercentage;
    this.totalAmount = totalAmount;
    this.transactionId = transactionId;
    this.paidAt = paidAt;
  }

  // Getters for computed values
  get isFullPayment() {
    return this.method === PaymentMethod.VNPAY_FULL;
  }

  get isDeposit() {
    return this.method === PaymentMethod.VNPAY_DEPOSIT;
  }

  get isCash() {
    return this.method === PaymentMethod.CASH;
  }

  get isPaid() {
    return this.status === PaymentStatus.PAID;
  }

  get isPartiallyPaid() {
    return this.status === PaymentStatus.PARTIALLY_PAID;
  }

  get isUnpaid() {
    return this.status === PaymentStatus.UNPAID;
  }

  get remainingAmount() {
    if (this.isPartiallyPaid) {
      return this.totalAmount - this.depositAmount;
    }
    if (this.isUnpaid) {
      return this.totalAmount;
    }
    return 0;
  }

  get formattedTotalAmount() {
    return this.totalAmount.toLocaleString('vi-VN');
  }

  get formattedDepositAmount() {
    return this.depositAmount.toLocaleString('vi-VN');
  }

  get formattedRemainingAmount() {
    return this.remainingAmount.toLocaleString('vi-VN');
  }

  // Helper methods
  getPaymentMethodLabel() {
    switch (this.method) {
      case PaymentMethod.VNPAY_FULL:
        return 'VNPay - Full Payment';
      case PaymentMethod.VNPAY_DEPOSIT:
        return `VNPay - Deposit (${this.depositPercentage}%)`;
      case PaymentMethod.CASH:
        return 'Cash at Check-in';
      default:
        return 'Unknown';
    }
  }

  getPaymentStatusLabel() {
    switch (this.status) {
      case PaymentStatus.PAID:
        return 'Paid in Full';
      case PaymentStatus.PARTIALLY_PAID:
        return 'Partially Paid';
      case PaymentStatus.UNPAID:
        return 'Unpaid';
      default:
        return 'Unknown';
    }
  }

  // Validation
  isValid() {
    return (
      this.method !== null &&
      this.status !== null &&
      this.totalAmount > 0
    );
  }

  // Static factory methods
  static fromApiResponse(data) {
    if (!data) return null;

    return new PaymentInfo({
      method: data.paymentMethod,
      status: data.paymentStatus,
      depositAmount: data.depositAmount || 0,
      depositPercentage: data.depositPercentage || 0,
      totalAmount: data.totalPrice || data.amount || 0,
      transactionId: data.paymentIntentId || data.transactionNo,
      paidAt: data.paidAt ? new Date(data.paidAt) : null,
    });
  }

  // Convert to plain object for API
  toApiPayload() {
    return {
      paymentMethod: this.method,
      paymentStatus: this.status,
      depositAmount: this.depositAmount,
      depositPercentage: this.depositPercentage,
      totalPrice: this.totalAmount,
      paymentIntentId: this.transactionId,
      paidAt: this.paidAt?.toISOString(),
    };
  }

  // Clone
  clone() {
    return new PaymentInfo({
      method: this.method,
      status: this.status,
      depositAmount: this.depositAmount,
      depositPercentage: this.depositPercentage,
      totalAmount: this.totalAmount,
      transactionId: this.transactionId,
      paidAt: this.paidAt,
    });
  }
}

export default PaymentInfo;

