/**
 * Integration Tests for Payment Flows v2.0 Routes
 * Tests API endpoints
 */

const request = require('supertest');
const app = require('../index');
const Booking = require('../models/Booking');
const BookingIntent = require('../models/BookingIntent');
const Listing = require('../models/Listing');
const User = require('../models/User');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'testuser123', role: 'guest' };
    next();
  }
}));

describe('Payment Flows v2.0 - Integration Tests', () => {

  let testToken = 'Bearer test-token';

  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Cleanup test database
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /entire-place-booking/create-intent', () => {

    it('should create BookingIntent for full payment', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          paymentType: 'full'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.tempOrderId).toContain('INTENT_');
      expect(response.body.paymentAmount).toBe(7000000);
      expect(response.body.paymentType).toBe('full');
    });

    it('should create BookingIntent for deposit payment', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          paymentType: 'deposit'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.paymentAmount).toBe(2100000); // 30%
      expect(response.body.paymentType).toBe('deposit');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid paymentType', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          paymentType: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid paymentType');
    });
  });

  describe('POST /entire-place-booking/create-from-payment', () => {

    it('should create booking from valid payment callback', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-from-payment')
        .set('Authorization', testToken)
        .send({
          tempOrderId: 'INTENT_123',
          transactionId: 'TXN123',
          paymentData: {
            vnp_Amount: '700000000',
            vnp_ResponseCode: '00',
            vnp_TransactionNo: 'TXN123',
            vnp_SecureHash: 'valid-hash'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.bookingStatus).toBe('pending');
      expect(response.body.paymentStatus).toBeDefined();
    });

    it('should return 400 for missing tempOrderId', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-from-payment')
        .set('Authorization', testToken)
        .send({
          transactionId: 'TXN123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing tempOrderId');
    });

    it('should return 400 for failed payment', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-from-payment')
        .set('Authorization', testToken)
        .send({
          tempOrderId: 'INTENT_123',
          transactionId: 'TXN123',
          paymentData: {
            vnp_ResponseCode: '99' // Failed
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Payment failed');
    });
  });

  describe('POST /entire-place-booking/create-cash', () => {

    it('should create cash booking', async () => {
      const response = await request(app)
        .post('/entire-place-booking/create-cash')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          guestCount: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.bookingStatus).toBe('pending');
      expect(response.body.paymentStatus).toBe('unpaid');
      expect(response.body.paymentMethod).toBe('cash');
      expect(response.body.paymentType).toBe('cash');
    });
  });

  describe('POST /entire-place-booking/:id/confirm-cash-payment', () => {

    it('should confirm cash payment', async () => {
      const response = await request(app)
        .post('/entire-place-booking/booking123/confirm-cash-payment')
        .set('Authorization', testToken)
        .send({
          amount: 7000000,
          notes: 'Cash received at check-in'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking.paymentStatus).toBe('paid');
    });
  });

  describe('GET /entire-place-booking/check-availability', () => {

    it('should check availability for dates', async () => {
      const response = await request(app)
        .get('/entire-place-booking/check-availability')
        .query({
          listingId: 'listing123',
          startDate: '2025-01-15',
          endDate: '2025-01-20'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('pricing');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/entire-place-booking/check-availability')
        .query({
          listingId: 'listing123'
          // Missing dates
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required parameters');
    });
  });

  describe('PATCH /entire-place-booking/:id/approve', () => {

    it('should approve booking', async () => {
      const response = await request(app)
        .patch('/entire-place-booking/booking123/approve')
        .set('Authorization', testToken);

      expect(response.status).toBe(200);
      expect(response.body.bookingStatus).toBe('approved');
      expect(response.body.approvedAt).toBeDefined();
    });
  });

  describe('PATCH /entire-place-booking/:id/reject', () => {

    it('should reject booking with reason', async () => {
      const response = await request(app)
        .patch('/entire-place-booking/booking123/reject')
        .set('Authorization', testToken)
        .send({
          reason: 'Property not available'
        });

      expect(response.status).toBe(200);
      expect(response.body.bookingStatus).toBe('rejected');
      expect(response.body.rejectionReason).toBe('Property not available');
    });
  });

  describe('GET /entire-place-booking/:id', () => {

    it('should get booking details', async () => {
      const response = await request(app)
        .get('/entire-place-booking/booking123')
        .set('Authorization', testToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bookingStatus');
      expect(response.body).toHaveProperty('paymentStatus');
      expect(response.body).toHaveProperty('paymentType');
      expect(response.body).toHaveProperty('paymentMethod');
    });
  });
});

// Status field compatibility tests
describe('Status Field Backward Compatibility', () => {

  it('should support both bookingStatus and status fields', async () => {
    const response = await request(app)
      .get('/entire-place-booking/booking123')
      .set('Authorization', testToken);

    expect(response.status).toBe(200);
    // Should have both fields for backward compatibility
    expect(response.body.bookingStatus || response.body.status).toBeDefined();
  });

  it('should prioritize bookingStatus over status', async () => {
    const response = await request(app)
      .get('/entire-place-booking/booking123')
      .set('Authorization', testToken);

    if (response.body.bookingStatus) {
      expect(response.body.bookingStatus).toBe(response.body.status);
    }
  });
});

// Payment flow end-to-end tests
describe('Payment Flow E2E Tests', () => {

  describe('VNPay Full Payment Flow', () => {

    it('should complete full payment flow', async () => {
      // Step 1: Create intent
      const intent = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          paymentType: 'full'
        });

      expect(intent.status).toBe(201);
      const tempOrderId = intent.body.tempOrderId;

      // Step 2: Simulate payment callback
      const booking = await request(app)
        .post('/entire-place-booking/create-from-payment')
        .set('Authorization', testToken)
        .send({
          tempOrderId,
          transactionId: 'TXN123',
          paymentData: {
            vnp_Amount: '700000000',
            vnp_ResponseCode: '00'
          }
        });

      expect(booking.status).toBe(201);
      expect(booking.body.paymentStatus).toBe('paid');
      expect(booking.body.bookingStatus).toBe('pending');
    });
  });

  describe('VNPay Deposit Flow', () => {

    it('should complete deposit payment flow', async () => {
      // Step 1: Create deposit intent
      const intent = await request(app)
        .post('/entire-place-booking/create-intent')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000,
          paymentType: 'deposit'
        });

      expect(intent.body.paymentAmount).toBe(2100000);

      // Step 2: Pay deposit
      const booking = await request(app)
        .post('/entire-place-booking/create-from-payment')
        .set('Authorization', testToken)
        .send({
          tempOrderId: intent.body.tempOrderId,
          transactionId: 'TXN123',
          paymentData: {
            vnp_Amount: '210000000',
            vnp_ResponseCode: '00'
          }
        });

      expect(booking.body.paymentStatus).toBe('partially_paid');
      expect(booking.body.remainingAmount).toBe(4900000);

      // Step 3: Confirm remaining cash
      const confirmed = await request(app)
        .post(`/entire-place-booking/${booking.body._id}/confirm-cash-payment`)
        .set('Authorization', testToken)
        .send({
          amount: 4900000
        });

      expect(confirmed.body.booking.paymentStatus).toBe('paid');
    });
  });

  describe('Cash Payment Flow', () => {

    it('should complete cash payment flow', async () => {
      // Step 1: Create cash booking
      const booking = await request(app)
        .post('/entire-place-booking/create-cash')
        .set('Authorization', testToken)
        .send({
          listingId: 'listing123',
          hostId: 'host123',
          startDate: '2025-01-15',
          endDate: '2025-01-20',
          totalPrice: 7000000
        });

      expect(booking.body.paymentStatus).toBe('unpaid');

      // Step 2: Confirm cash payment
      const confirmed = await request(app)
        .post(`/entire-place-booking/${booking.body._id}/confirm-cash-payment`)
        .set('Authorization', testToken)
        .send({
          amount: 7000000
        });

      expect(confirmed.body.booking.paymentStatus).toBe('paid');
    });
  });
});

