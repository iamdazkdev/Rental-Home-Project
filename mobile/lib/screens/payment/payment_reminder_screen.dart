import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/booking.dart';
import '../../presentation/booking/cubit/booking_cubit.dart';
import '../../presentation/booking/cubit/booking_state.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/loading_overlay.dart';

class PaymentReminderScreen extends StatefulWidget {
  final String bookingId;

  const PaymentReminderScreen({
    super.key,
    required this.bookingId,
  });

  @override
  State<PaymentReminderScreen> createState() => _PaymentReminderScreenState();
}

class _PaymentReminderScreenState extends State<PaymentReminderScreen> {
  bool _isLoading = false;
  BookingModel? _booking;

  @override
  void initState() {
    super.initState();
    _loadBookingDetails();
  }

  Future<void> _loadBookingDetails() async {
    setState(() => _isLoading = true);
    try {
      final cubit = context.read<BookingCubit>();
      await cubit.fetchBookingById(widget.bookingId);

      final state = cubit.state;
      if (state is BookingLoaded) {
        setState(() {
          _booking = state.booking;
        });
      }
    } catch (e) {
      debugPrint('Error loading booking: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handlePayViaVNPay() async {
    if (_booking == null) return;

    setState(() => _isLoading = true);
    try {
      final cubit = context.read<BookingCubit>();

      // Call VNPay payment for remaining amount
      final result = await cubit.completeRemainingPayment(
        bookingId: widget.bookingId,
        paymentMethod: 'vnpay',
      );

      if (result['success']) {
        // Navigate to payment URL or show success
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Redirecting to VNPay...'),
              backgroundColor: Colors.green,
            ),
          );

          // Navigate to payment result after VNPay
          Navigator.pushReplacementNamed(
            context,
            '/payment-result',
            arguments: {'bookingId': widget.bookingId},
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Payment failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handlePayCash() async {
    if (_booking == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Cash Payment'),
        content: const Text(
          'By selecting this option, you agree to pay the remaining amount in cash at check-in. Do you want to continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final cubit = context.read<BookingCubit>();

      final result = await cubit.completeRemainingPayment(
        bookingId: widget.bookingId,
        paymentMethod: 'cash',
      );

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment method updated to cash'),
              backgroundColor: Colors.green,
            ),
          );

          Navigator.pushReplacementNamed(
            context,
            '/trips',
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(result['message'] ?? 'Failed to update payment method'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Reminder'),
        backgroundColor: const Color(0xFFFF385C),
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: _booking == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Warning Card
                    Card(
                      color: Colors.orange.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.warning_amber_rounded,
                              color: Colors.orange.shade700,
                              size: 40,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Payment Required',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.orange.shade900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Please complete your remaining payment before check-in',
                                    style: TextStyle(
                                      color: Colors.orange.shade800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Booking Details
                    _buildSectionTitle('Booking Details'),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildDetailRow(
                              'Booking ID',
                              _booking!.id.substring(_booking!.id.length - 8),
                            ),
                            const Divider(),
                            _buildDetailRow(
                              'Check-in Date',
                              DateFormatter.formatDate(_booking!.startDate),
                            ),
                            const Divider(),
                            _buildDetailRow(
                              'Total Amount',
                              formatVND(_booking!.finalTotalPrice),
                            ),
                            const Divider(),
                            _buildDetailRow(
                              'Deposit Paid (30%)',
                              formatVND(_booking!.depositAmount),
                              valueColor: Colors.green,
                            ),
                            const Divider(),
                            _buildDetailRow(
                              'Remaining Amount',
                              formatVND(_booking!.remainingAmount),
                              valueColor: Colors.red,
                              isBold: true,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Payment Due Date
                    if (_booking!.remainingDueDate != null) ...[
                      _buildSectionTitle('Payment Due Date'),
                      Card(
                        color: Colors.red.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Icon(
                                Icons.calendar_today,
                                color: Colors.red.shade700,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                DateFormatter.formatDate(
                                    _booking!.remainingDueDate!),
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red.shade900,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Payment Options
                    _buildSectionTitle('Choose Payment Method'),
                    const SizedBox(height: 12),

                    // VNPay Option
                    CustomButton(
                      text: 'Pay with VNPay',
                      onPressed: _handlePayViaVNPay,
                      icon: Icons.payment,
                      backgroundColor: const Color(0xFF0088CC),
                    ),
                    const SizedBox(height: 12),

                    // Cash Option
                    CustomButton(
                      text: 'Pay Cash at Check-in',
                      onPressed: _handlePayCash,
                      icon: Icons.money,
                      backgroundColor: Colors.green,
                    ),
                    const SizedBox(height: 24),

                    // Information Card
                    Card(
                      color: Colors.blue.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.blue.shade700,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Payment Information',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue.shade900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '• You must complete payment before check-in\n'
                              '• VNPay: Instant confirmation\n'
                              '• Cash: Pay directly to host at check-in\n'
                              '• Late payment may result in booking cancellation',
                              style: TextStyle(
                                color: Colors.blue.shade800,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    Color? valueColor,
    bool isBold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? Colors.black,
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
