import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../checkout/checkout_screen.dart';
import '../../widgets/cancel_booking_bottom_sheet.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> with SingleTickerProviderStateMixin {
  final BookingService _bookingService = BookingService();
  late TabController _tabController;

  List<Booking> _trips = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadTrips();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTrips() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final trips = await _bookingService.getUserTrips(user.id);

    debugPrint('🎯 Loaded ${trips.length} trips');
    for (var i = 0; i < trips.length; i++) {
      final trip = trips[i];
      debugPrint('  Trip $i: status=${trip.status}, start=${trip.startDate}, end=${trip.endDate}');
    }

    setState(() {
      _trips = trips;
      _isLoading = false;
    });

    debugPrint('📊 Filtered: ${_upcomingTrips.length} upcoming, ${_pastTrips.length} past');
  }

  List<Booking> get _upcomingTrips {
    final now = DateTime.now();
    return _trips.where((trip) {
      // Show pending, approved, and accepted bookings that haven't ended yet
      final isActiveFutureBooking = (trip.status == 'pending' ||
                                      trip.status == 'approved' ||
                                      trip.status == 'accepted') &&
                                     trip.endDate.isAfter(now);

      debugPrint('  Upcoming check: ${trip.status}, ends ${trip.endDate}, now $now, include: $isActiveFutureBooking');
      return isActiveFutureBooking;
    }).toList();
  }

  List<Booking> get _pastTrips {
    final now = DateTime.now();
    return _trips.where((trip) {
      // Show completed, checked out, rejected, or past bookings
      final isPastBooking = trip.status == 'completed' ||
                           trip.status == 'checked_out' ||  // Backend uses checked_out with underscore
                           trip.status == 'rejected' ||
                           trip.endDate.isBefore(now) ||
                           trip.endDate.isAtSameMomentAs(now);

      debugPrint('  Past check: ${trip.status}, ends ${trip.endDate}, now $now, include: $isPastBooking');
      return isPastBooking;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trips'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTripsList(_upcomingTrips, isUpcoming: true),
                _buildTripsList(_pastTrips, isUpcoming: false),
              ],
            ),
    );
  }

  Widget _buildTripsList(List<Booking> trips, {required bool isUpcoming}) {
    if (trips.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isUpcoming ? Icons.calendar_today : Icons.history,
              size: 80,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming ? 'No upcoming trips' : 'No past trips',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('Your bookings will appear here'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadTrips,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: trips.length,
        itemBuilder: (context, index) {
          return _BookingCard(
            booking: trips[index],
            onRefresh: _loadTrips,
          );
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback onRefresh;

  const _BookingCard({
    required this.booking,
    required this.onRefresh,
  });

  Color _getStatusColor() {
    switch (booking.status) {
      case 'pending':
        return AppTheme.warningColor;
      case 'approved':
      case 'accepted':
        return AppTheme.successColor;
      case 'rejected':
        return AppTheme.errorColor;
      case 'completed':
      case 'checkedOut':
      case 'checked_out':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText() {
    switch (booking.status) {
      case 'pending':
        return 'Pending Approval';
      case 'approved':
      case 'accepted':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'checkedOut':
      case 'checked_out':
        return 'Checked Out';
      default:
        return booking.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final listing = booking.listing as Map?;
    final listingTitle = listing?['title'] ?? 'Property';
    final listingPhotos = listing?['listingPhotoPaths'] as List?;
    final photoUrl = listingPhotos?.isNotEmpty == true ? listingPhotos!.first : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          if (photoUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: CachedNetworkImage(
                imageUrl: photoUrl.toString().startsWith('http')
                    ? photoUrl
                    : 'http://localhost:3001/$photoUrl',
                height: 150,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppTheme.backgroundColor,
                  child: const Center(child: CircularProgressIndicator()),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppTheme.backgroundColor,
                  child: const Icon(Icons.home_work_outlined, size: 60),
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        listingTitle,
                        style: Theme.of(context).textTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                  ],
                ),

                const SizedBox(height: 8),

                // Dates
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      DateFormatter.formatDateRange(booking.startDate, booking.endDate),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),

                const SizedBox(height: 4),

                // Nights
                Row(
                  children: [
                    const Icon(Icons.nights_stay, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      '${booking.numberOfNights} nights',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Total Price
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        PriceFormatter.formatPriceInteger(booking.totalPrice),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor().withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getStatusText(),
                        style: TextStyle(
                          color: _getStatusColor(),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                // Payment Info for Deposit Bookings
                if (booking.paymentMethod == 'vnpay_deposit' &&
                    booking.paymentStatus == 'partially_paid') ...[
                  const SizedBox(height: 8),
                  Container(
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
                            const Icon(Icons.info_outline, size: 16, color: Colors.orange),
                            const SizedBox(width: 4),
                            const Text(
                              'Payment Info',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Deposit Paid (30%):',
                              style: TextStyle(fontSize: 12),
                            ),
                            Text(
                              PriceFormatter.formatPriceInteger(booking.depositAmount ?? 0),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.green,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Remaining (at check-in):',
                              style: TextStyle(fontSize: 12),
                            ),
                            Text(
                              PriceFormatter.formatPriceInteger(
                                booking.totalPrice - (booking.depositAmount ?? 0)
                              ),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.orange,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                // Cash Payment Info
                if (booking.paymentMethod == 'cash') ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.money, size: 16, color: Colors.green),
                        const SizedBox(width: 4),
                        const Text(
                          'Payment: Cash at check-in',
                          style: TextStyle(fontSize: 12, color: Colors.green),
                        ),
                      ],
                    ),
                  ),
                ],

                // Action Buttons
                const SizedBox(height: 12),
                _buildActionButtons(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    // Show Cancel button for pending bookings
    if (booking.status == 'pending') {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () => _showCancelBookingSheet(context),
          icon: const Icon(Icons.cancel_outlined, size: 18),
          label: const Text('Cancel Request'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.errorColor,
            side: BorderSide(color: AppTheme.errorColor),
          ),
        ),
      );
    }

    // Show Checkout/Extend buttons for accepted/approved bookings
    if (!booking.isApproved) {
      return const SizedBox.shrink();
    }

    final now = DateTime.now();
    final canCheckout = booking.startDate.isBefore(now) && !booking.isCheckedOut;
    final canExtend = !booking.isCheckedOut && booking.endDate.isAfter(now);

    if (!canCheckout && !canExtend) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        if (canCheckout)
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _showCheckoutDialog(context),
              icon: const Icon(Icons.check_circle, size: 18),
              label: const Text('Checkout'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        if (canCheckout && canExtend) const SizedBox(width: 8),
        if (canExtend)
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _showExtendStayDialog(context),
              icon: const Icon(Icons.add_circle_outline, size: 18),
              label: const Text('Extend'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primaryColor,
              ),
            ),
          ),
      ],
    );
  }

  void _showCancelBookingSheet(BuildContext context) async {
    // Convert Booking model to Map for the bottom sheet
    final bookingMap = {
      '_id': booking.id,
      'startDate': DateFormatter.formatDate(booking.startDate),
      'endDate': DateFormatter.formatDate(booking.endDate),
      'totalPrice': booking.totalPrice,
      'listingId': booking.listing,
    };

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SizedBox(
        height: MediaQuery.of(context).size.height * 0.9,
        child: CancelBookingBottomSheet(booking: bookingMap),
      ),
    );

    // Refresh trips if cancellation was successful
    if (result == true) {
      onRefresh();
    }
  }

  void _showCheckoutDialog(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CheckoutScreen(
          booking: booking,
          onSuccess: onRefresh,
        ),
      ),
    );
  }

  void _showExtendStayDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => _ExtendStayDialog(
        booking: booking,
        onSuccess: onRefresh,
      ),
    );
  }
}

// Extend Stay Dialog
class _ExtendStayDialog extends StatefulWidget {
  final Booking booking;
  final VoidCallback onSuccess;

  const _ExtendStayDialog({
    required this.booking,
    required this.onSuccess,
  });

  @override
  State<_ExtendStayDialog> createState() => _ExtendStayDialogState();
}

class _ExtendStayDialogState extends State<_ExtendStayDialog> {
  final BookingService _bookingService = BookingService();
  int _additionalDays = 1;
  bool _isSubmitting = false;

  double get _extensionCost {
    final listing = widget.booking.listing as Map?;
    final pricePerNight = listing?['price']?.toDouble() ?? widget.booking.totalPrice / widget.booking.numberOfNights;
    return pricePerNight * _additionalDays * 1.3; // 30% surcharge
  }

  Future<void> _extendStay() async {
    setState(() => _isSubmitting = true);

    final result = await _bookingService.extendStay(
      bookingId: widget.booking.id,
      additionalDays: _additionalDays,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);

      if (result['success']) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Extension request sent to host!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        widget.onSuccess();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Extension request failed'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final newEndDate = widget.booking.endDate.add(Duration(days: _additionalDays));

    return AlertDialog(
      title: const Text('Extend Stay'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Current checkout: ${DateFormatter.formatDate(widget.booking.endDate)}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),

          Text(
            'Additional Days',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton(
                onPressed: _additionalDays > 1
                    ? () => setState(() => _additionalDays--)
                    : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Expanded(
                child: Center(
                  child: Text(
                    '$_additionalDays days',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => setState(() => _additionalDays++),
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.backgroundColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('New checkout:'),
                    Text(
                      DateFormatter.formatDate(newEndDate),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Extension cost:'),
                    Text(
                      PriceFormatter.formatPriceInteger(_extensionCost),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  '(30% surcharge)',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _extendStay,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Request Extension'),
        ),
      ],
    );
  }
}
