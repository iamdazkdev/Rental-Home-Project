import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS, HTTP_METHODS } from '../constants/api';
import Loader from '../components/Loader';
import '../styles/PaymentResult.scss';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status] = useState(searchParams.get('status'));
  const [bookingId] = useState(searchParams.get('bookingId'));
  const [transactionNo] = useState(searchParams.get('transactionNo'));
  const [message] = useState(searchParams.get('message'));
  const [paymentStatus] = useState(searchParams.get('paymentStatus'));
  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch booking details if successful payment
    if (status === 'success' && bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [status, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.PAYMENT.STATUS(bookingId),
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToTrips = () => {
    navigate('/trips');
  };

  const handleNavigateToHome = () => {
    navigate('/');
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="payment-result-page">
      <div className="result-container">
        {status === 'success' ? (
          <div className="result-content success">
            <div className="icon-wrapper">
              <div className="success-icon">✓</div>
            </div>
            <h1>Thanh toán thành công!</h1>
            <p className="message">
              {paymentStatus === 'partially_paid'
                ? 'Bạn đã thanh toán cọc thành công! Vui lòng thanh toán số tiền còn lại khi check-in.'
                : 'Đặt phòng của bạn đã được xác nhận và thanh toán thành công.'}
            </p>

            {bookingDetails && (
              <div className="booking-summary">
                <h3>Chi tiết đặt phòng</h3>
                <div className="detail-item">
                  <span className="label">Tên căn hộ:</span>
                  <span className="value">{bookingDetails.listing?.title}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Check-in:</span>
                  <span className="value">{new Date(bookingDetails.startDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Check-out:</span>
                  <span className="value">{new Date(bookingDetails.endDate).toLocaleDateString('vi-VN')}</span>
                </div>
                {bookingDetails.paymentMethod === 'vnpay_deposit' && (
                  <>
                    <div className="detail-item">
                      <span className="label">Đã thanh toán (Cọc {bookingDetails.depositPercentage}%):</span>
                      <span className="value paid">${bookingDetails.depositAmount?.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Còn lại (thanh toán khi check-in):</span>
                      <span className="value pending">${(bookingDetails.totalPrice - bookingDetails.depositAmount)?.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="detail-item total">
                  <span className="label">Tổng tiền:</span>
                  <span className="value">${bookingDetails.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="details">
              <div className="detail-item">
                <span className="label">Mã đặt phòng:</span>
                <span className="value">{bookingId}</span>
              </div>
              {transactionNo && (
                <div className="detail-item">
                  <span className="label">Mã giao dịch VNPay:</span>
                  <span className="value">{transactionNo}</span>
                </div>
              )}
              {bookingDetails?.paidAt && (
                <div className="detail-item">
                  <span className="label">Thời gian thanh toán:</span>
                  <span className="value">
                    {new Date(bookingDetails.paidAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            <div className="actions">
              <button className="btn btn-primary" onClick={handleNavigateToTrips}>
                Xem chuyến đi của tôi
              </button>
              <button className="btn btn-secondary" onClick={handleNavigateToHome}>
                Về trang chủ
              </button>
            </div>
          </div>
        ) : status === 'failed' ? (
          <div className="result-content failed">
            <div className="icon-wrapper">
              <div className="failed-icon">✕</div>
            </div>
            <h1>Thanh toán thất bại</h1>
            <p className="message">
              {message || 'Giao dịch của bạn không thành công. Vui lòng thử lại.'}
            </p>
            <div className="payment-tips">
              <h4>Một số lý do có thể gây ra lỗi:</h4>
              <ul>
                <li>Số dư tài khoản không đủ</li>
                <li>Thẻ/Tài khoản chưa đăng ký Internet Banking</li>
                <li>Nhập sai mã OTP</li>
                <li>Hủy giao dịch</li>
              </ul>
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => navigate(-1)}>
                Thử lại
              </button>
              <button className="btn btn-secondary" onClick={handleNavigateToHome}>
                Về trang chủ
              </button>
            </div>
          </div>
        ) : (
          <div className="result-content error">
            <div className="icon-wrapper">
              <div className="error-icon">⚠</div>
            </div>
            <h1>Có lỗi xảy ra</h1>
            <p className="message">
              {message || 'Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng liên hệ hỗ trợ.'}
            </p>
            <div className="actions">
              <button className="btn btn-primary" onClick={handleNavigateToHome}>
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;

