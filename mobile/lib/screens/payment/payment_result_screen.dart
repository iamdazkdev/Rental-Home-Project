import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../services/booking_service.dart';

class PaymentResultScreen extends StatefulWidget {
  final String status; // success, failed, error
  final String? bookingId;
  final String? transactionNo;
  final String? message;
  final String? paymentStatus; // paid, partially_paid

  const PaymentResultScreen({
    super.key,
    required this.status,
    this.bookingId,
    this.transactionNo,
    this.message,
    this.paymentStatus,
  });

  @override
  State<PaymentResultScreen> createState() => _PaymentResultScreenState();
}

class _PaymentResultScreenState extends State<PaymentResultScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    if (widget.status == 'success' && widget.bookingId != null) {
      _fetchBookingDetails();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchBookingDetails() async {
    try {
      // For demo: Just mark as loaded without fetching
      // In production, you would fetch booking details here
      await Future.delayed(const Duration(milliseconds: 500));
      setState(() => _isLoading = false);
    } catch (e) {
      debugPrint('Error fetching booking details: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: AppTheme.primaryColor,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildResultIcon(),
                      const SizedBox(height: 32),
                      _buildResultTitle(),
                      const SizedBox(height: 16),
                      _buildResultMessage(),
                      if (widget.status == 'success') ...[
                        const SizedBox(height: 32),
                        _buildBookingInfo(),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildResultIcon() {
    Color iconColor;
    IconData iconData;
    Color backgroundColor;

    switch (widget.status) {
      case 'success':
        iconColor = AppTheme.successColor;
        iconData = Icons.check_circle;
        backgroundColor = AppTheme.successColor.withValues(alpha: 0.1);
        break;
      case 'failed':
        iconColor = AppTheme.errorColor;
        iconData = Icons.cancel;
        backgroundColor = AppTheme.errorColor.withValues(alpha: 0.1);
        break;
      default:
        iconColor = AppTheme.warningColor;
        iconData = Icons.error;
        backgroundColor = AppTheme.warningColor.withValues(alpha: 0.1);
    }

    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
      ),
      child: Icon(
        iconData,
        size: 64,
        color: iconColor,
      ),
    );
  }

  Widget _buildResultTitle() {
    String title;
    switch (widget.status) {
      case 'success':
        title = 'Thanh toán thành công!';
        break;
      case 'failed':
        title = 'Thanh toán thất bại';
        break;
      default:
        title = 'Có lỗi xảy ra';
    }

    return Text(
      title,
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildResultMessage() {
    String message;

    if (widget.status == 'success') {
      if (widget.paymentStatus == 'partially_paid') {
        message = 'Bạn đã thanh toán cọc thành công!\n'
            'Vui lòng thanh toán số tiền còn lại khi check-in.';
      } else {
        message = 'Đặt phòng của bạn đã được xác nhận\n'
            'và thanh toán thành công.';
      }
    } else {
      message = widget.message ?? 'Vui lòng thử lại sau.';
    }

    return Text(
      message,
      style: TextStyle(
        fontSize: 16,
        color: Colors.grey[700],
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildBookingInfo() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin đặt phòng',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          if (widget.bookingId != null) ...[
            _buildInfoRow(
              'Mã đặt phòng',
              widget.bookingId!.substring(0, 8).toUpperCase(),
            ),
            const SizedBox(height: 12),
          ],

          if (widget.transactionNo != null) ...[
            _buildInfoRow(
              'Mã giao dịch',
              widget.transactionNo!,
            ),
            const SizedBox(height: 12),
          ],

          if (widget.paymentStatus == 'partially_paid') ...[
            const Divider(height: 24),
            Row(
              children: [
                Icon(Icons.info_outline, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Bạn đã thanh toán 50% tiền cọc. Phần còn lại sẽ được thanh toán khi check-in.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.status == 'success') ...[
              ElevatedButton(
                onPressed: () {
                  // Navigate to trips screen
                  Navigator.of(context).popUntil((route) => route.isFirst);
                  // TODO: Navigate to trips tab
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('Xem đặt phòng của tôi'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('Về trang chủ'),
              ),
            ] else ...[
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('Thử lại'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('Về trang chủ'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

