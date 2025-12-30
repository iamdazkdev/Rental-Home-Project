import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/booking_cubit.dart';
import '../cubit/booking_state.dart';

/// Payment Callback Screen
/// Handles VNPay payment return and processes booking creation
class PaymentCallbackScreen extends StatefulWidget {
  final Map<String, String> queryParams;

  const PaymentCallbackScreen({
    Key? key,
    required this.queryParams,
  }) : super(key: key);

  @override
  State<PaymentCallbackScreen> createState() => _PaymentCallbackScreenState();
}

class _PaymentCallbackScreenState extends State<PaymentCallbackScreen> {
  @override
  void initState() {
    super.initState();
    _processPaymentCallback();
  }

  void _processPaymentCallback() {
    final tempOrderId = widget.queryParams['vnp_TxnRef'];

    if (tempOrderId != null) {
      context.read<BookingCubit>().handleVNPayCallback(
            tempOrderId: tempOrderId,
            queryParams: widget.queryParams,
          );
    } else {
      // Invalid callback
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Processing Payment'),
        backgroundColor: const Color(0xFF4CAF50),
        automaticallyImplyLeading: false,
      ),
      body: BlocConsumer<BookingCubit, BookingState>(
        listener: (context, state) {
          if (state is BookingConfirmed) {
            // Payment successful, booking created
            Navigator.pushReplacementNamed(
              context,
              '/booking-confirmation',
              arguments: state.booking,
            );
          } else if (state is BookingError) {
            // Payment failed
            _showErrorDialog(state.message);
          }
        },
        builder: (context, state) {
          if (state is BookingLoading) {
            return _buildLoadingView();
          } else if (state is BookingError) {
            return _buildErrorView(state.message);
          }

          return _buildLoadingView();
        },
      ),
    );
  }

  Widget _buildLoadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: Color(0xFF4CAF50),
          ),
          const SizedBox(height: 24),
          const Text(
            'Confirming your payment...',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            'Please wait',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 24),
            const Text(
              'Payment Failed',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Payment Failed'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Go back to booking
            },
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}

