import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/enums/booking_enums.dart';
import '../../../data/models/listing_model.dart';
import '../cubit/booking_cubit.dart';
import '../cubit/booking_state.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

/// Booking Review Screen for Entire Place Rental
/// Displays booking summary and 3 payment options
class BookingReviewScreen extends StatefulWidget {
  final ListingModel listing;
  final DateTime checkIn;
  final DateTime checkOut;
  final int nights;
  final double totalPrice;

  const BookingReviewScreen({
    Key? key,
    required this.listing,
    required this.checkIn,
    required this.checkOut,
    required this.nights,
    required this.totalPrice,
  }) : super(key: key);

  @override
  State<BookingReviewScreen> createState() => _BookingReviewScreenState();
}

class _BookingReviewScreenState extends State<BookingReviewScreen> {
  String _selectedPaymentMethod = 'vnpay_full'; // vnpay_full, vnpay_deposit, cash
  bool _agreedToTerms = false;

  double get depositAmount => widget.totalPrice * 0.3;
  double get remainingAmount => widget.totalPrice * 0.7;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Review Booking'),
        backgroundColor: const Color(0xFF4CAF50),
      ),
      body: BlocConsumer<BookingCubit, BookingState>(
        listener: (context, state) {
          if (state is BookingIntentCreated) {
            // Intent created, now create payment URL
            _initiatePayment(context, state.intent);
          } else if (state is BookingPaymentProcessing) {
            // Launch VNPay URL
            _launchPaymentUrl(state.paymentUrl);
          } else if (state is BookingConfirmed) {
            // Cash booking or payment completed
            Navigator.pushReplacementNamed(
              context,
              '/booking-confirmation',
              arguments: state.booking,
            );
          } else if (state is BookingError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is BookingLoading;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBookingSummary(),
                const SizedBox(height: 24),
                _buildPricingBreakdown(),
                const SizedBox(height: 24),
                _buildPaymentOptions(),
                const SizedBox(height: 24),
                _buildTermsCheckbox(),
                const SizedBox(height: 24),
                _buildConfirmButton(isLoading),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBookingSummary() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.listing.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.calendar_today,
              'Check-in',
              DateFormat('MMM dd, yyyy').format(widget.checkIn),
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              Icons.calendar_today,
              'Check-out',
              DateFormat('MMM dd, yyyy').format(widget.checkOut),
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              Icons.nights_stay,
              'Nights',
              '${widget.nights}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w500)),
        Text(value),
      ],
    );
  }

  Widget _buildPricingBreakdown() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Price Breakdown',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildPriceRow(
              '${_formatPrice(widget.listing.price)} × ${widget.nights} nights',
              _formatPrice(widget.listing.price * widget.nights),
            ),
            const Divider(height: 24),
            _buildPriceRow(
              'Total',
              _formatPrice(widget.totalPrice),
              isBold: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentOptions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Choose Payment Method',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildPaymentOption(
              value: 'vnpay_full',
              title: 'VNPay - Pay Full (100%)',
              subtitle: 'Pay ${_formatPrice(widget.totalPrice)} VND now',
              icon: Icons.credit_card,
              badge: 'Recommended',
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              value: 'vnpay_deposit',
              title: 'VNPay - Deposit (30%)',
              subtitle: 'Pay ${_formatPrice(depositAmount)} now, ${_formatPrice(remainingAmount)} at check-in',
              icon: Icons.account_balance_wallet,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              value: 'cash',
              title: 'Pay Cash at Check-in',
              subtitle: 'Pay ${_formatPrice(widget.totalPrice)} VND at property',
              icon: Icons.money,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentOption({
    required String value,
    required String title,
    required String subtitle,
    required IconData icon,
    String? badge,
  }) {
    final isSelected = _selectedPaymentMethod == value;

    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? const Color(0xFF4CAF50).withOpacity(0.1) : null,
        ),
        child: Row(
          children: [
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
              activeColor: const Color(0xFF4CAF50),
            ),
            Icon(icon, color: const Color(0xFF4CAF50)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.orange,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            badge,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      children: [
        Checkbox(
          value: _agreedToTerms,
          onChanged: (val) => setState(() => _agreedToTerms = val!),
          activeColor: const Color(0xFF4CAF50),
        ),
        const Expanded(
          child: Text(
            'I agree to the house rules, cancellation policy, and terms of service',
            style: TextStyle(fontSize: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: (!_agreedToTerms || isLoading) ? null : _handleConfirmBooking,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4CAF50),
          disabledBackgroundColor: Colors.grey[300],
        ),
        child: isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : Text(
                _getButtonText(),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
      ),
    );
  }

  String _getButtonText() {
    switch (_selectedPaymentMethod) {
      case 'vnpay_full':
        return 'Pay ${_formatPrice(widget.totalPrice)} VND';
      case 'vnpay_deposit':
        return 'Pay Deposit ${_formatPrice(depositAmount)} VND';
      case 'cash':
        return 'Request Booking (Pay Cash)';
      default:
        return 'Confirm Booking';
    }
  }

  void _handleConfirmBooking() {
    final paymentType = _selectedPaymentMethod == 'vnpay_full'
        ? 'full'
        : _selectedPaymentMethod == 'vnpay_deposit'
            ? 'deposit'
            : 'cash';

    context.read<BookingCubit>().createBookingIntent(
          listingId: widget.listing.id,
          hostId: widget.listing.creator, // Use creator field directly
          checkIn: widget.checkIn,
          checkOut: widget.checkOut,
          totalPrice: widget.totalPrice,
          paymentType: paymentType,
        );
  }

  void _initiatePayment(BuildContext context, intent) {
    final returnUrl = 'yourapp://payment-callback'; // Deep link for app

    context.read<BookingCubit>().initiateVNPayPayment(
          intent: intent,
          returnUrl: returnUrl,
        );
  }

  Future<void> _launchPaymentUrl(String? url) async {
    if (url == null) return;

    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cannot open payment page')),
        );
      }
    }
  }

  String _formatPrice(double price) {
    return NumberFormat('#,###', 'vi_VN').format(price);
  }
}

