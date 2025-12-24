import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'dart:async';

class PaymentResultScreen extends StatefulWidget {
  final String status; // 'success' or 'failure'
  final String? transactionId;
  final String? amount;
  final String? bookingId;
  final String? message;

  const PaymentResultScreen({
    super.key,
    required this.status,
    this.transactionId,
    this.amount,
    this.bookingId,
    this.message,
  });

  @override
  State<PaymentResultScreen> createState() => _PaymentResultScreenState();
}

class _PaymentResultScreenState extends State<PaymentResultScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _controller.forward();

    // Auto redirect after 5 seconds for success
    if (widget.status == 'success') {
      Timer(const Duration(seconds: 5), () {
        if (mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil(
            '/trips',
            (route) => false,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = widget.status == 'success';
    final theme = Theme.of(context);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isSuccess
                ? [
                    const Color(0xFF4CAF50).withOpacity(0.1),
                    Colors.white,
                  ]
                : [
                    const Color(0xFFFF385A).withOpacity(0.1),
                    Colors.white,
                  ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Close button
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                    '/main',
                    (route) => false,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Animation or Icon
                          _buildStatusIcon(isSuccess),

                          const SizedBox(height: 32),

                          // Title
                          Text(
                            isSuccess ? '🎉 Payment Successful!' : '❌ Payment Failed',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isSuccess
                                  ? const Color(0xFF4CAF50)
                                  : const Color(0xFFFF385A),
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const SizedBox(height: 16),

                          // Message
                          Text(
                            widget.message ??
                                (isSuccess
                                    ? 'Your booking has been confirmed!'
                                    : 'Your payment could not be processed.'),
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: Colors.grey[700],
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const SizedBox(height: 32),

                          // Details Card
                          if (widget.transactionId != null ||
                              widget.amount != null ||
                              widget.bookingId != null)
                            _buildDetailsCard(theme, isSuccess),

                          const SizedBox(height: 40),

                          // Action Buttons
                          _buildActionButtons(context, isSuccess),

                          if (isSuccess) ...[
                            const SizedBox(height: 16),
                            Text(
                              'Redirecting to your trips in 5 seconds...',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIcon(bool isSuccess) {
    return Container(
      width: 150,
      height: 150,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isSuccess
            ? const Color(0xFF4CAF50).withOpacity(0.1)
            : const Color(0xFFFF385A).withOpacity(0.1),
      ),
      child: Center(
        child: Icon(
          isSuccess ? Icons.check_circle : Icons.cancel,
          size: 100,
          color: isSuccess
              ? const Color(0xFF4CAF50)
              : const Color(0xFFFF385A),
        ),
      ),
    );
  }

  Widget _buildDetailsCard(ThemeData theme, bool isSuccess) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Details',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (widget.amount != null)
            _buildDetailRow('Amount', widget.amount!),
          if (widget.transactionId != null)
            _buildDetailRow('Transaction ID', widget.transactionId!),
          if (widget.bookingId != null)
            _buildDetailRow('Booking ID', widget.bookingId!),
          _buildDetailRow(
            'Status',
            isSuccess ? 'Completed' : 'Failed',
            valueColor: isSuccess
                ? const Color(0xFF4CAF50)
                : const Color(0xFFFF385A),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: valueColor ?? Colors.black87,
              ),
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, bool isSuccess) {
    return Column(
      children: [
        // Primary Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () {
              if (isSuccess) {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/trips',
                  (route) => false,
                );
              } else {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/main',
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  isSuccess ? const Color(0xFF4CAF50) : const Color(0xFFFF385A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: Text(
              isSuccess ? 'View My Trips' : 'Back to Home',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),

        if (!isSuccess) ...[
          const SizedBox(height: 12),
          // Secondary Button for failure
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFFF385A),
                side: const BorderSide(color: Color(0xFFFF385A)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Try Again',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

