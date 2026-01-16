import 'package:flutter/material.dart';
import 'package:flutter_datetime_picker_plus/flutter_datetime_picker_plus.dart';

import '../../models/listing.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../checkout/booking_checkout_screen.dart';

class CreateBookingScreen extends StatefulWidget {
  final Listing listing;

  const CreateBookingScreen({
    super.key,
    required this.listing,
  });

  @override
  State<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends State<CreateBookingScreen> {
  DateTime? _startDate;
  DateTime? _endDate;

  int get _numberOfNights {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays;
  }

  double get _totalPrice {
    return widget.listing.price * _numberOfNights;
  }

  Future<void> _selectStartDate() async {
    DatePicker.showDatePicker(
      context,
      showTitleActions: true,
      minTime: DateTime.now(),
      maxTime: DateTime.now().add(const Duration(days: 365)),
      onConfirm: (date) {
        setState(() {
          _startDate = date;
          // Reset end date if it's before new start date
          if (_endDate != null && _endDate!.isBefore(_startDate!)) {
            _endDate = null;
          }
        });
      },
      currentTime: _startDate ?? DateTime.now(),
    );
  }

  Future<void> _selectEndDate() async {
    if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select check-in date first')),
      );
      return;
    }

    DatePicker.showDatePicker(
      context,
      showTitleActions: true,
      minTime: _startDate!.add(const Duration(days: 1)),
      maxTime: _startDate!.add(const Duration(days: 365)),
      onConfirm: (date) {
        setState(() => _endDate = date);
      },
      currentTime: _endDate ?? _startDate!.add(const Duration(days: 1)),
    );
  }

  void _proceedToCheckout() {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please select check-in and check-out dates')),
      );
      return;
    }

    // Navigate to checkout screen with booking data
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingCheckoutScreen(
          listing: widget.listing,
          startDate: _startDate!,
          endDate: _endDate!,
          dayCount: _numberOfNights,
          totalPrice: _totalPrice,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Now'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Listing Info
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.listing.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.listing.shortAddress,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          PriceFormatter.formatPriceInteger(
                              widget.listing.price),
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: Theme.of(context).primaryColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        Text(
                          ' / ${widget.listing.priceType ?? 'night'}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Check-in Date
            Text(
              'Check-in',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: _selectStartDate,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Theme.of(context).dividerColor),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.calendar_today,
                        color: Theme.of(context).primaryColor),
                    const SizedBox(width: 12),
                    Text(
                      _startDate != null
                          ? DateFormatter.formatDate(_startDate!)
                          : 'Select check-in date',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Check-out Date
            Text(
              'Check-out',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: _selectEndDate,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Theme.of(context).dividerColor),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.calendar_today,
                        color: Theme.of(context).primaryColor),
                    const SizedBox(width: 12),
                    Text(
                      _endDate != null
                          ? DateFormatter.formatDate(_endDate!)
                          : 'Select check-out date',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Price Breakdown
            if (_numberOfNights > 0) ...[
              const Divider(),
              const SizedBox(height: 16),
              Text(
                'Price Details',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${PriceFormatter.formatPriceInteger(widget.listing.price)} × $_numberOfNights nights',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  Text(
                    PriceFormatter.formatPriceInteger(_totalPrice),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    PriceFormatter.formatPriceInteger(_totalPrice),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],

            // Proceed to Checkout Button
            ElevatedButton(
              onPressed: _numberOfNights > 0 ? _proceedToCheckout : null,
              child: Text(
                _numberOfNights > 0 ? 'Proceed to Checkout' : 'Select Dates',
              ),
            ),

            const SizedBox(height: 16),

            // Info Text
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Next, you'll choose your payment method and complete the booking.",
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
