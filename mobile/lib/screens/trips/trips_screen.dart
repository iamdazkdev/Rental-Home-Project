import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../config/app_theme.dart';
import '../../features/booking/domain/entities/booking_entity.dart';
import '../../features/booking/presentation/cubit/booking_cubit.dart';
import '../../features/booking/presentation/cubit/booking_state.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';

class TripsScreen extends StatelessWidget {
  const TripsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => GetIt.I<BookingCubit>()..loadUserBookings(),
      child: const _TripsView(),
    );
  }
}

class _TripsView extends StatefulWidget {
  const _TripsView();

  @override
  State<_TripsView> createState() => _TripsViewState();
}

class _TripsViewState extends State<_TripsView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<BookingEntity> _upcomingTrips(List<BookingEntity> trips) {
    final now = DateTime.now();
    return trips.where((trip) {
      return (trip.isPending || trip.isApproved || trip.isCheckedIn) &&
          trip.endDate.isAfter(now);
    }).toList();
  }

  List<BookingEntity> _pastTrips(List<BookingEntity> trips) {
    final now = DateTime.now();
    return trips.where((trip) {
      return trip.isCompleted ||
          trip.isCheckedOut ||
          trip.isRejected ||
          trip.isCancelled ||
          trip.isExpired ||
          trip.endDate.isBefore(now) ||
          trip.endDate.isAtSameMomentAs(now);
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
      body: BlocBuilder<BookingCubit, BookingState>(
        builder: (context, state) {
          if (state is BookingLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is BookingError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(state.message),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () =>
                        context.read<BookingCubit>().loadUserBookings(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is BookingsLoaded) {
            final upcoming = _upcomingTrips(state.bookings);
            final past = _pastTrips(state.bookings);

            return TabBarView(
              controller: _tabController,
              children: [
                _buildTripsList(context, upcoming, isUpcoming: true),
                _buildTripsList(context, past, isUpcoming: false),
              ],
            );
          }

          return const Center(child: Text('No trips found'));
        },
      ),
    );
  }

  Widget _buildTripsList(
    BuildContext context,
    List<BookingEntity> trips, {
    required bool isUpcoming,
  }) {
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
      onRefresh: () async =>
          context.read<BookingCubit>().loadUserBookings(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: trips.length,
        itemBuilder: (context, index) {
          return _BookingCard(booking: trips[index]);
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final BookingEntity booking;

  const _BookingCard({required this.booking});

  Color _getStatusColor() {
    if (booking.isPending) return AppTheme.warningColor;
    if (booking.isApproved) return AppTheme.successColor;
    if (booking.isRejected) return AppTheme.errorColor;
    if (booking.isCompleted || booking.isCheckedOut) return Colors.grey;
    return Colors.grey;
  }

  String _getStatusText() {
    if (booking.isPending) return 'Pending Approval';
    if (booking.isApproved) return 'Approved';
    if (booking.isRejected) return 'Rejected';
    if (booking.isCompleted) return 'Completed';
    if (booking.isCheckedOut) return 'Checked Out';
    if (booking.isCancelled) return 'Cancelled';
    return booking.effectiveStatus;
  }

  @override
  Widget build(BuildContext context) {
    final listingData = booking.listing;
    final listingTitle =
        listingData?['title'] as String? ?? 'Property';
    final listingPhotos =
        listingData?['listingPhotoPaths'] as List?;
    final photoUrl =
        listingPhotos?.isNotEmpty == true ? listingPhotos!.first : null;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          if (photoUrl != null)
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: CachedNetworkImage(
                imageUrl: photoUrl.toString().startsWith('http')
                    ? photoUrl.toString()
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
                // Title
                Text(
                  listingTitle,
                  style: Theme.of(context).textTheme.titleMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 8),

                // Dates
                Row(
                  children: [
                    const Icon(Icons.calendar_today,
                        size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      DateFormatter.formatDateRange(
                          booking.startDate, booking.endDate),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),

                const SizedBox(height: 4),

                // Nights
                Row(
                  children: [
                    const Icon(Icons.nights_stay,
                        size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      '${booking.numberOfNights} nights',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Total Price + Status
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        PriceFormatter.formatPriceInteger(booking.totalPrice),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
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

                // Deposit Payment Info
                if (booking.isDepositPayment && booking.isPartiallyPaid) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: Colors.orange.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.info_outline,
                                size: 16, color: Colors.orange),
                            SizedBox(width: 4),
                            Text(
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
                            Text(
                              'Deposit Paid (${booking.depositPercentage}%):',
                              style: const TextStyle(fontSize: 12),
                            ),
                            Text(
                              PriceFormatter.formatPriceInteger(
                                  booking.depositAmount),
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
                                  booking.effectiveRemainingAmount),
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
                if (booking.isCashPayment) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.money, size: 16, color: Colors.green),
                        SizedBox(width: 4),
                        Text(
                          'Payment: Cash at check-in',
                          style:
                              TextStyle(fontSize: 12, color: Colors.green),
                        ),
                      ],
                    ),
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
