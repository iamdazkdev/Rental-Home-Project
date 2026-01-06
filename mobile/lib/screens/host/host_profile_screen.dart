import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../services/host_service.dart';
import '../../utils/date_formatter.dart';

class HostProfileScreen extends StatefulWidget {
  final String hostId;

  const HostProfileScreen({
    super.key,
    required this.hostId,
  });

  @override
  State<HostProfileScreen> createState() => _HostProfileScreenState();
}

class _HostProfileScreenState extends State<HostProfileScreen> {
  final HostService _hostService = HostService();
  Map<String, dynamic>? _hostData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHostProfile();
  }

  Future<void> _loadHostProfile() async {
    setState(() => _isLoading = true);

    final data = await _hostService.getHostProfile(widget.hostId);

    setState(() {
      _hostData = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_hostData == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Host Not Found')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.person_off, size: 80, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Host not found',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final host = _hostData!['host'] as Map<String, dynamic>;
    final statistics = _hostData!['statistics'] as Map<String, dynamic>;
    final listings = _hostData!['listings'] as List<dynamic>? ?? [];
    final reviews = _hostData!['reviews'] as List<dynamic>? ?? [];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Header with host info
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primaryColor,
                      AppTheme.primaryColor.withValues(alpha: 0.7),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 50),
                      // Host Avatar
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.white,
                        child: CircleAvatar(
                          radius: 37,
                          backgroundColor: AppTheme.primaryColor,
                          backgroundImage: host['profileImagePath'] != null &&
                                  host['profileImagePath'].toString().isNotEmpty
                              ? CachedNetworkImageProvider(
                                  host['profileImagePath'].toString(),
                                )
                              : null,
                          child: host['profileImagePath'] == null ||
                                  host['profileImagePath'].toString().isEmpty
                              ? Text(
                                  _getInitial(host['firstName']),
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${host['firstName'] ?? 'Host'} ${host['lastName'] ?? ''}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        host['createdAt'] != null
                            ? 'Member since ${DateFormatter.formatMonthYear(DateTime.parse(host['createdAt']))}'
                            : 'Member',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Statistics Cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.star,
                          value: statistics['averageHostRating']?.toStringAsFixed(1) ?? '0.0',
                          label: 'Rating',
                          color: Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.rate_review,
                          value: statistics['totalReviews']?.toString() ?? '0',
                          label: 'Reviews',
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.home_work,
                          value: statistics['totalListings']?.toString() ?? '0',
                          label: 'Listings',
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.check_circle,
                          value: '${statistics['responseRate'] ?? 0}%',
                          label: 'Response',
                          color: Colors.purple,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Reviews Section
                  if (reviews.isNotEmpty) ...[
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 28),
                        const SizedBox(width: 8),
                        Text(
                          'Host Reviews',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ...reviews.take(5).map((review) => _buildReviewCard(review)),
                    if (reviews.length > 5) ...[
                      const SizedBox(height: 16),
                      Center(
                        child: TextButton(
                          onPressed: () {
                            // Show all reviews
                          },
                          child: Text('View all ${reviews.length} reviews'),
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                  ],

                  // Listings Section
                  if (listings.isNotEmpty) ...[
                    Row(
                      children: [
                        const Icon(Icons.home, color: AppTheme.primaryColor, size: 28),
                        const SizedBox(width: 8),
                        Text(
                          '${host['firstName']}\'s Listings',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${listings.length} active listing${listings.length != 1 ? 's' : ''}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondaryColor,
                          ),
                    ),
                    const SizedBox(height: 16),
                    // Display listings count
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Center(
                        child: Text(
                          'This host has ${listings.length} active listing${listings.length != 1 ? 's' : ''}',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getInitial(dynamic name) {
    if (name == null) return 'H';
    final nameStr = name.toString().trim();
    if (nameStr.isEmpty) return 'H';
    return nameStr[0].toUpperCase();
  }

  Widget _buildStatCard({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final rating = (review['hostRating'] ?? 0).toDouble();
    final comment = review['hostComment'] ?? review['hostReview'] ?? '';
    // Backend populates reviewerId as reviewer
    final reviewer = review['reviewerId'] as Map<String, dynamic>?;
    final createdAt = review['createdAt'] != null
        ? DateTime.parse(review['createdAt'])
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppTheme.primaryColor,
                backgroundImage: reviewer?['profileImagePath'] != null &&
                        reviewer!['profileImagePath'].toString().isNotEmpty
                    ? CachedNetworkImageProvider(reviewer['profileImagePath'].toString())
                    : null,
                child: reviewer?['profileImagePath'] == null ||
                        reviewer!['profileImagePath'].toString().isEmpty
                    ? Text(
                        _getInitial(reviewer?['firstName']),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${reviewer?['firstName'] ?? 'User'} ${reviewer?['lastName'] ?? ''}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    if (createdAt != null)
                      Text(
                        DateFormatter.formatDate(createdAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                  ],
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < rating.round() ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 16,
                  );
                }),
              ),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              comment,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ],
      ),
    );
  }
}

