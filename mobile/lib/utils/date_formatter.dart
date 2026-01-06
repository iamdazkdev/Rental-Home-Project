import 'package:intl/intl.dart';

class DateFormatter {
  // Format date to dd/MM/yyyy
  static String formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  // Format date to dd MMM yyyy (e.g., 24 Dec 2025)
  static String formatDateMedium(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  // Format date to full format (e.g., Tuesday, December 24, 2025)
  static String formatDateFull(DateTime date) {
    return DateFormat('EEEE, MMMM dd, yyyy').format(date);
  }

  // Format month and year (e.g., December 2025)
  static String formatMonthYear(DateTime date) {
    return DateFormat('MMMM yyyy').format(date);
  }

  // Format time to HH:mm
  static String formatTime(DateTime date) {
    return DateFormat('HH:mm').format(date);
  }

  // Format date and time
  static String formatDateTime(DateTime date) {
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  // Get relative time (e.g., "2 hours ago", "Yesterday", "Last week")
  static String getRelativeTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }

  // Calculate nights between two dates
  static int calculateNights(DateTime checkIn, DateTime checkOut) {
    return checkOut.difference(checkIn).inDays;
  }

  // Check if date is in the past
  static bool isPast(DateTime date) {
    return date.isBefore(DateTime.now());
  }

  // Check if date is in the future
  static bool isFuture(DateTime date) {
    return date.isAfter(DateTime.now());
  }

  // Check if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  // Format date range (e.g., "Dec 24 - Dec 31, 2025")
  static String formatDateRange(DateTime start, DateTime end) {
    if (start.year == end.year && start.month == end.month) {
      return '${DateFormat('MMM dd').format(start)} - ${DateFormat('dd, yyyy').format(end)}';
    } else if (start.year == end.year) {
      return '${DateFormat('MMM dd').format(start)} - ${DateFormat('MMM dd, yyyy').format(end)}';
    } else {
      return '${DateFormat('MMM dd, yyyy').format(start)} - ${DateFormat('MMM dd, yyyy').format(end)}';
    }
  }
}

