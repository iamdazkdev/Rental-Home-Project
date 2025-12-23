import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';

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
      case 'accepted':  // Backend uses 'accepted'
        return AppTheme.successColor;
      case 'rejected':
        return AppTheme.errorColor;
      case 'completed':
      case 'checkedOut':
      case 'checked_out':  // Backend uses 'checked_out'
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
      case 'accepted':  // Backend uses 'accepted'
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'checkedOut':
      case 'checked_out':  // Backend uses 'checked_out'
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
                Text(
                  PriceFormatter.formatPriceInteger(booking.totalPrice),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}



