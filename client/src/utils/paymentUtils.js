/**
 * Payment Utilities
 * Helper functions for VNPay payment integration
 */

/**
 * Payment status constants
 */
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

/**
 * Payment status labels for display
 */
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.UNPAID]: 'Chưa thanh toán',
  [PAYMENT_STATUS.PENDING]: 'Đang xử lý',
  [PAYMENT_STATUS.PAID]: 'Đã thanh toán',
  [PAYMENT_STATUS.FAILED]: 'Thanh toán thất bại',
  [PAYMENT_STATUS.REFUNDED]: 'Đã hoàn tiền',
};

/**
 * Payment status colors for badges
 */
export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.UNPAID]: '#999',
  [PAYMENT_STATUS.PENDING]: '#ff9800',
  [PAYMENT_STATUS.PAID]: '#4caf50',
  [PAYMENT_STATUS.FAILED]: '#f44336',
  [PAYMENT_STATUS.REFUNDED]: '#2196f3',
};

/**
 * Get payment status label
 * @param {string} status - Payment status
 * @returns {string} Status label
 */
export const getPaymentStatusLabel = (status) => {
  return PAYMENT_STATUS_LABELS[status] || status;
};

/**
 * Get payment status color
 * @param {string} status - Payment status
 * @returns {string} Color hex code
 */
export const getPaymentStatusColor = (status) => {
  return PAYMENT_STATUS_COLORS[status] || '#999';
};

/**
 * Check if payment is successful
 * @param {string} status - Payment status
 * @returns {boolean} Is paid
 */
export const isPaymentSuccessful = (status) => {
  return status === PAYMENT_STATUS.PAID;
};

/**
 * Check if payment is pending
 * @param {string} status - Payment status
 * @returns {boolean} Is pending
 */
export const isPaymentPending = (status) => {
  return status === PAYMENT_STATUS.PENDING;
};

/**
 * Check if payment failed
 * @param {string} status - Payment status
 * @returns {boolean} Is failed
 */
export const isPaymentFailed = (status) => {
  return status === PAYMENT_STATUS.FAILED;
};

/**
 * Format currency for display
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Format currency in USD
 * @param {number} amount - Amount in USD
 * @returns {string} Formatted currency
 */
export const formatUSD = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Convert USD to VND (approximate rate)
 * @param {number} usd - Amount in USD
 * @param {number} rate - Exchange rate (default: 24000)
 * @returns {number} Amount in VND
 */
export const convertUSDToVND = (usd, rate = 24000) => {
  return Math.round(usd * rate);
};

/**
 * Parse VNPay response code message
 * @param {string} code - Response code
 * @returns {string} Error message
 */
export const parseVNPayResponseCode = (code) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư.',
    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Lỗi không xác định',
  };

  return messages[code] || 'Lỗi không xác định';
};

/**
 * Validate booking data before payment
 * @param {Object} bookingData - Booking data
 * @returns {Object} Validation result { isValid, errors }
 */
export const validateBookingData = (bookingData) => {
  const errors = [];

  if (!bookingData.customerId) {
    errors.push('Customer ID is required');
  }

  if (!bookingData.listingId) {
    errors.push('Listing ID is required');
  }

  if (!bookingData.hostId) {
    errors.push('Host ID is required');
  }

  if (!bookingData.startDate) {
    errors.push('Start date is required');
  }

  if (!bookingData.endDate) {
    errors.push('End date is required');
  }

  if (!bookingData.totalPrice || bookingData.totalPrice <= 0) {
    errors.push('Invalid total price');
  }

  if (bookingData.dayCount && bookingData.dayCount < 1) {
    errors.push('Day count must be at least 1');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get payment gateway logo URL
 * @param {string} gateway - Payment gateway name
 * @returns {string} Logo URL
 */
export const getPaymentGatewayLogo = (gateway) => {
  const logos = {
    vnpay: 'https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png',
    momo: 'https://developers.momo.vn/v3/img/logo.png',
    zalopay: 'https://cdn.zalopay.vn/web/assets/images/logo.png',
  };

  return logos[gateway?.toLowerCase()] || '';
};

const paymentUtils = {
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  isPaymentSuccessful,
  isPaymentPending,
  isPaymentFailed,
  formatCurrency,
  formatUSD,
  convertUSDToVND,
  parseVNPayResponseCode,
  validateBookingData,
  getPaymentGatewayLogo,
};

export default paymentUtils;

