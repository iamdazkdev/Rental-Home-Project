/**
 * Payment Method Types
 */
export const PaymentMethod = {
  VNPAY_FULL: 'vnpay_full',
  VNPAY_DEPOSIT: 'vnpay_deposit',
  CASH: 'cash',
};

/**
 * Payment Status Types
 */
export const PaymentStatus = {
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  UNPAID: 'unpaid',
};

/**
 * Booking Status Types
 */
export const BookingStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  CHECKED_OUT: 'checked_out',
};

/**
 * Extension Status Types
 */
export const ExtensionStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * Listing Status Types
 */
export const ListingStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

/**
 * User Role Types
 */
export const UserRole = {
  USER: 'user',
  HOST: 'host',
  ADMIN: 'admin',
};

/**
 * Property Type Types
 */
export const PropertyType = {
  ENTIRE_PLACE: 'An entire place',
  ROOM: 'A room',
  SHARED_ROOM: 'A shared room',
};

export default {
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
  ExtensionStatus,
  ListingStatus,
  UserRole,
  PropertyType,
};

