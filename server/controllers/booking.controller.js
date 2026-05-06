const bookingService = require('../services/booking.service');
const vnpayService = require('../services/vnpay.service');
const { HTTP_STATUS } = require("../constants");

const createIntent = async (req, res) => {
  const { listingId, hostId, startDate, endDate, totalPrice, paymentType } = req.body;
  const bookingData = {
    listingId,
    customerId: req.user.id,
    hostId,
    startDate,
    endDate,
    totalPrice
  };
  const result = await bookingService.createBookingIntent(bookingData, paymentType);
  res.status(201).json({
    success: true,
    tempOrderId: result.tempOrderId,
    paymentAmount: result.paymentAmount,
    paymentType,
    message: 'BookingIntent created successfully'
  });
};

const checkAvailability = async (req, res) => {
  const { listingId, startDate, endDate } = req.query;
  const result = await bookingService.checkAvailability(listingId, startDate, endDate);
  res.json(result);
};

const createFromPayment = async (req, res) => {
  const { tempOrderId, transactionId, paymentData } = req.body;

  const isValid = vnpayService.verifyReturnUrl(paymentData);
  if (!isValid) {
    const error = new Error('Invalid payment signature');
    error.statusCode = 400;
    throw error;
  }

  if (paymentData.vnp_ResponseCode !== '00') {
    const error = new Error('Payment failed or cancelled');
    error.statusCode = 400;
    throw error;
  }

  const booking = await bookingService.createBookingFromPayment(
    tempOrderId,
    transactionId || paymentData.vnp_TransactionNo,
    paymentData
  );

  res.status(201).json(booking);
};

const createCashBooking = async (req, res) => {
  const bookingData = {
    ...req.body,
    customerId: req.user.id
  };
  const booking = await bookingService.createCashBooking(bookingData);
  res.status(201).json(booking);
};

const getUserBookings = async (req, res) => {
  const { userId } = req.params;
  const { status, role } = req.query;

  if (req.user.id !== userId && req.user.role !== 'admin') {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const bookings = await bookingService.getUserBookings(userId, role, status);
  res.json(bookings);
};

const getBookingById = async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
  res.json(booking);
};

const approveBooking = async (req, res) => {
  const booking = await bookingService.approveBooking(req.params.id, req.user.id);
  res.json(booking);
};

const rejectBooking = async (req, res) => {
  const booking = await bookingService.rejectBooking(req.params.id, req.user.id, req.body.reason);
  res.json(booking);
};

const cancelBooking = async (req, res) => {
  const result = await bookingService.cancelBooking(req.params.id, req.user.id, req.body.reason);
  res.json(result);
};

const checkIn = async (req, res) => {
  const booking = await bookingService.checkIn(req.params.id, req.user.id);
  res.json(booking);
};

const checkOut = async (req, res) => {
  const booking = await bookingService.checkOut(req.params.id, req.user.id);
  res.json(booking);
};

const confirmCashPayment = async (req, res) => {
  const { amount, notes } = req.body;
  const booking = await bookingService.confirmCashPayment(req.params.id, req.user.id, { amount, notes });
  res.json({
    success: true,
    booking,
    message: 'Cash payment confirmed successfully'
  });
};

const completeBooking = async (req, res) => {
  const { hasDamage, damageReport } = req.body;
  const booking = await bookingService.completeBooking(req.params.id, req.user.id, hasDamage, damageReport);
  res.json(booking);
};

const extendBooking = async (req, res) => {
  const { newEndDate, additionalNights } = req.body;
  const booking = await bookingService.extendBooking(req.params.id, req.user.id, newEndDate, additionalNights);
  res.json(booking);
};

const approveExtension = async (req, res) => {
  const booking = await bookingService.approveExtension(req.params.id, req.user.id, req.params.extensionId);
  res.json(booking);
};

const rejectExtension = async (req, res) => {
  const booking = await bookingService.rejectExtension(req.params.id, req.user.id, req.params.extensionId, req.body.reason);
  res.json(booking);
};

module.exports = {
  createIntent,
  checkAvailability,
  createFromPayment,
  createCashBooking,
  getUserBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  checkIn,
  checkOut,
  confirmCashPayment,
  completeBooking,
  extendBooking,
  approveExtension,
  rejectExtension
};
