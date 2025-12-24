import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_theme.dart';
import '../../models/listing.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../services/payment_service.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../payment/payment_result_screen.dart';

class BookingCheckoutScreen extends StatefulWidget {
  final Listing listing;
  final DateTime startDate;
  final DateTime endDate;
  final int dayCount;
  final double totalPrice;

  const BookingCheckoutScreen({
    super.key,
    required this.listing,
    required this.startDate,
    required this.endDate,
    required this.dayCount,
    required this.totalPrice,
  });

  @override
  State<BookingCheckoutScreen> createState() => _BookingCheckoutScreenState();
}

class _BookingCheckoutScreenState extends State<BookingCheckoutScreen> {
  final BookingService _bookingService = BookingService();
  final PaymentService _paymentService = PaymentService();

  String _selectedPaymentMethod = 'vnpay_full'; // vnpay_full, vnpay_deposit, cash
  bool _isSubmitting = false;

  // Payment method options
  final List<Map<String, dynamic>> _paymentMethods = [
    {
      'id': 'vnpay_full',
      'name': 'Thanh toán toàn bộ',
      'subtitle': 'Thanh toán 100% qua VNPay',
      'icon': Icons.payment,
      'color': Colors.blue,
    },
    {
      'id': 'vnpay_deposit',
      'name': 'Tiền cọc 50%',
      'subtitle': 'Cọc 50% qua VNPay, phần còn lại trả sau',
      'icon': Icons.account_balance_wallet,
      'color': Colors.orange,
    },
    {
      'id': 'cash',
      'name': 'Tiền mặt khi nhận phòng',
      'subtitle': 'Thanh toán trực tiếp tại chỗ',
      'icon': Icons.money,
      'color': Colors.green,
    },
  ];

  Future<void> _handleConfirmPayment() async {
    if (_isSubmitting) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) {
      _showErrorDialog('Please login to continue');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Calculate amounts
      double paymentAmount = widget.totalPrice;
      int depositPercentage = 0;
      double depositAmount = 0;

      if (_selectedPaymentMethod == 'vnpay_deposit') {
        depositPercentage = 50;
        depositAmount = _paymentService.calculateDepositAmount(widget.totalPrice);
        paymentAmount = depositAmount;
      }

      // Prepare booking data
      final bookingData = {
        'customerId': user.id,
        'hostId': widget.listing.creator,
        'listingId': widget.listing.id,
        'startDate': widget.startDate.toIso8601String(),
        'endDate': widget.endDate.toIso8601String(),
        'totalPrice': widget.totalPrice,
        'paymentMethod': _selectedPaymentMethod,
        'depositPercentage': depositPercentage,
        'depositAmount': depositAmount,
      };

      debugPrint('📝 Booking data prepared: $_selectedPaymentMethod');

      // Handle cash payment - create booking immediately
      if (_selectedPaymentMethod == 'cash') {
        debugPrint('💵 Creating cash booking...');

        final result = await _bookingService.createBooking(
          customerId: user.id,
          hostId: widget.listing.creator,
          listingId: widget.listing.id,
          startDate: widget.startDate,
          endDate: widget.endDate,
          totalPrice: widget.totalPrice,
          paymentMethod: 'cash',
        );

        setState(() => _isSubmitting = false);

        if (!mounted) return;

        if (result['success']) {
          _showSuccessDialog(
            'Đặt phòng thành công!',
            'Vui lòng thanh toán tiền mặt khi nhận phòng.',
          );
        } else {
          _showErrorDialog(result['message'] ?? 'Đặt phòng thất bại');
        }
        return;
      }

      // Handle VNPay payments
      debugPrint('💳 Creating VNPay payment...');

      final ipAddr = await _paymentService.getClientIP();

      debugPrint('💰 Payment amount: \$${paymentAmount.toStringAsFixed(2)} USD');

      // Create payment URL
      final paymentResult = await _paymentService.createPaymentUrl(
        bookingData: bookingData,
        amount: paymentAmount, // Send USD amount directly
        ipAddr: ipAddr,
      );

      setState(() => _isSubmitting = false);

      if (!mounted) return;

      if (paymentResult['success']) {
        final paymentUrl = paymentResult['paymentUrl'];
        final bookingId = paymentResult['bookingId'];

        debugPrint('✅ Booking created with ID: $bookingId');
        debugPrint('🔄 Opening VNPay payment page...');

        // Open VNPay payment page
        final uri = Uri.parse(paymentUrl);
        if (await canLaunchUrl(uri)) {
          await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );

          // For demo: Show dialog to manually confirm payment
          if (mounted) {
            _showPaymentConfirmDialog(bookingId);
          }
        } else {
          _showErrorDialog('Không thể mở trang thanh toán');
        }
      } else {
        _showErrorDialog(paymentResult['message'] ?? 'Tạo thanh toán thất bại');
      }

    } catch (e) {
      setState(() => _isSubmitting = false);
      debugPrint('❌ Error during checkout: $e');
      _showErrorDialog('Đã xảy ra lỗi: ${e.toString()}');
    }
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: AppTheme.successColor, size: 28),
            const SizedBox(width: 12),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Go back to listing
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: AppTheme.errorColor, size: 28),
            SizedBox(width: 12),
            Text('Lỗi'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  // void _showPaymentPendingDialog() {
  //   showDialog(
  //     context: context,
  //     barrierDismissible: false,
  //     builder: (context) => AlertDialog(
  //       title: const Row(
  //         children: [
  //           Icon(Icons.schedule, color: AppTheme.warningColor, size: 28),
  //           SizedBox(width: 12),
  //           Text('Đang chờ thanh toán'),
  //         ],
  //       ),
  //       content: const Text(
  //         'Vui lòng hoàn tất thanh toán trên trang VNPay.\n\n'
  //         'Bạn có thể kiểm tra trạng thái đặt phòng trong mục "My Trips".',
  //       ),
  //       actions: [
  //         TextButton(
  //           onPressed: () {
  //             Navigator.of(context).pop(); // Close dialog
  //           },
  //           child: const Text('Đã hiểu'),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  void _showPaymentConfirmDialog(String bookingId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('🎭 Demo Mode'),
        content: const Text(
          'Bạn đã mở trang thanh toán VNPay.\n\n'
          'Vì đây là chế độ demo, hãy xác nhận để hoàn tất đặt phòng '
          '(không cần thanh toán thật).',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Go back to listing
            },
            child: const Text('Huỷ'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop(); // Close dialog

              // For demo: Treat as successful payment
              await _handleDemoPaymentSuccess(bookingId);
            },
            child: const Text('Xác nhận thanh toán'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleDemoPaymentSuccess(String bookingId) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    // Simulate processing
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    // Close loading
    Navigator.of(context).pop();

    // Navigate to payment result screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => PaymentResultScreen(
          status: 'success',
          bookingId: bookingId,
          transactionNo: 'DEMO_${DateTime.now().millisecondsSinceEpoch}',
          paymentStatus: _selectedPaymentMethod == 'vnpay_deposit'
              ? 'partially_paid'
              : 'paid',
        ),
      ),
    );
  }

  double _getPaymentAmount() {
    if (_selectedPaymentMethod == 'vnpay_deposit') {
      return _paymentService.calculateDepositAmount(widget.totalPrice);
    }
    return widget.totalPrice;
  }

  @override
  Widget build(BuildContext context) {
    final paymentAmount = _getPaymentAmount();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Xác nhận đặt phòng'),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Listing Info
                  _buildListingInfo(),
                  const SizedBox(height: 24),

                  // Booking Details
                  _buildBookingDetails(),
                  const SizedBox(height: 24),

                  // Payment Method Selection
                  _buildPaymentMethodSelection(),
                  const SizedBox(height: 24),

                  // Price Summary
                  _buildPriceSummary(paymentAmount),
                ],
              ),
            ),
          ),

          // Bottom Button
          _buildBottomButton(),
        ],
      ),
    );
  }

  Widget _buildListingInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Listing Image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: widget.listing.mainPhoto != null
                  ? Image.network(
                      widget.listing.mainPhoto!,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 80,
                          height: 80,
                          color: Colors.grey[300],
                          child: const Icon(Icons.home),
                        );
                      },
                    )
                  : Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[300],
                      child: const Icon(Icons.home),
                    ),
            ),
            const SizedBox(width: 16),

            // Listing Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.listing.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.listing.shortAddress,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.listing.type,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[500],
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

  Widget _buildBookingDetails() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chi tiết đặt phòng',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow('Check-in', DateFormatter.formatDate(widget.startDate)),
            const SizedBox(height: 8),
            _buildDetailRow('Check-out', DateFormatter.formatDate(widget.endDate)),
            const SizedBox(height: 8),
            _buildDetailRow('Số đêm', '${widget.dayCount} đêm'),
            const SizedBox(height: 8),
            _buildDetailRow(
              'Tổng giá',
              PriceFormatter.formatPrice(widget.totalPrice),
              isHighlight: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isHighlight = false}) {
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
          style: TextStyle(
            fontSize: 14,
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            color: isHighlight ? AppTheme.primaryColor : Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Phương thức thanh toán',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ..._paymentMethods.map((method) {
          final isSelected = _selectedPaymentMethod == method['id'];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedPaymentMethod = method['id'];
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected ? method['color'] : Colors.grey[300]!,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  color: isSelected
                      ? method['color'].withValues(alpha: 0.05)
                      : Colors.white,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: method['color'].withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        method['icon'],
                        color: method['color'],
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            method['name'],
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? method['color'] : Colors.black,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            method['subtitle'],
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Radio<String>(
                      value: method['id'],
                      groupValue: _selectedPaymentMethod,
                      onChanged: (value) {
                        setState(() {
                          _selectedPaymentMethod = value!;
                        });
                      },
                      activeColor: method['color'],
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildPriceSummary(double paymentAmount) {
    return Card(
      color: AppTheme.primaryColor.withAlpha((255*0.05).round()),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tóm tắt thanh toán',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            if (_selectedPaymentMethod == 'vnpay_deposit') ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Tổng giá:', style: TextStyle(color: Colors.grey[700])),
                  Text(
                    PriceFormatter.formatPrice(widget.totalPrice),
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tiền cọc (50%):', style: TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    PriceFormatter.formatPrice(paymentAmount),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Còn lại:', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  Text(
                    PriceFormatter.formatPrice(widget.totalPrice - paymentAmount),
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
            ] else ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Số tiền thanh toán:', style: TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    PriceFormatter.formatPrice(paymentAmount),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBottomButton() {
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
        child: ElevatedButton(
          onPressed: _isSubmitting ? null : _handleConfirmPayment,
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
          child: _isSubmitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  _selectedPaymentMethod == 'cash'
                      ? 'Xác nhận đặt phòng'
                      : 'Thanh toán ngay',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ),
    );
  }
}

