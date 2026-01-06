import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../models/booking.dart';
import '../../config/app_theme.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../../widgets/reject_booking_bottom_sheet.dart';

class BookingRequestsScreen extends StatefulWidget {
  const BookingRequestsScreen({super.key});

  @override
  State<BookingRequestsScreen> createState() => _BookingRequestsScreenState();
}

class _BookingRequestsScreenState extends State<BookingRequestsScreen> {
  final BookingService _bookingService = BookingService();
  List<Booking> _reservations = [];
  bool _isLoading = true;
  String _filter = 'all'; // all, pending, accepted, rejected

  @override
  void initState() {
    super.initState();
    _loadReservations();
  }

  Future<void> _loadReservations() async {
    setState(() => _isLoading = true);

    final user = context.read<AuthProvider>().user;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    final reservations = await _bookingService.getHostReservations(user.id);

    setState(() {
      _reservations = reservations;
      _isLoading = false;
    });
  }

  List<Booking> get _filteredReservations {
    if (_filter == 'all') return _reservations;

    return _reservations.where((booking) {
      if (_filter == 'pending') return booking.status == 'pending';
      if (_filter == 'accepted') return booking.status == 'accepted';
      if (_filter == 'rejected') return booking.status == 'rejected';
      return true;
    }).toList();
  }

  Future<void> _acceptBooking(String bookingId) async {
    try {
      final result = await _bookingService.acceptBooking(bookingId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Booking accepted'),
            backgroundColor: AppTheme.successColor,
          ),
        );

        if (result['success']) {
          _loadReservations();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _rejectBooking(Booking booking) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RejectBookingBottomSheet(
        booking: {
          '_id': booking.id,
          'listingId': {'title': booking.listingTitle ?? 'Property'},
          'customerId': {'firstName': booking.guestName ?? 'Guest'},
        },
      ),
    );

    if (reason == null) return; // User cancelled

    try {
      final result = await _bookingService.rejectBooking(booking.id, reason: reason);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Booking rejected'),
            backgroundColor: result['success'] ? AppTheme.errorColor : Colors.orange,
          ),
        );

        if (result['success']) {
          _loadReservations();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking Requests'),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filter Chips
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('All', 'all'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Pending', 'pending'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Accepted', 'accepted'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Rejected', 'rejected'),
                      ],
                    ),
                  ),
                ),

                // Reservations List
                Expanded(
                  child: _filteredReservations.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadReservations,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredReservations.length,
                            itemBuilder: (context, index) {
                              final booking = _filteredReservations[index];
                              return _buildBookingCard(booking);
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _filter = value;
        });
      },
      selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
      checkmarkColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildEmptyState() {
    String message = 'No booking requests';
    String subtitle = '';

    if (_filter == 'pending') {
      message = 'No pending requests';
      subtitle = 'Pending booking requests will appear here';
    } else if (_filter == 'accepted') {
      message = 'No accepted bookings';
      subtitle = 'Accepted bookings will appear here';
    } else if (_filter == 'rejected') {
      message = 'No rejected bookings';
      subtitle = 'Rejected bookings will appear here';
    } else {
      subtitle = 'Booking requests from guests will appear here';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_note_outlined,
            size: 80,
            color: AppTheme.textSecondaryColor.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppTheme.textSecondaryColor,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textSecondaryColor,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingCard(Booking booking) {
    final statusColor = _getStatusColor(booking.status);
    final statusIcon = _getStatusIcon(booking.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 24),
                const SizedBox(width: 8),
                Text(
                  booking.status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const Spacer(),
                Text(
                  DateFormatter.getRelativeTime(booking.createdAt ?? DateTime.now()),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondaryColor,
                      ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Guest Info
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: booking.guestProfileImage != null
                          ? NetworkImage(booking.guestProfileImage!)
                          : null,
                      child: booking.guestProfileImage == null
                          ? const Icon(Icons.person)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            booking.guestName ?? 'Guest',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            booking.guestEmail ?? '',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.textSecondaryColor,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Divider(height: 24),

                // Listing Info
                Text(
                  booking.listingTitle ?? 'Property',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),

                // Dates
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 16, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 8),
                    Text(
                      '${DateFormatter.formatDate(booking.startDate)} - ${DateFormatter.formatDate(booking.endDate)}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Total Price
                Row(
                  children: [
                    const Icon(Icons.attach_money, size: 16, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 8),
                    Text(
                      PriceFormatter.formatPrice(booking.totalPrice),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                    ),
                  ],
                ),

                // Action Buttons (only for pending)
                if (booking.status == 'pending') ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _rejectBooking(booking),
                          icon: const Icon(Icons.close, size: 18),
                          label: const Text('Reject'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.errorColor,
                            side: const BorderSide(color: AppTheme.errorColor),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _acceptBooking(booking.id),
                          icon: const Icon(Icons.check, size: 18),
                          label: const Text('Accept'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.successColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                // Rejection reason
                if (booking.status == 'rejected' && booking.rejectionReason != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          size: 18,
                          color: AppTheme.errorColor,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            booking.rejectionReason!,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.errorColor,
                                ),
                          ),
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

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'accepted':
        return AppTheme.successColor;
      case 'rejected':
        return AppTheme.errorColor;
      case 'completed':
        return Colors.blue;
      default:
        return AppTheme.textSecondaryColor;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Icons.schedule;
      case 'accepted':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'completed':
        return Icons.task_alt;
      default:
        return Icons.info;
    }
  }
}

