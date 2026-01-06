/**
 * Unit Tests for Payment Flows v2.0
 * Tests bookingService methods
 */

const bookingService = require('../services/bookingService');
const Booking = require('../models/Booking');
const BookingIntent = require('../models/BookingIntent');
const Listing = require('../models/Listing');

// Mock database
jest.mock('../models/Booking');
jest.mock('../models/BookingIntent');
jest.mock('../models/Listing');

describe('Payment Flows v2.0 - Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const mockListing = {
    _id: 'listing123',
    price: 1400000,
    title: 'Test Listing'
  };

  const mockBookingData = {
    listingId: 'listing123',
    customerId: 'customer123',
    hostId: 'host123',
    startDate: '2025-01-15',
    endDate: '2025-01-20',
    totalPrice: 7000000
  };

  describe('createBookingIntent()', () => {

    it('should create BookingIntent with full payment', async () => {
      // Mock
      Booking.find.mockResolvedValue([]); // No conflicts
      Listing.findById.mockResolvedValue(mockListing);
      BookingIntent.prototype.save = jest.fn().mockResolvedValue(true);

      // Execute
      const result = await bookingService.createBookingIntent(mockBookingData, 'full');

      // Assert
      expect(result).toBeDefined();
      expect(result.tempOrderId).toContain('INTENT_');
      expect(result.paymentAmount).toBe(7000000);
      expect(BookingIntent.prototype.save).toHaveBeenCalled();
    });

    it('should create BookingIntent with 30% deposit', async () => {
      // Mock
      Booking.find.mockResolvedValue([]);
      Listing.findById.mockResolvedValue(mockListing);
      BookingIntent.prototype.save = jest.fn().mockResolvedValue(true);

      // Execute
      const result = await bookingService.createBookingIntent(mockBookingData, 'deposit');

      // Assert
      expect(result).toBeDefined();
      expect(result.paymentAmount).toBe(2100000); // 30% of 7M
      expect(BookingIntent.prototype.save).toHaveBeenCalled();
    });

    it('should reject if dates are not available', async () => {
      // Mock conflict
      Booking.find.mockResolvedValue([{ _id: 'existing123', bookingStatus: 'approved' }]);
      Listing.findById.mockResolvedValue(mockListing);

      // Execute & Assert
      await expect(
        bookingService.createBookingIntent(mockBookingData, 'full')
      ).rejects.toThrow('Dates not available');
    });

    it('should generate unique tempOrderId', async () => {
      // Mock
      Booking.find.mockResolvedValue([]);
      Listing.findById.mockResolvedValue(mockListing);
      BookingIntent.prototype.save = jest.fn().mockResolvedValue(true);

      // Execute twice
      const result1 = await bookingService.createBookingIntent(mockBookingData, 'full');
      const result2 = await bookingService.createBookingIntent(mockBookingData, 'full');

      // Assert
      expect(result1.tempOrderId).not.toBe(result2.tempOrderId);
    });
  });

  describe('createBookingFromPayment()', () => {

    const mockPaymentData = {
      vnp_Amount: '700000000', // 7M * 100 (VNPay sends in cents)
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'TXN123'
    };

    it('should create booking from BookingIntent (full payment)', async () => {
      // Mock BookingIntent
      const mockIntent = {
        _id: 'intent123',
        tempOrderId: 'INTENT_123',
        customerId: 'customer123',
        hostId: 'host123',
        listingId: 'listing123',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        totalPrice: 7000000,
        paymentType: 'full',
        paymentAmount: 7000000
      };

      BookingIntent.findOne.mockResolvedValue(mockIntent);
      BookingIntent.findByIdAndDelete.mockResolvedValue(true);

      const mockBooking = {
        _id: 'booking123',
        bookingStatus: 'pending',
        paymentStatus: 'paid',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };

      Booking.mockImplementation(() => mockBooking);

      // Execute
      const result = await bookingService.createBookingFromPayment(
        'INTENT_123',
        'TXN123',
        mockPaymentData
      );

      // Assert
      expect(BookingIntent.findOne).toHaveBeenCalledWith({ tempOrderId: 'INTENT_123' });
      expect(mockBooking.bookingStatus).toBe('pending');
      expect(mockBooking.paymentStatus).toBe('paid');
      expect(BookingIntent.findByIdAndDelete).toHaveBeenCalledWith('intent123');
    });

    it('should create booking with partially_paid status for deposit', async () => {
      // Mock BookingIntent (deposit)
      const mockIntent = {
        _id: 'intent123',
        tempOrderId: 'INTENT_123',
        customerId: 'customer123',
        hostId: 'host123',
        listingId: 'listing123',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        totalPrice: 7000000,
        paymentType: 'deposit',
        paymentAmount: 2100000,
        depositAmount: 2100000,
        remainingAmount: 4900000
      };

      BookingIntent.findOne.mockResolvedValue(mockIntent);
      BookingIntent.findByIdAndDelete.mockResolvedValue(true);

      const mockBooking = {
        _id: 'booking123',
        bookingStatus: 'pending',
        paymentStatus: 'partially_paid',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };

      Booking.mockImplementation(() => mockBooking);

      const depositPaymentData = {
        vnp_Amount: '210000000', // 2.1M * 100
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'TXN123'
      };

      // Execute
      const result = await bookingService.createBookingFromPayment(
        'INTENT_123',
        'TXN123',
        depositPaymentData
      );

      // Assert
      expect(mockBooking.paymentStatus).toBe('partially_paid');
      expect(mockBooking.depositAmount).toBe(2100000);
      expect(mockBooking.remainingAmount).toBe(4900000);
    });

    it('should reject if BookingIntent not found', async () => {
      BookingIntent.findOne.mockResolvedValue(null);

      await expect(
        bookingService.createBookingFromPayment('INVALID', 'TXN123', mockPaymentData)
      ).rejects.toThrow();
    });

    it('should reject if payment amount mismatch', async () => {
      const mockIntent = {
        paymentAmount: 7000000
      };

      BookingIntent.findOne.mockResolvedValue(mockIntent);

      const wrongPaymentData = {
        vnp_Amount: '500000000', // Wrong amount
        vnp_ResponseCode: '00'
      };

      await expect(
        bookingService.createBookingFromPayment('INTENT_123', 'TXN123', wrongPaymentData)
      ).rejects.toThrow('Payment amount mismatch');
    });
  });

  describe('createCashBooking()', () => {

    it('should create booking with unpaid status', async () => {
      // Mock
      Booking.find.mockResolvedValue([]); // No conflicts
      Listing.findById.mockResolvedValue(mockListing);

      const mockBooking = {
        _id: 'booking123',
        bookingStatus: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Booking.mockImplementation(() => mockBooking);

      // Execute
      const result = await bookingService.createCashBooking(mockBookingData);

      // Assert
      expect(mockBooking.bookingStatus).toBe('pending');
      expect(mockBooking.paymentStatus).toBe('unpaid');
      expect(mockBooking.paymentMethod).toBe('cash');
      expect(mockBooking.paymentType).toBe('cash');
    });
  });

  describe('confirmCashPayment()', () => {

    it('should update unpaid to paid for cash bookings', async () => {
      // Mock
      const mockBooking = {
        _id: 'booking123',
        hostId: { toString: () => 'host123' },
        customerId: 'customer123',
        listingId: 'listing123',
        totalPrice: 7000000,
        paymentStatus: 'unpaid',
        paymentHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Booking.findById.mockResolvedValue(mockBooking);

      // Execute
      const result = await bookingService.confirmCashPayment(
        'booking123',
        'host123',
        { amount: 7000000, notes: 'Cash received' }
      );

      // Assert
      expect(mockBooking.paymentStatus).toBe('paid');
      expect(mockBooking.paidAmount).toBe(7000000);
      expect(mockBooking.remainingAmount).toBe(0);
      expect(mockBooking.paymentHistory.length).toBe(1);
    });

    it('should update partially_paid to paid for deposit bookings', async () => {
      // Mock
      const mockBooking = {
        _id: 'booking123',
        hostId: { toString: () => 'host123' },
        customerId: 'customer123',
        listingId: 'listing123',
        totalPrice: 7000000,
        paymentStatus: 'partially_paid',
        depositAmount: 2100000,
        remainingAmount: 4900000,
        paymentHistory: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Booking.findById.mockResolvedValue(mockBooking);

      // Execute
      const result = await bookingService.confirmCashPayment(
        'booking123',
        'host123',
        { amount: 4900000, notes: 'Remaining payment received' }
      );

      // Assert
      expect(mockBooking.paymentStatus).toBe('paid');
      expect(mockBooking.paidAmount).toBe(7000000);
      expect(mockBooking.remainingAmount).toBe(0);
    });

    it('should reject unauthorized access', async () => {
      const mockBooking = {
        hostId: { toString: () => 'host123' }
      };

      Booking.findById.mockResolvedValue(mockBooking);

      await expect(
        bookingService.confirmCashPayment('booking123', 'wronghost', { amount: 7000000 })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('approveBooking()', () => {

    it('should update bookingStatus to approved', async () => {
      const mockBooking = {
        _id: 'booking123',
        hostId: { toString: () => 'host123' },
        bookingStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Booking.findById.mockResolvedValue(mockBooking);

      // Execute
      const result = await bookingService.approveBooking('booking123', 'host123');

      // Assert
      expect(mockBooking.bookingStatus).toBe('approved');
      expect(mockBooking.approvedAt).toBeDefined();
      expect(mockBooking.save).toHaveBeenCalled();
    });
  });

  describe('rejectBooking()', () => {

    it('should update bookingStatus to rejected', async () => {
      const mockBooking = {
        _id: 'booking123',
        hostId: { toString: () => 'host123' },
        bookingStatus: 'pending',
        paymentStatus: 'unpaid',
        save: jest.fn().mockResolvedValue(true)
      };

      Booking.findById.mockResolvedValue(mockBooking);

      // Execute
      const result = await bookingService.rejectBooking('booking123', 'host123', 'Not available');

      // Assert
      expect(mockBooking.bookingStatus).toBe('rejected');
      expect(mockBooking.rejectionReason).toBe('Not available');
    });
  });

  describe('checkAvailability()', () => {

    it('should return available if no conflicts', async () => {
      Booking.find.mockResolvedValue([]);
      Listing.findById.mockResolvedValue(mockListing);

      const result = await bookingService.checkAvailability(
        'listing123',
        '2025-01-15',
        '2025-01-20'
      );

      expect(result.available).toBe(true);
      expect(result.conflicts.length).toBe(0);
      expect(result.pricing).toBeDefined();
    });

    it('should return unavailable if conflicts exist', async () => {
      const mockConflict = {
        _id: 'booking123',
        bookingStatus: 'approved',
        startDate: '2025-01-16',
        endDate: '2025-01-19'
      };

      Booking.find.mockResolvedValue([mockConflict]);
      Listing.findById.mockResolvedValue(mockListing);

      const result = await bookingService.checkAvailability(
        'listing123',
        '2025-01-15',
        '2025-01-20'
      );

      expect(result.available).toBe(false);
      expect(result.conflicts.length).toBe(1);
    });

    it('should query both bookingStatus and status for compatibility', async () => {
      Booking.find.mockResolvedValue([]);
      Listing.findById.mockResolvedValue(mockListing);

      await bookingService.checkAvailability(
        'listing123',
        '2025-01-15',
        '2025-01-20'
      );

      const query = Booking.find.mock.calls[0][0];
      expect(query.$or).toBeDefined();
      // Should check both new bookingStatus and old status fields
    });
  });
});

// Export for running
module.exports = {
  name: 'Payment Flows v2.0 Unit Tests'
};

