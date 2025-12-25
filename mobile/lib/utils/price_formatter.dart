/// Price Formatter Utility
/// Format prices according to Vietnamese standard (8000000 → 8.000.000)

/// Format number to Vietnamese price format with dots as thousand separator
///
/// Example:
/// ```dart
/// formatVND(8000000) // "8.000.000 VND"
/// formatVND(3500, showCurrency: false) // "3.500"
/// ```
String formatVND(num? amount, {bool showCurrency = true}) {
  if (amount == null) return showCurrency ? '0 VND' : '0';

  // Round to nearest integer (VND has no decimals)
  final rounded = amount.round();

  // Convert to string and add dots as thousand separator
  final str = rounded.toString();
  final buffer = StringBuffer();

  for (int i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 == 0) {
      buffer.write('.');
    }
    buffer.write(str[i]);
  }

  final formatted = buffer.toString();
  return showCurrency ? '$formatted VND' : formatted;
}

/// Price Formatter Class for backward compatibility
class PriceFormatter {
  /// Format price as integer with VND suffix (Vietnamese format)
  /// Example: 8000000 → "8.000.000 VND"
  static String formatPriceInteger(num? price) {
    return _formatVND(price);
  }

  /// Format price without currency
  /// Example: 8000000 → "8.000.000"
  static String formatPrice(num? price) {
    return _formatVND(price, showCurrency: false);
  }

  /// Format as VND with currency
  static String formatVND(num? price) {
    return _formatVND(price, showCurrency: true);
  }

  /// Internal formatter
  static String _formatVND(num? amount, {bool showCurrency = true}) {
    if (amount == null) return showCurrency ? '0 VND' : '0';

    final rounded = amount.round();
    final str = rounded.toString();
    final buffer = StringBuffer();

    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(str[i]);
    }

    final formatted = buffer.toString();
    return showCurrency ? '$formatted VND' : formatted;
  }
}

/// Format price per night
/// Example: "3.500/đêm"
String formatPricePerNight(num? amount) {
  return '${formatVND(amount, showCurrency: false)}/đêm';
}

/// Format price per month
/// Example: "8.000.000/tháng"
String formatPricePerMonth(num? amount) {
  return '${formatVND(amount, showCurrency: false)}/tháng';
}

/// Format price range
/// Example: "3.000.000 - 8.000.000 VND"
String formatPriceRange(num? min, num? max) {
  return '${formatVND(min, showCurrency: false)} - ${formatVND(max, showCurrency: false)} VND';
}

/// Parse Vietnamese formatted price to number
/// Example: "8.000.000" → 8000000
num parseVND(String formattedPrice) {
  if (formattedPrice.isEmpty) return 0;

  // Remove all dots and non-numeric characters except digits
  final cleaned = formattedPrice.replaceAll('.', '').replaceAll(RegExp(r'[^\d]'), '');

  return int.tryParse(cleaned) ?? 0;
}

/// Format large numbers in compact form
/// Example: 8000000 → "8 tr", 1000000000 → "1 tỷ"
String formatCompact(num? amount) {
  if (amount == null) return '0';

  final rounded = amount.round();

  if (rounded >= 1000000000) {
    return '${(rounded / 1000000000).toStringAsFixed(1)} tỷ';
  } else if (rounded >= 1000000) {
    return '${(rounded / 1000000).toStringAsFixed(1)} tr';
  } else if (rounded >= 1000) {
    return '${(rounded / 1000).toStringAsFixed(0)} k';
  }

  return rounded.toString();
}

