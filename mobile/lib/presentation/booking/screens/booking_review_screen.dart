import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../data/models/listing_model.dart';
import '../cubit/booking_cubit.dart';
import '../cubit/booking_state.dart';
import 'vnpay_payment_screen.dart';

/// Booking Review Screen for Entire Place Rental
class BookingReviewScreen extends StatefulWidget {
  final ListingModel listing;
  final DateTime checkIn;
  final DateTime checkOut;
  final int nights;
  final double totalPrice;

  const BookingReviewScreen({
    super.key,
    required this.listing,
    required this.checkIn,
    required this.checkOut,
    required this.nights,
    required this.totalPrice,
  });

  @override
  State<BookingReviewScreen> createState() => _BookingReviewScreenState();
}

class _BookingReviewScreenState extends State<BookingReviewScreen> {
  String _selectedPaymentMethod =
      'vnpay_full'; // vnpay_full, vnpay_deposit, cash
  bool _agreedToTerms = false;
  bool _isProcessingPayment = false;

  double get depositAmount => widget.totalPrice * 0.3;

  double get remainingAmount => widget.totalPrice * 0.7;

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Prevent back during payment processing
        if (_isProcessingPayment) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please wait, payment is being processed...'),
              backgroundColor: Colors.orange,
            ),
          );
          return false;
        }
        return true;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Review Booking'),
          backgroundColor: const Color(0xFF4CAF50),
        ),
        body: Stack(
          children: [
            BlocConsumer<BookingCubit, BookingState>(
              listener: (context, state) {
                if (state is BookingIntentCreated) {
                  // Intent created, now create payment URL
                  setState(() => _isProcessingPayment = true);
                  _initiatePayment(context, state.intent);
                } else if (state is BookingPaymentProcessing) {
                  // Launch VNPay URL with tempOrderId
                  _launchPaymentUrl(state.paymentUrl, state.paymentId);
                } else if (state is BookingConfirmed) {
                  // Cash booking or payment completed
                  setState(() => _isProcessingPayment = false);
                  Navigator.pushReplacementNamed(
                    context,
                    '/booking-confirmation',
                    arguments: state.booking,
                  );
                } else if (state is BookingError) {
                  setState(() => _isProcessingPayment = false);
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
            // Processing overlay
            if (_isProcessingPayment)
              Container(
                color: Colors.black54,
                child: const Center(
                  child: Card(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Color(0xFF4CAF50),
                            ),
                          ),
                          SizedBox(height: 16),
                          Text(
                            'Processing your booking...',
                            style: TextStyle(fontSize: 16),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Please do not close this screen',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
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
              // badge: 'Recommended',
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              value: 'vnpay_deposit',
              title: 'VNPay - Deposit (30%)',
              subtitle:
                  'Pay ${_formatPrice(depositAmount)} now, ${_formatPrice(remainingAmount)} at check-in',
              icon: Icons.account_balance_wallet,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              value: 'cash',
              title: 'Pay Cash at Check-in',
              subtitle:
                  'Pay ${_formatPrice(widget.totalPrice)} VND at property',
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
            const SizedBox(width: 8),
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
        onPressed:
            (!_agreedToTerms || isLoading) ? null : _handleConfirmBooking,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4CAF50),
          disabledBackgroundColor: Colors.grey[300],
        ),
        child: isLoading
            ? const CircularProgressIndicator(color: Colors.white)
            : Text(
                _getButtonText(),
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
          hostId: widget.listing.creator,
          // Use creator field directly
          checkIn: widget.checkIn,
          checkOut: widget.checkOut,
          totalPrice: widget.totalPrice,
          paymentType: paymentType,
        );
  }

  void _initiatePayment(BuildContext context, intent) {
    // Use localhost returnUrl for mobile webview (same as web)
    // After VNPay redirects, we'll detect URL change and handle it
    final returnUrl = 'http://192.168.1.180:3000/entire-place/vnpay-callback';

    context.read<BookingCubit>().initiateVNPayPayment(
          intent: intent,
          returnUrl: returnUrl,
        );
  }

  Future<void> _launchPaymentUrl(String? url, String tempOrderId) async {
    if (url == null) return;

    debugPrint('🚀 Launching VNPay payment: $url');
    debugPrint('📝 Temp Order ID: $tempOrderId');

    // Navigate to VNPayPaymentScreen which handles the payment flow
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => VNPayPaymentScreen(
          paymentUrl: url,
          tempOrderId: tempOrderId,
        ),
      ),
    );

    // Reset processing state when returning
    setState(() => _isProcessingPayment = false);

    if (result != null && mounted) {
      if (result['success'] == true) {
        // Payment successful - create booking from payment
        final tempOrderIdFromResult = result['tempOrderId'] as String;
        final transactionId = result['transactionId'] as String;
        final paymentData = result['paymentData'] as Map<String, dynamic>;

        debugPrint('✅ Payment successful, creating booking...');
        debugPrint('   - tempOrderId: $tempOrderIdFromResult');
        debugPrint('   - transactionId: $transactionId');

        // Show processing state again
        setState(() => _isProcessingPayment = true);

        // Call cubit to create booking from payment callback
        context.read<BookingCubit>().createBookingFromPayment(
              tempOrderId: tempOrderIdFromResult,
              transactionId: transactionId,
              paymentData: paymentData,
            );
      } else {
        // Payment failed - result already handled by PaymentFailedScreen
        final responseCode = result['responseCode'] as String?;
        debugPrint('❌ Payment failed with code: $responseCode');

        // User already saw the error screen, just stay on review screen
      }
    } else if (mounted) {
      // User closed the payment screen without completing
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment was cancelled'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  String _formatPrice(double price) {
    return NumberFormat('#,###', 'vi_VN').format(price);
  }
}
