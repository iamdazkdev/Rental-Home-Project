/**
 * Price Formatter Utility
 * Format prices according to Vietnamese standard (8000000 → 8.000.000)
 */

/**
 * Format number to Vietnamese price format
 * @param {number} amount - Amount to format
 * @param {boolean} showCurrency - Whether to show VND suffix (default: true)
 * @returns {string} Formatted price (e.g., "8.000.000 VND")
 */
export const formatVND = (amount, showCurrency = true) => {
  if (amount === null || amount === undefined) return showCurrency ? '0 VND' : '0';

  // Round to nearest integer (VND has no decimals)
  const rounded = Math.round(amount);

  // Format with dot as thousand separator (Vietnamese standard)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return showCurrency ? `${formatted} VND` : formatted;
};

/**
 * Format price per night
 * @param {number} amount - Amount per night
 * @returns {string} Formatted price with "/đêm" suffix
 */
export const formatPricePerNight = (amount) => {
  return `${formatVND(amount, false)}/đêm`;
};

/**
 * Format price per month
 * @param {number} amount - Amount per month
 * @returns {string} Formatted price with "/tháng" suffix
 */
export const formatPricePerMonth = (amount) => {
  return `${formatVND(amount, false)}/tháng`;
};

/**
 * Format price range
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {string} Formatted price range
 */
export const formatPriceRange = (min, max) => {
  return `${formatVND(min, false)} - ${formatVND(max, false)} VND`;
};

/**
 * Parse Vietnamese formatted price to number
 * @param {string} formattedPrice - Price string (e.g., "8.000.000")
 * @returns {number} Parsed number
 */
export const parseVND = (formattedPrice) => {
  if (!formattedPrice) return 0;

  // Remove all dots and non-numeric characters except digits
  const cleaned = formattedPrice.replace(/\./g, '').replace(/[^\d]/g, '');

  return parseInt(cleaned, 10) || 0;
};

/**
 * Format large numbers in compact form
 * @param {number} amount - Amount to format
 * @returns {string} Compact format (e.g., "8 tr" for 8 million)
 */
export const formatCompact = (amount) => {
  if (amount === null || amount === undefined) return '0';

  const rounded = Math.round(amount);

  if (rounded >= 1000000000) {
    return `${(rounded / 1000000000).toFixed(1)} tỷ`;
  } else if (rounded >= 1000000) {
    return `${(rounded / 1000000).toFixed(1)} tr`;
  } else if (rounded >= 1000) {
    return `${(rounded / 1000).toFixed(0)} k`;
  }

  return rounded.toString();
};

export default {
  formatVND,
  formatPricePerNight,
  formatPricePerMonth,
  formatPriceRange,
  parseVND,
  formatCompact,
};

