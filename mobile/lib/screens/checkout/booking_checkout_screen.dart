import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_theme.dart';
import '../../features/booking/presentation/cubit/booking_cubit.dart';
import '../../features/booking/presentation/cubit/booking_state.dart';
import '../../models/listing.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../payment/payment_result_screen.dart';

class BookingCheckoutScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => GetIt.I<BookingCubit>(),
      child: _BookingCheckoutView(
        listing: listing,
        startDate: startDate,
        endDate: endDate,
        dayCount: dayCount,
        totalPrice: totalPrice,
      ),
    );
  }
}

class _BookingCheckoutView extends StatefulWidget {
  final Listing listing;
  final DateTime startDate;
  final DateTime endDate;
  final int dayCount;
  final double totalPrice;

  const _BookingCheckoutView({
    required this.listing,
    required this.startDate,
    required this.endDate,
    required this.dayCount,
    required this.totalPrice,
  });

  @override
  State<_BookingCheckoutView> createState() => _BookingCheckoutViewState();
}

class _BookingCheckoutViewState extends State<_BookingCheckoutView> {
  String _selectedPaymentMethod = 'vnpay_full';

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
      'name': 'Tiền cọc 30%',
      'subtitle': 'Cọc 30% qua VNPay, phần còn lại trả sau',
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

  String get _paymentType {
    switch (_selectedPaymentMethod) {
      case 'vnpay_full':
        return 'full';
      case 'vnpay_deposit':
        return 'deposit';
      case 'cash':
        return 'cash';
      default:
        return 'full';
    }
  }

  double get _paymentAmount {
    if (_selectedPaymentMethod == 'vnpay_deposit') {
      return (widget.totalPrice * 0.3).roundToDouble();
    }
    return widget.totalPrice;
  }

  void _handleConfirmPayment() {
    context.read<BookingCubit>().createBookingIntent(
          listingId: widget.listing.id,
          hostId: widget.listing.creator,
          checkIn: widget.startDate,
          checkOut: widget.endDate,
          totalPrice: widget.totalPrice,
          paymentType: _paymentType,
        );
  }

  Future<void> _handleIntentCreated(BookingIntentCreated state) async {
    final cubit = context.read<BookingCubit>();
    final paymentUrl = await cubit.initiateVNPayPayment(
      intent: state.intent,
      returnUrl: 'rentalhome://payment-callback',
    );

    if (paymentUrl != null && mounted) {
      final uri = Uri.parse(paymentUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);

        if (mounted) {
          _showPaymentConfirmDialog(
            state.intent.tempOrderId ?? state.intent.intentId,
          );
        }
      } else {
        cubit.cancelBookingIntent(state.intent.intentId);
        if (mounted) _showErrorSnackBar('Cannot open payment page');
      }
    }
  }

  void _showPaymentConfirmDialog(String tempOrderId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Text('🎭 Demo Mode'),
        content: const Text(
          'You have opened the VNPay payment page.\n\n'
          'Since this is demo mode, confirm to complete the booking '
          '(no actual payment required).',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<BookingCubit>().cancelBookingIntent(tempOrderId);
              if (mounted) Navigator.of(context).pop();
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<BookingCubit>().handleVNPayCallback(
                    tempOrderId: tempOrderId,
                    queryParams: {
                      'vnp_ResponseCode': '00',
                      'vnp_TransactionNo':
                          'DEMO_${DateTime.now().millisecondsSinceEpoch}',
                    },
                  );
            },
            child: const Text('Confirm Payment'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppTheme.errorColor),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Xác nhận đặt phòng')),
      body: BlocConsumer<BookingCubit, BookingState>(
        listener: (context, state) {
          if (state is BookingIntentCreated) {
            _handleIntentCreated(state);
          } else if (state is BookingConfirmed) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => PaymentResultScreen(
                  status: 'success',
                  bookingId: state.booking.id,
                  transactionNo:
                      'TXN_${DateTime.now().millisecondsSinceEpoch}',
                  paymentStatus: _selectedPaymentMethod == 'vnpay_deposit'
                      ? 'partially_paid'
                      : 'paid',
                ),
              ),
            );
          } else if (state is BookingError) {
            _showErrorSnackBar(state.message);
          } else if (state is BookingIntentExpired) {
            _showErrorSnackBar(
              'Booking reservation expired. Please try again.',
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is BookingLoading;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildListingInfo(),
                      const SizedBox(height: 24),
                      _buildBookingDetails(),
                      const SizedBox(height: 24),
                      _buildPaymentMethodSelection(),
                      const SizedBox(height: 24),
                      _buildPriceSummary(_paymentAmount),
                    ],
                  ),
                ),
              ),
              _buildBottomButton(isLoading),
            ],
          );
        },
      ),
    );
  }

  Widget _buildListingInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
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
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.listing.type,
                    style: TextStyle(fontSize: 13, color: Colors.grey[500]),
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
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildDetailRow(
                'Check-in', DateFormatter.formatDate(widget.startDate)),
            const SizedBox(height: 8),
            _buildDetailRow(
                'Check-out', DateFormatter.formatDate(widget.endDate)),
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

  Widget _buildDetailRow(String label, String value,
      {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 14, color: Colors.grey[700]),
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
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ..._paymentMethods.map((method) {
          final isSelected = _selectedPaymentMethod == method['id'];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedPaymentMethod = method['id'] as String;
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected
                        ? method['color'] as Color
                        : Colors.grey[300]!,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  color: isSelected
                      ? (method['color'] as Color).withValues(alpha: 0.05)
                      : Colors.white,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: (method['color'] as Color).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        method['icon'] as IconData,
                        color: method['color'] as Color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            method['name'] as String,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? method['color'] as Color
                                  : Colors.black,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            method['subtitle'] as String,
                            style: TextStyle(
                                fontSize: 13, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      isSelected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: isSelected
                          ? method['color'] as Color
                          : Colors.grey,
                      size: 24,
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
      color: AppTheme.primaryColor.withAlpha((255 * 0.05).round()),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tóm tắt thanh toán',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
                  const Text('Tiền cọc (30%):',
                      style: TextStyle(fontWeight: FontWeight.w600)),
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
                  Text('Còn lại (trả khi nhận phòng):',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  Text(
                    PriceFormatter.formatPrice(
                        widget.totalPrice - paymentAmount),
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
            ] else ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Số tiền thanh toán:',
                      style: TextStyle(fontWeight: FontWeight.w600)),
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

  Widget _buildBottomButton(bool isLoading) {
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
          onPressed: isLoading ? null : _handleConfirmPayment,
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
          child: isLoading
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
