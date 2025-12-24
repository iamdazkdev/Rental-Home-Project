const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');

/**
 * VNPay Service
 * Handles VNPay payment gateway integration
 */

class VNPayService {
  constructor() {
    // Load config from environment variables
    this.vnp_TmnCode = process.env.VNP_TMN_CODE || 'BG733598';
    this.vnp_HashSecret = process.env.VNP_HASH_SECRET || 'U9D6G3T8Z2WNRC0KW38MIFFFHY1TPBQY';
    this.vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay-return';
    this.vnp_IpnUrl = process.env.VNP_IPN_URL || 'http://localhost:3001/payment/vnpay-ipn';
  }

  /**
   * Sort object by key
   */
  sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  /**
   * Create HMAC SHA512 signature
   */
  createSignature(data, secretKey) {
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
    return signed;
  }

  /**
   * Create payment URL
   * @param {Object} params - Payment parameters
   * @returns {String} Payment URL
   */
  createPaymentUrl(params) {
    const {
      orderId,
      amount,
      orderInfo,
      orderType = 'other',
      locale = 'vn',
      ipAddr = '127.0.0.1',
      bankCode = '',
    } = params;

    // Create date
    const createDate = moment().format('YYYYMMDDHHmmss');
    const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

    // VNPay requires amount in VND (smallest unit - already in VND, no need to multiply by 100)
    const vnp_Amount = Math.round(amount);

    // Build VNPay params
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: vnp_Amount,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Add bank code if specified
    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sort params
    vnp_Params = this.sortObject(vnp_Params);

    // Create signature
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const secureHash = this.createSignature(signData, this.vnp_HashSecret);
    vnp_Params['vnp_SecureHash'] = secureHash;

    // Build payment URL
    const paymentUrl = this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log('✅ VNPay payment URL created:', paymentUrl.substring(0, 100) + '...');
    return paymentUrl;
  }

  /**
   * Verify return URL from VNPay
   * @param {Object} vnp_Params - Parameters from VNPay return URL
   * @returns {Object} Verification result
   */
  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Remove hash params
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    const sortedParams = this.sortObject(vnp_Params);

    // Create signature
    const signData = querystring.stringify(sortedParams, { encode: false });
    const checkSum = this.createSignature(signData, this.vnp_HashSecret);

    const isValid = secureHash === checkSum;

    return {
      isValid,
      rspCode: vnp_Params['vnp_ResponseCode'],
      message: this.getResponseMessage(vnp_Params['vnp_ResponseCode']),
      orderId: vnp_Params['vnp_TxnRef'],
      amount: parseInt(vnp_Params['vnp_Amount']), // VNPay amount is already in VND
      bankCode: vnp_Params['vnp_BankCode'],
      transactionNo: vnp_Params['vnp_TransactionNo'],
      payDate: vnp_Params['vnp_PayDate'],
    };
  }

  /**
   * Verify IPN (Instant Payment Notification)
   * @param {Object} vnp_Params - Parameters from VNPay IPN
   * @returns {Object} Verification result
   */
  verifyIpn(vnp_Params) {
    return this.verifyReturnUrl(vnp_Params);
  }

  /**
   * Get response message by code
   * @param {String} code - Response code
   * @returns {String} Response message
   */
  getResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    };

    return messages[code] || 'Lỗi không xác định';
  }

  /**
   * Check if transaction is successful
   * @param {String} responseCode - VNPay response code
   * @returns {Boolean} Is successful
   */
  isSuccessful(responseCode) {
    return responseCode === '00';
  }
}

module.exports = new VNPayService();

