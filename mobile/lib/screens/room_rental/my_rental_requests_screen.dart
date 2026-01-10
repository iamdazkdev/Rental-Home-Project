import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/room_rental.dart';
import '../../providers/auth_provider.dart';
import '../../services/room_rental_service.dart';
import '../../utils/date_formatter.dart';

class MyRentalRequestsScreen extends StatefulWidget {
  const MyRentalRequestsScreen({super.key});

  @override
  State<MyRentalRequestsScreen> createState() => _MyRentalRequestsScreenState();
}

class _MyRentalRequestsScreenState extends State<MyRentalRequestsScreen> {
  final RoomRentalService _roomRentalService = RoomRentalService();
  List<RentalRequest> _requests = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final requests = await _roomRentalService.getMyRentalRequests(user.id);

    setState(() {
      _requests = requests;
      _isLoading = false;
    });
  }

  List<RentalRequest> get _filteredRequests {
    if (_selectedFilter == 'all') return _requests;
    return _requests
        .where((r) => r.status.value.toLowerCase() == _selectedFilter)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'My Rental Requests',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withValues(alpha: 0.8)
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter Tabs with improved design
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', 'all', Icons.list_alt),
                  _buildFilterChip(
                      'Pending', 'requested', Icons.pending_outlined),
                  _buildFilterChip(
                      'Approved', 'approved', Icons.check_circle_outline),
                  _buildFilterChip(
                      'Rejected', 'rejected', Icons.cancel_outlined),
                  _buildFilterChip(
                      'Cancelled', 'cancelled', Icons.block_outlined),
                ],
              ),
            ),
          ),

          // Divider
          const Divider(height: 1),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredRequests.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadRequests,
                        color: AppTheme.primaryColor,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredRequests.length,
                          itemBuilder: (context, index) {
                            return _RequestCard(
                              request: _filteredRequests[index],
                              onCancel: _cancelRequest,
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, IconData icon) {
    final isSelected = _selectedFilter == value;
    final count = value == 'all'
        ? _requests.length
        : _requests.where((r) => r.status.value.toLowerCase() == value).length;

    // Define colors for each filter type
    Color chipColor;
    Color selectedBgColor;
    switch (value) {
      case 'all':
        chipColor = AppTheme.primaryColor;
        selectedBgColor = AppTheme.primaryColor;
        break;
      case 'requested':
        chipColor = Colors.orange.shade600;
        selectedBgColor = Colors.orange.shade600;
        break;
      case 'approved':
        chipColor = Colors.green.shade600;
        selectedBgColor = Colors.green.shade600;
        break;
      case 'rejected':
        chipColor = Colors.red.shade600;
        selectedBgColor = Colors.red.shade600;
        break;
      case 'cancelled':
        chipColor = Colors.grey.shade600;
        selectedBgColor = Colors.grey.shade600;
        break;
      default:
        chipColor = AppTheme.primaryColor;
        selectedBgColor = AppTheme.primaryColor;
    }

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        avatar: Icon(
          icon,
          size: 18,
          color: isSelected ? Colors.white : chipColor,
        ),
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: isSelected ? Colors.white : chipColor,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.3)
                      : chipColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  count.toString(),
                  style: TextStyle(
                    color: isSelected ? Colors.white : chipColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        selected: isSelected,
        onSelected: (selected) {
          setState(() => _selectedFilter = value);
        },
        selectedColor: selectedBgColor,
        checkmarkColor: Colors.white,
        backgroundColor: chipColor.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color:
                isSelected ? selectedBgColor : chipColor.withValues(alpha: 0.5),
            width: isSelected ? 2 : 1.5,
          ),
        ),
        elevation: isSelected ? 3 : 0,
        shadowColor: isSelected ? chipColor.withValues(alpha: 0.4) : null,
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    IconData iconData;

    switch (_selectedFilter) {
      case 'requested':
        message = 'No pending rental requests';
        iconData = Icons.pending_outlined;
        break;
      case 'approved':
        message = 'No approved requests yet';
        iconData = Icons.check_circle_outline;
        break;
      case 'rejected':
        message = 'No rejected requests';
        iconData = Icons.cancel_outlined;
        break;
      case 'cancelled':
        message = 'No cancelled requests';
        iconData = Icons.block_outlined;
        break;
      default:
        message = 'No rental requests yet';
        iconData = Icons.description_outlined;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                iconData,
                size: 80,
                color: AppTheme.primaryColor.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              _selectedFilter == 'all'
                  ? 'Start by browsing room rental listings\nand submit a request to rent a room'
                  : 'Filter your requests using the tabs above',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (_selectedFilter == 'all') ...[
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.search),
                label: const Text('Browse Listings'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _cancelRequest(RentalRequest request) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Request'),
        content:
            const Text('Are you sure you want to cancel this rental request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel Request'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final result = await _roomRentalService.cancelRequest(request.id);

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Request cancelled'), backgroundColor: Colors.green),
      );
      _loadRequests();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
      );
    }
  }
}

class _RequestCard extends StatelessWidget {
  final RentalRequest request;
  final Function(RentalRequest) onCancel;

  const _RequestCard({
    required this.request,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final statusValue = request.status.value.toLowerCase();

    // Get photo from populated room data
    String? photoUrl;
    if (request.room is Map) {
      final roomData = request.room as Map;
      final photos = roomData['listingPhotoPaths'];
      if (photos is List && photos.isNotEmpty) {
        photoUrl = photos.first.toString();
      }
    }

    return GestureDetector(
      onTap: () {
        // Show a message that detail view is not available yet
        // In the future, you can navigate to detail screen when room data is complete
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('View details for: ${request.roomTitle ?? "this room"}'),
            duration: const Duration(seconds: 2),
          ),
        );
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 16),
        elevation: 2,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: _getStatusColor().withValues(alpha: 0.3),
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            if (photoUrl != null && photoUrl.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: Stack(
                  children: [
                    CachedNetworkImage(
                      imageUrl: photoUrl,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: const Center(
                          child: CircularProgressIndicator(),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.home_work_outlined,
                              size: 60,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'No Image',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Gradient overlay for better text visibility
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.7),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Status Badge on Image
                    Positioned(
                      top: 12,
                      right: 12,
                      child: _buildStatusBadge(),
                    ),
                  ],
                ),
              ),

            // Header with gradient background (only if no image)
            if (photoUrl == null || photoUrl.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _getStatusColor().withValues(alpha: 0.15),
                      _getStatusColor().withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    // Status Icon
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _getStatusColor().withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getStatusIcon(),
                        color: _getStatusColor(),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Title and Status
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            request.roomTitle ?? 'Room Rental Request',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          _buildStatusBadge(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title (if image exists)
                  if (photoUrl != null && photoUrl.isNotEmpty) ...[
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _getStatusColor().withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            _getStatusIcon(),
                            color: _getStatusColor(),
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            request.roomTitle ?? 'Room Rental Request',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],

                  // ...existing code...
                  _buildInfoRow(
                    Icons.calendar_today_rounded,
                    'Move-in Date',
                    DateFormatter.formatDate(request.moveInDate),
                    AppTheme.primaryColor,
                  ),
                  const SizedBox(height: 12),

                  // Duration
                  _buildInfoRow(
                    Icons.access_time_rounded,
                    'Stay Duration',
                    '${request.intendedStayDuration} months',
                    Colors.orange,
                  ),
                  const SizedBox(height: 12),

                  // Submitted Date
                  _buildInfoRow(
                    Icons.send_rounded,
                    'Submitted',
                    DateFormatter.formatDate(request.createdAt),
                    Colors.blue,
                  ),

                  // Rejection Reason
                  if (statusValue == 'rejected' &&
                      request.rejectionReason != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.red.withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.info_outline_rounded,
                            color: Colors.red[700],
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Rejection Reason',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red[700],
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  request.rejectionReason!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.red[900],
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Cancel Action
                  if (statusValue == 'requested') ...[
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => onCancel(request),
                        icon: const Icon(Icons.close_rounded, size: 20),
                        label: const Text(
                          'Cancel Request',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red[700],
                          side: BorderSide(color: Colors.red[300]!, width: 1.5),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  IconData _getStatusIcon() {
    final statusValue = request.status.value.toLowerCase();
    switch (statusValue) {
      case 'requested':
        return Icons.pending_outlined;
      case 'approved':
        return Icons.check_circle_outline;
      case 'rejected':
        return Icons.cancel_outlined;
      case 'cancelled':
        return Icons.block_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  Color _getStatusColor() {
    final statusValue = request.status.value.toLowerCase();
    switch (statusValue) {
      case 'requested':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Widget _buildStatusBadge() {
    Color color;
    String label;

    final statusValue = request.status.value.toLowerCase();

    switch (statusValue) {
      case 'requested':
        color = Colors.orange;
        label = 'Pending';
        break;
      case 'approved':
        color = Colors.green;
        label = 'Approved';
        break;
      case 'rejected':
        color = Colors.red;
        label = 'Rejected';
        break;
      case 'cancelled':
        color = Colors.grey;
        label = 'Cancelled';
        break;
      default:
        color = Colors.grey;
        label = request.status.value;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color, width: 1.5),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
