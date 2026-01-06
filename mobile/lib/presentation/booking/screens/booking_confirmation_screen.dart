import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../data/models/booking_model.dart';
import '../../../core/enums/booking_enums.dart';

/// Booking Confirmation Screen
/// Shows booking details after successful payment/booking
class BookingConfirmationScreen extends StatelessWidget {
  final BookingModel booking;

  const BookingConfirmationScreen({
    Key? key,
    required this.booking,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking Confirmed'),
        backgroundColor: const Color(0xFF4CAF50),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildSuccessIcon(),
            const SizedBox(height: 24),
            _buildSuccessMessage(),
            const SizedBox(height: 32),
            _buildBookingDetails(),
            const SizedBox(height: 24),
            _buildPaymentInfo(),
            const SizedBox(height: 32),
            _buildActionButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessIcon() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: const Color(0xFF4CAF50).withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: const Icon(
        Icons.check_circle,
        size: 60,
        color: Color(0xFF4CAF50),
      ),
    );
  }

  Widget _buildSuccessMessage() {
    return Column(
      children: [
        const Text(
          'Booking Successful!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _getStatusMessage(),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  String _getStatusMessage() {
    if (booking.paymentMethod == PaymentMethod.vnpay && booking.paymentType == PaymentType.full) {
      return 'Your payment was successful and booking is confirmed!';
    } else if (booking.paymentMethod == PaymentMethod.vnpay && booking.paymentType == PaymentType.deposit) {
      return 'Deposit paid successfully! Pay remaining amount before check-in.';
    } else {
      return 'Your booking request has been sent to the host.';
    }
  }

  Widget _buildBookingDetails() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Booking Details',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(height: 24),
            _buildDetailRow('Booking ID', booking.id.substring(0, 8)),
            const SizedBox(height: 12),
            _buildDetailRow(
              'Check-in',
              DateFormat('MMM dd, yyyy').format(booking.startDate),
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              'Check-out',
              DateFormat('MMM dd, yyyy').format(booking.endDate),
            ),
            const SizedBox(height: 12),
            _buildDetailRow(
              'Total Amount',
              _formatPrice(booking.finalTotalPrice ?? booking.totalPrice),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Payment Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(height: 24),
            _buildDetailRow(
              'Payment Method',
              booking.paymentMethod == PaymentMethod.vnpay ? 'VNPay' : 'Cash',
            ),
            const SizedBox(height: 12),
            if (booking.paymentMethod == PaymentMethod.vnpay && booking.paymentType == PaymentType.full)
              _buildDetailRow(
                'Paid (100%)',
                _formatPrice(booking.finalTotalPrice ?? booking.totalPrice),
                valueColor: Colors.green,
              ),
            if (booking.paymentMethod == PaymentMethod.vnpay && booking.paymentType == PaymentType.deposit) ...[
              _buildDetailRow(
                'Deposit Paid (${booking.depositPercentage.toInt()}%)',
                _formatPrice(booking.depositAmount),
                valueColor: Colors.green,
              ),
              const SizedBox(height: 12),
              _buildDetailRow(
                'Remaining',
                _formatPrice(booking.remainingAmount),
                valueColor: Colors.orange,
              ),
            ],
            if (booking.paymentMethod == PaymentMethod.cash)
              _buildDetailRow(
                'Pay at Check-in',
                _formatPrice(booking.finalTotalPrice ?? booking.totalPrice),
                valueColor: Colors.orange,
              ),
            if (booking.transactionId != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                'Transaction ID',
                booking.transactionId!.substring(0, 10),
              ),
            ],
            if (booking.paidAt != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                'Payment Time',
                DateFormat('HH:mm:ss dd/MM/yyyy').format(booking.paidAt!),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey[600]),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/trips',
                (route) => route.isFirst,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4CAF50),
            ),
            icon: const Icon(Icons.list_alt),
            label: const Text(
              'View My Trips',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/',
                (route) => false,
              );
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF4CAF50)),
            ),
            icon: const Icon(Icons.home, color: Color(0xFF4CAF50)),
            label: const Text(
              'Back to Home',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF4CAF50),
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatPrice(double price) {
    return '${NumberFormat('#,###', 'vi_VN').format(price)} VND';
  }
}

