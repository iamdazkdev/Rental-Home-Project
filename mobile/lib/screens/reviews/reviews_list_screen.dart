import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../models/review.dart';
import '../../services/review_service.dart';

class ReviewsListScreen extends StatefulWidget {
  final String listingId;

  const ReviewsListScreen({
    super.key,
    required this.listingId,
  });

  @override
  State<ReviewsListScreen> createState() => _ReviewsListScreenState();
}

class _ReviewsListScreenState extends State<ReviewsListScreen> {
  final _reviewService = ReviewService();
  final _scrollController = ScrollController();

  List<ReviewModel> _reviews = [];
  double _averageRating = 0;
  int _totalReviews = 0;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _loadReviews();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      if (!_isLoadingMore && _hasMore) {
        _loadMore();
      }
    }
  }

  Future<void> _loadReviews() async {
    setState(() {
      _isLoading = true;
      _currentPage = 1;
    });

    try {
      final data = await _reviewService.getListingReviewsWithStats(
        widget.listingId,
        page: _currentPage,
      );

      if (!mounted) return;

      setState(() {
        // Parse reviews
        if (data['reviews'] != null) {
          final reviewsList = data['reviews'] as List;
          _reviews = reviewsList
              .map((json) => ReviewModel.fromJson(json as Map<String, dynamic>))
              .toList();
        }

        // Parse stats
        if (data['stats'] != null) {
          final stats = data['stats'] as Map<String, dynamic>;
          _averageRating = (stats['averageRating'] as num?)?.toDouble() ?? 0.0;
          _totalReviews = (stats['totalReviews'] as num?)?.toInt() ?? 0;
        }

        // Parse pagination
        if (data['pagination'] != null) {
          final pagination = data['pagination'] as Map<String, dynamic>;
          final page = (pagination['page'] as num?)?.toInt() ?? 1;
          final pages = (pagination['pages'] as num?)?.toInt() ?? 1;
          _hasMore = page < pages;
        }

        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading reviews: $e')),
      );
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    try {
      final data = await _reviewService.getListingReviewsWithStats(
        widget.listingId,
        page: _currentPage,
      );

      if (!mounted) return;

      setState(() {
        // Parse and add more reviews
        if (data['reviews'] != null) {
          final reviewsList = data['reviews'] as List;
          final newReviews = reviewsList
              .map((json) => ReviewModel.fromJson(json as Map<String, dynamic>))
              .toList();
          _reviews.addAll(newReviews);
        }

        // Parse pagination
        if (data['pagination'] != null) {
          final pagination = data['pagination'] as Map<String, dynamic>;
          final page = (pagination['page'] as num?)?.toInt() ?? 1;
          final pages = (pagination['pages'] as num?)?.toInt() ?? 1;
          _hasMore = page < pages;
        }

        _isLoadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _isLoadingMore = false;
        _currentPage--; // Revert page increment on error
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reviews'),
        elevation: 0,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_reviews.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.rate_review_outlined, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No reviews yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to review this listing!',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadReviews,
      child: ListView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        children: [
          // Stats Header
          _buildStatsHeader(),

          const SizedBox(height: 24),

          // Reviews List
          ..._reviews.map((review) => _buildReviewCard(review)),

          // Load More Indicator
          if (_isLoadingMore)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),

          if (!_hasMore && _reviews.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Text(
                  'No more reviews',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            // Rating Circle
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.star,
                    color: AppTheme.primaryColor,
                    size: 28,
                  ),
                  Text(
                    _averageRating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 20),

            // Stats Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_totalReviews ${_totalReviews == 1 ? "Review" : "Reviews"}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < _averageRating.round()
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber,
                        size: 20,
                      );
                    }),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewCard(ReviewModel review) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Reviewer Info
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: review.reviewerProfileImage != null
                      ? CachedNetworkImageProvider(review.reviewerProfileImage!)
                      : null,
                  backgroundColor: AppTheme.primaryColor,
                  child: review.reviewerProfileImage == null
                      ? Text(
                          review.reviewerName[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
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
                        review.reviewerName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        formatRelativeDate(review.createdAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: List.generate(5, (index) {
                    return Icon(
                      index < review.listingRating
                          ? Icons.star
                          : Icons.star_border,
                      color: Colors.amber,
                      size: 18,
                    );
                  }),
                ),
              ],
            ),

            // Listing Comment
            if (review.listingComment.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                review.listingComment,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ],

            // Host Rating
            if (review.hostRating != null && review.hostRating! > 0) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  const Text(
                    'Host Rating:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Row(
                    children: List.generate(5, (index) {
                      return Icon(
                        index < review.hostRating!
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber,
                        size: 14,
                      );
                    }),
                  ),
                ],
              ),
              if (review.hostComment != null &&
                  review.hostComment!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  review.hostComment!,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[700],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  String formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return '${difference.inMinutes} minutes ago';
      }
      return '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? "week" : "weeks"} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? "month" : "months"} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? "year" : "years"} ago';
    }
  }
}
