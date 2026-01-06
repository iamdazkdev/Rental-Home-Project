import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Widget to display booking status with proper styling
class BookingStatusBadge extends StatelessWidget {
  final String status;
  final bool isCompact;

  const BookingStatusBadge({
    super.key,
    required this.status,
    this.isCompact = false,
  });

  Color get _color {
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'draft':
        return Colors.grey;
      case 'pending':
        return AppTheme.warningColor;
      case 'approved':
      case 'accepted':
        return AppTheme.successColor;
      case 'checked_in':
      case 'checkedin':
        return Colors.blue;
      case 'checked_out':
      case 'checkedout':
        return Colors.purple;
      case 'completed':
        return Colors.green[700]!;
      case 'cancelled':
        return Colors.grey[600]!;
      case 'rejected':
        return AppTheme.errorColor;
      case 'expired':
        return Colors.grey[500]!;
      default:
        return Colors.grey;
    }
  }

  String get _displayText {
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'approved':
      case 'accepted':
        return 'Approved';
      case 'checked_in':
      case 'checkedin':
        return 'Checked In';
      case 'checked_out':
      case 'checkedout':
        return 'Checked Out';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 8 : 12,
        vertical: isCompact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(isCompact ? 8 : 12),
      ),
      child: Text(
        _displayText,
        style: TextStyle(
          color: _color,
          fontSize: isCompact ? 11 : 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Widget to display payment status with proper styling
class PaymentStatusBadge extends StatelessWidget {
  final String? paymentStatus;
  final String? paymentMethod;
  final String? paymentType;
  final bool showMethod;
  final bool isCompact;

  const PaymentStatusBadge({
    super.key,
    this.paymentStatus,
    this.paymentMethod,
    this.paymentType,
    this.showMethod = false,
    this.isCompact = false,
  });

  Color get _color {
    final statusLower = paymentStatus?.toLowerCase() ?? '';
    switch (statusLower) {
      case 'paid':
        return Colors.green;
      case 'partially_paid':
        return Colors.orange;
      case 'unpaid':
        return Colors.red;
      case 'refunded':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String get _displayText {
    final statusLower = paymentStatus?.toLowerCase() ?? '';
    final methodLower = paymentMethod?.toLowerCase() ?? '';
    final typeLower = paymentType?.toLowerCase() ?? '';

    String statusText;
    switch (statusLower) {
      case 'paid':
        statusText = 'Paid';
        break;
      case 'partially_paid':
        statusText = 'Deposit Paid';
        break;
      case 'unpaid':
        statusText = 'Unpaid';
        break;
      case 'refunded':
        statusText = 'Refunded';
        break;
      default:
        statusText = 'Unknown';
    }

    if (showMethod && methodLower.isNotEmpty) {
      final methodText = methodLower == 'vnpay' ? 'VNPay' : 'Cash';
      if (typeLower == 'deposit') {
        return '$statusText (${methodText} 30%)';
      }
      return '$statusText ($methodText)';
    }

    return statusText;
  }

  IconData get _icon {
    final methodLower = paymentMethod?.toLowerCase() ?? '';
    if (methodLower == 'vnpay') {
      return Icons.payment;
    } else if (methodLower == 'cash') {
      return Icons.money;
    }
    return Icons.attach_money;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(_icon, size: isCompact ? 14 : 16, color: _color),
        const SizedBox(width: 4),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 6 : 8,
            vertical: isCompact ? 2 : 4,
          ),
          decoration: BoxDecoration(
            color: _color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            _displayText,
            style: TextStyle(
              color: _color,
              fontSize: isCompact ? 10 : 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

/// Widget to display payment summary for deposit bookings
class DepositPaymentCard extends StatelessWidget {
  final double totalPrice;
  final double depositAmount;
  final double? remainingAmount;
  final String? paymentStatus;
  final VoidCallback? onCompletePayment;

  const DepositPaymentCard({
    super.key,
    required this.totalPrice,
    required this.depositAmount,
    this.remainingAmount,
    this.paymentStatus,
    this.onCompletePayment,
  });

  @override
  Widget build(BuildContext context) {
    final remaining = remainingAmount ?? (totalPrice - depositAmount);
    final isPartiallyPaid = paymentStatus?.toLowerCase() == 'partially_paid';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet, size: 18, color: Colors.orange),
              const SizedBox(width: 8),
              const Text(
                'Payment Details',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 12),

          _buildRow('Total Amount', totalPrice),
          const SizedBox(height: 4),
          _buildRow('Deposit Paid (30%)', depositAmount, color: Colors.green),
          const SizedBox(height: 4),
          _buildRow('Remaining', remaining, color: Colors.orange, isBold: true),

          if (isPartiallyPaid && onCompletePayment != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onCompletePayment,
                icon: const Icon(Icons.payment, size: 18),
                label: const Text('Complete Payment'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.orange,
                  side: const BorderSide(color: Colors.orange),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRow(String label, double amount, {Color? color, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[700],
          ),
        ),
        Text(
          '${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (match) => '${match[1]}.')} đ',
          style: TextStyle(
            fontSize: 13,
            color: color ?? Colors.black,
            fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

/// Widget to display locked listing warning
class ListingLockedBanner extends StatelessWidget {
  final String? lockedUntil;
  final VoidCallback? onRetry;

  const ListingLockedBanner({
    super.key,
    this.lockedUntil,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock, size: 18, color: Colors.red),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'This listing is currently being booked',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Colors.red,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Another user is in the process of booking this property. '
            'Please try again in a few minutes.',
            style: TextStyle(fontSize: 13, color: Colors.grey[700]),
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Try Again'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

