import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/repositories/review_repository.dart';
import '../../models/review.dart';
import '../../presentation/review/cubit/review_cubit.dart';
import '../../widgets/review_widgets.dart';

class SubmitReviewScreen extends StatefulWidget {
  final String bookingId;
  final String listingId;
  final String listingTitle;
  final ReviewModel? existingReview; // For editing

  const SubmitReviewScreen({
    super.key,
    required this.bookingId,
    required this.listingId,
    required this.listingTitle,
    this.existingReview,
  });

  @override
  State<SubmitReviewScreen> createState() => _SubmitReviewScreenState();
}

class _SubmitReviewScreenState extends State<SubmitReviewScreen> {
  final _commentController = TextEditingController();
  int _rating = 0;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.existingReview != null) {
      _rating = widget.existingReview!.listingRating;
      _commentController.text = widget.existingReview!.listingComment;
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingReview != null;

    return BlocProvider(
      create: (context) => ReviewCubit(
        reviewRepository: ReviewRepository(),
      ),
      child: Scaffold(
        appBar: AppBar(
          title: Text(isEditing ? 'Edit Review' : 'Write a Review'),
          backgroundColor: Theme.of(context).primaryColor,
        ),
        body: BlocConsumer<ReviewCubit, ReviewState>(
          listener: (context, state) {
            if (state is ReviewSubmitted || state is ReviewUpdated) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isEditing
                        ? '✅ Review updated successfully!'
                        : '✅ Review submitted successfully!',
                  ),
                  backgroundColor: Colors.green,
                ),
              );
              Navigator.pop(context, true); // Return true to indicate success
            } else if (state is ReviewError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('❌ ${state.message}'),
                  backgroundColor: Colors.red,
                ),
              );
              setState(() => _isSubmitting = false);
            }
          },
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Listing info
                  _buildListingInfo(),
                  const SizedBox(height: 24),

                  // Star rating
                  _buildRatingSection(),
                  const SizedBox(height: 24),

                  // Comment input
                  _buildCommentSection(),
                  const SizedBox(height: 24),

                  // Submit button
                  _buildSubmitButton(context, isEditing),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildListingInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.home, size: 32, color: Colors.grey),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Review for:',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.listingTitle,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'How would you rate your stay?',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: StarRatingSelector(
            initialRating: _rating,
            size: 48,
            onRatingChanged: (rating) {
              setState(() => _rating = rating);
            },
          ),
        ),
        const SizedBox(height: 8),
        if (_rating > 0)
          Center(
            child: Text(
              _getRatingDescription(_rating),
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCommentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Share your experience',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Help other guests know what to expect',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _commentController,
          maxLines: 6,
          maxLength: 500,
          decoration: InputDecoration(
            hintText: 'Describe your experience...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide:
                  BorderSide(color: Theme.of(context).primaryColor, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton(BuildContext context, bool isEditing) {
    final canSubmit = _rating > 0 &&
        _commentController.text.trim().length >= 10 &&
        !_isSubmitting;

    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: canSubmit ? () => _submitReview(context, isEditing) : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).primaryColor,
          disabledBackgroundColor: Colors.grey[300],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isSubmitting
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                isEditing ? 'Update Review' : 'Submit Review',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  void _submitReview(BuildContext context, bool isEditing) {
    setState(() => _isSubmitting = true);

    if (isEditing) {
      context.read<ReviewCubit>().updateReview(
            reviewId: widget.existingReview!.id,
            rating: _rating,
            comment: _commentController.text.trim(),
          );
    } else {
      context.read<ReviewCubit>().submitReview(
            bookingId: widget.bookingId,
            listingId: widget.listingId,
            rating: _rating,
            comment: _commentController.text.trim(),
          );
    }
  }

  String _getRatingDescription(int rating) {
    switch (rating) {
      case 5:
        return 'Excellent! 🌟';
      case 4:
        return 'Very Good! 😊';
      case 3:
        return 'Good 👍';
      case 2:
        return 'Fair 😐';
      case 1:
        return 'Poor 😞';
      default:
        return '';
    }
  }
}
