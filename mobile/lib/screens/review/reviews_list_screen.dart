import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/repositories/review_repository.dart';
import '../../models/review.dart';
import '../../presentation/review/cubit/review_cubit.dart';
import '../../widgets/review_widgets.dart';

class ReviewsListScreen extends StatelessWidget {
  final String listingId;
  final String listingTitle;

  const ReviewsListScreen({
    super.key,
    required this.listingId,
    required this.listingTitle,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => ReviewCubit(
        reviewRepository: ReviewRepository(),
      )..loadListingReviews(listingId),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Reviews'),
          backgroundColor: Theme.of(context).primaryColor,
        ),
        body: BlocBuilder<ReviewCubit, ReviewState>(
          builder: (context, state) {
            if (state is ReviewLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is ReviewError) {
              return _buildError(context, state.message);
            }

            if (state is ReviewsLoaded) {
              return _buildReviewsList(context, state);
            }

            return const SizedBox();
          },
        ),
      ),
    );
  }

  Widget _buildError(BuildContext context, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            'Error loading reviews',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              context.read<ReviewCubit>().loadListingReviews(listingId);
            },
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsList(BuildContext context, ReviewsLoaded state) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Listing title
          if (listingTitle.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Reviews for',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    listingTitle,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

          // Review summary
          if (state.summary != null)
            ReviewSummaryWidget(summary: state.summary!),

          // Reviews list
          if (state.reviews.isEmpty)
            _buildNoReviews(context)
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: state.reviews.length,
              itemBuilder: (context, index) {
                return _buildReviewCard(context, state.reviews[index]);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildNoReviews(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(
            Icons.star_border,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No reviews yet',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to leave a review!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(BuildContext context, ReviewModel review) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Reviewer info
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: review.reviewerProfileImage != null
                      ? NetworkImage(review.reviewerProfileImage!)
                      : null,
                  child: review.reviewerProfileImage == null
                      ? Text(
                          review.reviewerName.isNotEmpty
                              ? review.reviewerName[0].toUpperCase()
                              : 'U',
                          style: const TextStyle(
                            fontSize: 20,
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
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(review.createdAt),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                StarRating(rating: review.listingRating.toDouble()),
              ],
            ),

            const SizedBox(height: 12),

            // Review comment
            Text(
              review.listingComment,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
              ),
            ),

            // Host response (if any)
            if (review.hostComment != null && review.hostComment!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.reply,
                          size: 16,
                          color: Theme.of(context).primaryColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Host response',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      review.hostComment!,
                      style: const TextStyle(
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return weeks == 1 ? '1 week ago' : '$weeks weeks ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return months == 1 ? '1 month ago' : '$months months ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return years == 1 ? '1 year ago' : '$years years ago';
    }
  }
}
