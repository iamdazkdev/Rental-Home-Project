class PriceFormatter {
  // Format price with currency symbol
  static String formatPrice(double price, {String currency = '\$'}) {
    if (price >= 1000000) {
      return '$currency${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '$currency${(price / 1000).toStringAsFixed(1)}K';
    } else {
      return '$currency${price.toStringAsFixed(0)}';
    }
  }

  // Format price with exact value
  static String formatPriceExact(double price, {String currency = '\$'}) {
    return '$currency${price.toStringAsFixed(2)}';
  }

  // Format price without decimals
  static String formatPriceInteger(double price, {String currency = '\$'}) {
    return '$currency${price.toStringAsFixed(0)}';
  }

  // Format price with comma separators
  static String formatPriceWithCommas(double price, {String currency = '\$'}) {
    final parts = price.toStringAsFixed(2).split('.');
    final intPart = parts[0];
    final decPart = parts[1];

    final formattedInt = intPart.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );

    return '$currency$formattedInt.$decPart';
  }

  // Calculate total price
  static double calculateTotalPrice(double pricePerNight, int nights) {
    return pricePerNight * nights;
  }

  // Calculate price with extension fee (30% increase)
  static double calculateExtensionPrice(double pricePerNight, int extensionDays) {
    const extensionMultiplier = 1.3; // 30% increase
    return pricePerNight * extensionMultiplier * extensionDays;
  }

  // Convert monthly price to daily
  static double monthlyToDaily(double monthlyPrice) {
    return monthlyPrice / 30;
  }

  // Convert daily price to monthly
  static double dailyToMonthly(double dailyPrice) {
    return dailyPrice * 30;
  }

  // Format price range
  static String formatPriceRange(double minPrice, double maxPrice, {String currency = '\$'}) {
    return '${formatPriceInteger(minPrice, currency: currency)} - ${formatPriceInteger(maxPrice, currency: currency)}';
  }
}

