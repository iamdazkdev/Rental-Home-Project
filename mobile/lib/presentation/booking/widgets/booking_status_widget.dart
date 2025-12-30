import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/enums/booking_enums.dart';
import '../cubit/booking_cubit.dart';
import '../cubit/booking_state.dart';

class BookingStatusWidget extends StatelessWidget {
  const BookingStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BookingCubit, BookingState>(
      builder: (context, state) {
        return switch (state) {
          BookingInitial() => const SizedBox.shrink(),

          BookingLoading(:final message) => _buildLoading(message),

          BookingIntentCreated(:final timeRemaining) =>
            _buildIntentCountdown(context, timeRemaining),

          BookingListingLocked(:final message) =>
            _buildLockedMessage(context, message),

          BookingAgreementRequired(:final booking) =>
            _buildAgreementRequired(context, state),

          BookingPaymentRequired(:final amountDue, :final isPartiallyPaid) =>
            _buildPaymentRequired(context, state, amountDue, isPartiallyPaid),

          BookingPaymentProcessing(:final paymentUrl) =>
            _buildPaymentProcessing(context, paymentUrl),

          BookingPendingApproval() =>
            _buildPendingApproval(context),

          BookingConfirmed(:final booking) =>
            _buildConfirmed(context, booking),

          BookingCancelled(:final reason) =>
            _buildCancelled(context, reason),

          BookingIntentExpired() =>
            _buildIntentExpired(context),

          BookingError(:final message, :final canRetry) =>
            _buildError(context, message, canRetry),

          BookingLoaded(:final booking, :final availableActions) =>
            _buildLoaded(context, state),

          BookingsLoaded() => const SizedBox.shrink(),
          // TODO: Handle this case.
          BookingState() => throw UnimplementedError(),
        };
      },
    );
  }

  Widget _buildLoading(String? message) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message),
          ],
        ],
      ),
    );
  }

  Widget _buildIntentCountdown(BuildContext context, Duration timeRemaining) {
    final minutes = timeRemaining.inMinutes;
    final seconds = timeRemaining.inSeconds % 60;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange),
      ),
      child: Column(
        children: [
          const Icon(Icons.timer, color: Colors.orange, size: 32),
          const SizedBox(height: 8),
          Text(
            'Listing reserved for you',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
          const SizedBox(height: 8),
          const Text('Complete your booking before time expires'),
        ],
      ),
    );
  }

  Widget _buildLockedMessage(BuildContext context, String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red),
      ),
      child: Column(
        children: [
          const Icon(Icons.lock, color: Colors.red, size: 32),
          const SizedBox(height: 8),
          Text(
            'Listing Unavailable',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Browse Other Listings'),
          ),
        ],
      ),
    );
  }

  Widget _buildAgreementRequired(
    BuildContext context,
    BookingAgreementRequired state,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue),
      ),
      child: Column(
        children: [
          const Icon(Icons.description, color: Colors.blue, size: 32),
          const SizedBox(height: 8),
          Text(
            'Agreement Required',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          const Text(
            'Please review and sign the rental agreement to proceed.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to agreement signing screen
              Navigator.pushNamed(
                context,
                '/agreement/sign',
                arguments: {
                  'bookingId': state.booking.id,
                  'agreementId': state.agreementId,
                },
              );
            },
            icon: const Icon(Icons.edit),
            label: const Text('Sign Agreement'),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRequired(
    BuildContext context,
    BookingPaymentRequired state,
    double amountDue,
    bool isPartiallyPaid,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green),
      ),
      child: Column(
        children: [
          const Icon(Icons.payment, color: Colors.green, size: 32),
          const SizedBox(height: 8),
          Text(
            isPartiallyPaid ? 'Remaining Payment Due' : 'Payment Required',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            '\$${amountDue.toStringAsFixed(2)}',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: state.availablePaymentTypes.map((type) {
              return ElevatedButton(
                onPressed: () {
                  // Navigate to payment screen with type
                  Navigator.pushNamed(
                    context,
                    '/payment',
                    arguments: {
                      'bookingId': state.booking.id,
                      'paymentType': type,
                      'amount': amountDue,
                    },
                  );
                },
                child: Text(_getPaymentTypeLabel(type)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentProcessing(BuildContext context, String? paymentUrl) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Processing payment...'),
          SizedBox(height: 8),
          Text(
            'Please complete the payment in the opened window.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPendingApproval(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber),
      ),
      child: Column(
        children: [
          const Icon(Icons.hourglass_empty, color: Colors.amber, size: 32),
          const SizedBox(height: 8),
          Text(
            'Pending Approval',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          const Text(
            'Your booking is waiting for landlord approval. You will be notified once approved.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmed(BuildContext context, booking) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 48),
          const SizedBox(height: 8),
          Text(
            'Booking Confirmed!',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.green,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your booking has been confirmed. Check your email for details.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCancelled(BuildContext context, String reason) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey),
      ),
      child: Column(
        children: [
          const Icon(Icons.cancel, color: Colors.grey, size: 32),
          const SizedBox(height: 8),
          Text(
            'Booking Cancelled',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text('Reason: $reason', textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildIntentExpired(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange),
      ),
      child: Column(
        children: [
          const Icon(Icons.timer_off, color: Colors.orange, size: 32),
          const SizedBox(height: 8),
          Text(
            'Reservation Expired',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          const Text(
            'Your reservation has expired. Please try booking again.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, String message, bool canRetry) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red),
      ),
      child: Column(
        children: [
          const Icon(Icons.error, color: Colors.red, size: 32),
          const SizedBox(height: 8),
          Text(
            'Error',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(message, textAlign: TextAlign.center),
          if (canRetry) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // Retry logic based on previous state
              },
              child: const Text('Retry'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLoaded(BuildContext context, BookingLoaded state) {
    return Column(
      children: [
        _buildStatusBadge(state.status),
        const SizedBox(height: 16),
        _buildActionButtons(context, state),
      ],
    );
  }

  Widget _buildStatusBadge(BookingStatus status) {
    final (color, label) = switch (status) {
      BookingStatus.pending => (Colors.blue, 'Pending'),
      BookingStatus.approved => (Colors.green, 'Approved'),
      BookingStatus.checkedIn => (Colors.green, 'Checked In'),
      BookingStatus.completed => (Colors.grey, 'Completed'),
      BookingStatus.cancelled => (Colors.red, 'Cancelled'),
      _ => (Colors.grey, status.value),
    };

    return Chip(
      label: Text(label),
      backgroundColor: color.withValues(alpha: 0.2),
      labelStyle: TextStyle(color: color),
    );
  }

  Widget _buildActionButtons(BuildContext context, BookingLoaded state) {
    return Wrap(
      spacing: 8,
      children: [
        if (state.canPay)
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/payment', arguments: state.booking);
            },
            child: const Text('Pay Now'),
          ),
        if (state.canSignAgreement)
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/agreement/sign', arguments: state.booking);
            },
            child: const Text('Sign Agreement'),
          ),
        if (state.canCancel)
          OutlinedButton(
            onPressed: () => _showCancelDialog(context, state.booking.id),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Cancel'),
          ),
      ],
    );
  }

  void _showCancelDialog(BuildContext context, String bookingId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<BookingCubit>().cancelBooking(
                bookingId: bookingId,
                reason: 'Cancelled by user',
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  String _getPaymentTypeLabel(PaymentType type) {
    return switch (type) {
      PaymentType.full => 'Pay Full',
      PaymentType.deposit => 'Pay Deposit',
      PaymentType.cash => 'Cash Payment',
      PaymentType.cashOnArrival => 'Cash on Arrival',
      PaymentType.installment => 'Pay in Installments',
    };
  }
}

