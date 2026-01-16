import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/booking.dart';
import '../../providers/auth_provider.dart';
import '../../services/review_service.dart';

class SubmitReviewScreen extends StatefulWidget {
  final BookingModel booking;
  final VoidCallback? onReviewSubmitted;

  const SubmitReviewScreen({
    super.key,
    required this.booking,
    this.onReviewSubmitted,
  });

  @override
  State<SubmitReviewScreen> createState() => _SubmitReviewScreenState();
}

class _SubmitReviewScreenState extends State<SubmitReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reviewService = ReviewService();

  int _listingRating = 5;
  int _hostRating = 5;
  final _listingCommentController = TextEditingController();
  final _hostCommentController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _suggestedListingReviews = [
    '✨ Clean and well-maintained',
    '📍 Great location',
    '💰 Good value for money',
    '🎯 Exactly as described',
    '🏠 Comfortable stay',
  ];

  final List<String> _suggestedHostReviews = [
    '👍 Responsive and helpful',
    '🔑 Easy check-in process',
    '😊 Friendly and welcoming',
    '📞 Great communication',
    '⭐ Highly recommended',
  ];

  @override
  void dispose() {
    _listingCommentController.dispose();
    _hostCommentController.dispose();
    super.dispose();
  }

  Future<void> _submitReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final user = context.read<AuthProvider>().user;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to submit review')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final success = await _reviewService.submitReview(
        bookingId: widget.booking.id,
        reviewerId: user.id,
        listingRating: _listingRating,
        listingComment: _listingCommentController.text.trim(),
        hostRating: _hostRating,
        hostComment: _hostCommentController.text.trim(),
      );

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Review submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        widget.onReviewSubmitted?.call();
        Navigator.pop(context, true);
      } else {
        throw Exception('Failed to submit review');
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Write a Review'),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Booking Info Card
            _buildBookingInfoCard(),

            const SizedBox(height: 24),

            // Listing Review Section
            _buildReviewSection(
              title: 'Rate the Listing',
              icon: Icons.home,
              rating: _listingRating,
              onRatingChanged: (rating) =>
                  setState(() => _listingRating = rating),
              controller: _listingCommentController,
              hintText: 'Share your thoughts about the property...',
              suggestedReviews: _suggestedListingReviews,
            ),

            const SizedBox(height: 32),

            // Host Review Section
            _buildReviewSection(
              title: 'Rate the Host',
              icon: Icons.person,
              rating: _hostRating,
              onRatingChanged: (rating) => setState(() => _hostRating = rating),
              controller: _hostCommentController,
              hintText: 'Share your experience with the host...',
              suggestedReviews: _suggestedHostReviews,
            ),

            const SizedBox(height: 32),

            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReview,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Submit Review',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingInfoCard() {
    final listing = widget.booking.listing;
    final listingTitle = listing is Map<String, dynamic>
        ? (listing['title'] as String?) ?? 'Unknown Listing'
        : 'Unknown Listing';

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              listingTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  '${widget.booking.startDate} - ${widget.booking.endDate}',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  formatPrice(widget.booking.totalPrice),
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewSection({
    required String title,
    required IconData icon,
    required int rating,
    required Function(int) onRatingChanged,
    required TextEditingController controller,
    required String hintText,
    required List<String> suggestedReviews,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title
        Row(
          children: [
            Icon(icon, color: AppTheme.primaryColor),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Star Rating
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            final starValue = index + 1;
            return IconButton(
              icon: Icon(
                starValue <= rating ? Icons.star : Icons.star_border,
                size: 40,
                color: starValue <= rating ? Colors.amber : Colors.grey,
              ),
              onPressed: () => onRatingChanged(starValue),
            );
          }),
        ),

        const SizedBox(height: 8),

        // Rating Text
        Center(
          child: Text(
            _getRatingText(rating),
            style: TextStyle(
              fontSize: 16,
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Comment Field
        TextFormField(
          controller: controller,
          maxLines: 4,
          maxLength: 500,
          decoration: InputDecoration(
            hintText: hintText,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.primaryColor),
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Suggested Reviews
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: suggestedReviews.map((suggestion) {
            return ActionChip(
              label: Text(suggestion),
              onPressed: () {
                final currentText = controller.text;
                if (currentText.isEmpty) {
                  controller.text = suggestion;
                } else if (!currentText.contains(suggestion)) {
                  controller.text = '$currentText $suggestion';
                }
              },
              backgroundColor: Colors.grey[200],
              labelStyle: const TextStyle(fontSize: 12),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _getRatingText(int rating) {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  }

  String formatPrice(double price) {
    return '\$${price.toStringAsFixed(0)}';
  }
}
