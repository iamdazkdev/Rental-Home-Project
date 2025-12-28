/**
 * PaymentHistory Model
 * Represents a single payment transaction in the payment history
 */

class PaymentHistory {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.bookingId = data.bookingId || null;
    this.customerId = data.customerId || null;
    this.hostId = data.hostId || null;
    this.listingId = data.listingId || null;

    // Transaction details
    this.amount = data.amount || 0;
    this.method = data.method || 'cash'; // vnpay, cash, bank_transfer
    this.status = data.status || 'pending'; // pending, paid, failed, refunded
    this.transactionId = data.transactionId || null;
    this.type = data.type || 'full'; // deposit, partial, full, remaining, refund

    // Timestamps
    this.paidAt = data.paidAt ? new Date(data.paidAt) : null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : null;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

    // Metadata
    this.notes = data.notes || '';
    this.recordedBy = data.recordedBy || null;

    // Refund info
    this.refundedAt = data.refundedAt ? new Date(data.refundedAt) : null;
    this.refundReason = data.refundReason || '';

    // VNPay data
    this.vnpayData = data.vnpayData || null;
  }

  // Getters for formatted values
  get formattedAmount() {
    return this.amount.toLocaleString('vi-VN');
  }

  get formattedPaidAt() {
    if (!this.paidAt) return '';
    return this.paidAt.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get methodLabel() {
    const labels = {
      vnpay: 'VNPay',
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
    };
    return labels[this.method] || this.method;
  }

  get typeLabel() {
    const labels = {
      deposit: 'Deposit Payment',
      partial: 'Partial Payment',
      full: 'Full Payment',
      remaining: 'Remaining Payment',
      refund: 'Refund',
      adjustment: 'Adjustment',
    };
    return labels[this.type] || this.type;
  }

  get statusLabel() {
    const labels = {
      pending: 'Pending',
      paid: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
      cancelled: 'Cancelled',
    };
    return labels[this.status] || this.status;
  }

  // Status checks
  get isPaid() {
    return this.status === 'paid';
  }

  get isPending() {
    return this.status === 'pending';
  }

  get isFailed() {
    return this.status === 'failed';
  }

  get isRefunded() {
    return this.status === 'refunded';
  }

  get isCancelled() {
    return this.status === 'cancelled';
  }

  // Type checks
  get isDeposit() {
    return this.type === 'deposit';
  }

  get isFull() {
    return this.type === 'full';
  }

  get isRemaining() {
    return this.type === 'remaining';
  }

  get isRefund() {
    return this.type === 'refund';
  }

  // Method checks
  get isVNPay() {
    return this.method === 'vnpay';
  }

  get isCash() {
    return this.method === 'cash';
  }

  get isBankTransfer() {
    return this.method === 'bank_transfer';
  }

  // Convert to API payload
  toApiPayload() {
    return {
      bookingId: this.bookingId,
      amount: this.amount,
      method: this.method,
      status: this.status,
      transactionId: this.transactionId,
      type: this.type,
      notes: this.notes,
      paidAt: this.paidAt,
    };
  }

  // Create from API response
  static fromApiResponse(data) {
    return new PaymentHistory(data);
  }

  // Create array from API response
  static fromApiResponseArray(dataArray) {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(item => PaymentHistory.fromApiResponse(item));
  }

  // Clone
  clone() {
    return new PaymentHistory({
      id: this.id,
      bookingId: this.bookingId,
      customerId: this.customerId,
      hostId: this.hostId,
      listingId: this.listingId,
      amount: this.amount,
      method: this.method,
      status: this.status,
      transactionId: this.transactionId,
      type: this.type,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes,
      recordedBy: this.recordedBy,
      refundedAt: this.refundedAt,
      refundReason: this.refundReason,
      vnpayData: this.vnpayData,
    });
  }

  // Utility: Get status color
  getStatusColor() {
    const colors = {
      paid: '#28a745',
      pending: '#ffc107',
      failed: '#dc3545',
      refunded: '#6c757d',
      cancelled: '#6c757d',
    };
    return colors[this.status] || '#6c757d';
  }

  // Utility: Get status icon
  getStatusIcon() {
    const icons = {
      paid: '✅',
      pending: '⏰',
      failed: '❌',
      refunded: '↩️',
      cancelled: '🚫',
    };
    return icons[this.status] || '❓';
  }

  // Utility: Get method icon
  getMethodIcon() {
    const icons = {
      vnpay: '💳',
      cash: '💵',
      bank_transfer: '🏦',
      credit_card: '💳',
      debit_card: '💳',
    };
    return icons[this.method] || '💰';
  }
}

export default PaymentHistory;

