import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../data/models/listing_model.dart';
import '../../../utils/price_formatter.dart';

/// Booking Widget for Entire Place Rental
/// Shows date picker and initiates booking flow
class BookingWidget extends StatefulWidget {
  final ListingModel listing;

  const BookingWidget({
    super.key,
    required this.listing,
  });

  @override
  State<BookingWidget> createState() => _BookingWidgetState();
}

class _BookingWidgetState extends State<BookingWidget> {
  DateTime? _checkInDate;
  DateTime? _checkOutDate;
  int _nights = 0;
  double _totalPrice = 0.0;

  @override
  void initState() {
    super.initState();
    _calculatePrice();
  }

  void _calculatePrice() {
    if (_checkInDate != null && _checkOutDate != null) {
      final difference = _checkOutDate!.difference(_checkInDate!);
      _nights = difference.inDays;
      _totalPrice = widget.listing.price * _nights;
    } else {
      _nights = 0;
      _totalPrice = 0.0;
    }
  }

  Future<void> _selectCheckInDate() async {
    final now = DateTime.now();
    final initialDate = _checkInDate ?? now;

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate.isAfter(now) ? initialDate : now,
      firstDate: now,
      lastDate: DateTime(now.year + 2),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF4CAF50),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null) {
      setState(() {
        _checkInDate = pickedDate;
        // Reset checkout if it's before new checkin
        if (_checkOutDate != null &&
            _checkOutDate!.isBefore(pickedDate.add(const Duration(days: 1)))) {
          _checkOutDate = null;
        }
        _calculatePrice();
      });
    }
  }

  Future<void> _selectCheckOutDate() async {
    if (_checkInDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select check-in date first')),
      );
      return;
    }

    final minCheckOut = _checkInDate!.add(const Duration(days: 1));
    final initialDate = _checkOutDate ?? minCheckOut;

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate.isAfter(minCheckOut) ? initialDate : minCheckOut,
      firstDate: minCheckOut,
      lastDate: DateTime(_checkInDate!.year + 2),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF4CAF50),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null) {
      setState(() {
        _checkOutDate = pickedDate;
        _calculatePrice();
      });
    }
  }

  void _proceedToReview() {
    if (_checkInDate == null || _checkOutDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please select check-in and check-out dates')),
      );
      return;
    }

    if (_nights < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum 1 night required')),
      );
      return;
    }

    // Navigate to booking review screen
    Navigator.pushNamed(
      context,
      '/booking-review',
      arguments: {
        'listing': widget.listing,
        'checkIn': _checkInDate,
        'checkOut': _checkOutDate,
        'nights': _nights,
        'totalPrice': _totalPrice,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Price per night
            Row(
              children: [
                Text(
                  PriceFormatter.formatPriceInteger(widget.listing.price),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF4CAF50),
                  ),
                ),
                const Text(
                  ' / night',
                  style: TextStyle(fontSize: 16),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),

            // Check-in date
            _buildDateButton(
              label: 'Check-in',
              date: _checkInDate,
              onTap: _selectCheckInDate,
            ),

            const SizedBox(height: 12),

            // Check-out date
            _buildDateButton(
              label: 'Check-out',
              date: _checkOutDate,
              onTap: _selectCheckOutDate,
            ),

            if (_nights > 0) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),

              // Price breakdown
              _buildPriceRow(
                '${PriceFormatter.formatPriceInteger(widget.listing.price)} × $_nights nights',
                PriceFormatter.formatPriceInteger(_totalPrice),
              ),

              const SizedBox(height: 8),
              _buildPriceRow(
                'Service fee',
                'Included',
                isTotal: false,
              ),

              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 12),

              // Total
              _buildPriceRow(
                'Total',
                PriceFormatter.formatPriceInteger(_totalPrice),
                isTotal: true,
              ),
            ],

            const SizedBox(height: 20),

            // Reserve button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _proceedToReview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4CAF50),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Reserve',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            if (_nights > 0) ...[
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'You won\'t be charged yet',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDateButton({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  date != null
                      ? DateFormat('MMM dd, yyyy').format(date)
                      : 'Select date',
                  style: TextStyle(
                    fontSize: 14,
                    color: date != null ? Colors.black : Colors.grey,
                  ),
                ),
              ],
            ),
            const Icon(Icons.calendar_today, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
