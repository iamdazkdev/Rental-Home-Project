import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen>
    with SingleTickerProviderStateMixin {
  final BookingService _bookingService = BookingService();
  late TabController _tabController;

  List<Booking> _allBookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final trips = await _bookingService.getUserTrips(user.id);

    setState(() {
      _allBookings = trips;
      _isLoading = false;
    });
  }

  List<Booking> get _completedBookings {
    return _allBookings.where((b) =>
      b.isCheckedOut || b.isCompleted || b.endDate.isBefore(DateTime.now())
    ).toList();
  }

  List<Booking> get _cancelledRejected {
    return _allBookings.where((b) =>
      b.status == 'rejected' || b.status == 'cancelled'
    ).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking History'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled/Rejected'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildBookingList(_completedBookings, 'No completed bookings'),
                _buildBookingList(_cancelledRejected, 'No cancelled bookings'),
              ],
            ),
    );
  }

  Widget _buildBookingList(List<Booking> bookings, String emptyMessage) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: const TextStyle(
                fontSize: 18,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          return _BookingHistoryCard(booking: bookings[index]);
        },
      ),
    );
  }
}

class _BookingHistoryCard extends StatelessWidget {
  final Booking booking;

  const _BookingHistoryCard({required this.booking});

  Color _getStatusColor() {
    switch (booking.status) {
      case 'completed':
      case 'checked_out':
        return AppTheme.successColor;
      case 'rejected':
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText() {
    switch (booking.status) {
      case 'completed':
        return 'Completed';
      case 'checked_out':
        return 'Checked Out';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
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
                imageUrl: photoUrl.toString(),
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
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
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

                const SizedBox(height: 12),

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

                const SizedBox(height: 12),

                // Total Price
                Text(
                  PriceFormatter.formatPriceInteger(booking.totalPrice),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                ),

                // Review info if checked out
                if (booking.isCheckedOut && booking.homeReview != null) ...[
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        'You reviewed this property',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                              fontStyle: FontStyle.italic,
                            ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

