import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';

class CheckoutScreen extends StatefulWidget {
  final Booking booking;
  final VoidCallback onSuccess;

  const CheckoutScreen({
    super.key,
    required this.booking,
    required this.onSuccess,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final BookingService _bookingService = BookingService();
  final _listingReviewController = TextEditingController();
  final _hostReviewController = TextEditingController();

  double _listingRating = 0;
  double _hostRating = 0;
  bool _isSubmitting = false;

  // Suggested reviews
  final List<String> _suggestedListingReviews = [
    'Clean and comfortable',
    'Great location',
    'Exactly as described',
    'Beautiful property',
    'Well-equipped',
    'Peaceful and quiet',
    'Perfect for our stay',
    'Amazing views',
  ];

  final List<String> _suggestedHostReviews = [
    'Very responsive and helpful',
    'Great communication',
    'Welcoming and friendly',
    'Clear instructions',
    'Respectful and professional',
    'Excellent host',
    'Made us feel at home',
    'Quick to resolve issues',
  ];

  @override
  void dispose() {
    _listingReviewController.dispose();
    _hostReviewController.dispose();
    super.dispose();
  }

  void _addSuggestedReview(String suggestion, bool isHost) {
    final controller = isHost ? _hostReviewController : _listingReviewController;
    final currentText = controller.text.trim();

    // Don't add if already included
    if (currentText.contains(suggestion)) return;

    // Add with proper formatting
    if (currentText.isEmpty) {
      controller.text = suggestion;
    } else {
      controller.text = '$currentText. $suggestion';
    }
  }

  Future<void> _handleCheckout() async {
    setState(() => _isSubmitting = true);

    final result = await _bookingService.checkout(
      bookingId: widget.booking.id,
      homeReview: _listingReviewController.text.trim().isNotEmpty
          ? _listingReviewController.text.trim()
          : null,
      homeRating: _listingRating > 0 ? _listingRating : null,
      hostReview: _hostReviewController.text.trim().isNotEmpty
          ? _hostReviewController.text.trim()
          : null,
      hostRating: _hostRating > 0 ? _hostRating : null,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Checked out successfully!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context);
        widget.onSuccess();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Checkout failed'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  int get _numberOfNights {
    final endDate = widget.booking.newEndDate ?? widget.booking.endDate;
    return endDate.difference(widget.booking.startDate).inDays;
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.booking.listing as Map?;
    final listingTitle = listing?['title'] ?? 'Property';
    final listingCity = listing?['city'] ?? '';
    final listingProvince = listing?['province'] ?? '';
    final listingPhotos = listing?['listingPhotoPaths'] as List?;
    final photoUrl = listingPhotos?.isNotEmpty == true ? listingPhotos!.first : null;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('🏠 Check Out'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Listing Info Card
            Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Image
                  if (photoUrl != null)
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                      child: CachedNetworkImage(
                        imageUrl: photoUrl.toString(),
                        height: 180,
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

                  // Details
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          listingTitle,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$listingCity, $listingProvince',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textSecondaryColor,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Stay Summary Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Stay Summary',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  _buildSummaryItem(
                    icon: '📅',
                    label: 'Check-in Date',
                    value: DateFormatter.formatDate(widget.booking.startDate),
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryItem(
                    icon: '🏁',
                    label: 'Check-out Date',
                    value: DateFormatter.formatDate(
                      widget.booking.newEndDate ?? widget.booking.endDate,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryItem(
                    icon: '🌙',
                    label: 'Total Nights',
                    value: '$_numberOfNights night${_numberOfNights != 1 ? 's' : ''}',
                  ),
                  const SizedBox(height: 12),
                  _buildSummaryItem(
                    icon: '💰',
                    label: 'Total Paid',
                    value: PriceFormatter.formatPriceInteger(
                      widget.booking.extensionCost != null
                          ? widget.booking.totalPrice + widget.booking.extensionCost!
                          : widget.booking.totalPrice,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Confirmation Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryColor.withValues(alpha: 0.1),
                    AppTheme.primaryColor.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppTheme.primaryColor.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppTheme.successColor,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check,
                      color: Colors.white,
                      size: 36,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Ready to Check Out?',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Complete your stay and leave a review (optional) to help others!',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Review Section
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('📝', style: TextStyle(fontSize: 24)),
                      const SizedBox(width: 8),
                      Text(
                        'Leave a Review',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Share your experience to help future guests',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                  ),
                  const SizedBox(height: 24),

                  // Listing Review
                  _buildReviewSection(
                    title: 'Rate the Listing',
                    rating: _listingRating,
                    onRatingChanged: (rating) => setState(() => _listingRating = rating),
                    controller: _listingReviewController,
                    hintText: 'Share your thoughts about the property...',
                    suggestedReviews: _suggestedListingReviews,
                    isHost: false,
                  ),

                  const SizedBox(height: 32),

                  // Host Review
                  _buildReviewSection(
                    title: 'Rate the Host',
                    rating: _hostRating,
                    onRatingChanged: (rating) => setState(() => _hostRating = rating),
                    controller: _hostReviewController,
                    hintText: 'How was your host?',
                    suggestedReviews: _suggestedHostReviews,
                    isHost: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Checkout Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _handleCheckout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
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
                        'Complete Checkout',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem({
    required String icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 24)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.textSecondaryColor,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewSection({
    required String title,
    required double rating,
    required Function(double) onRatingChanged,
    required TextEditingController controller,
    required String hintText,
    required List<String> suggestedReviews,
    required bool isHost,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 12),

        // Star Rating
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(5, (index) {
            return IconButton(
              onPressed: () => onRatingChanged((index + 1).toDouble()),
              icon: Icon(
                index < rating ? Icons.star : Icons.star_border,
                size: 36,
                color: Colors.amber,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            );
          }),
        ),

        const SizedBox(height: 16),

        // Suggested Reviews
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text('💡', style: TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Text(
                    'Quick suggestions:',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: suggestedReviews.map((suggestion) {
                  return InkWell(
                    onTap: () => _addSuggestedReview(suggestion, isHost),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppTheme.primaryColor.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        suggestion,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.primaryColor,
                            ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Comment TextField
        TextField(
          controller: controller,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: hintText,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: AppTheme.backgroundColor,
          ),
        ),
      ],
    );
  }
}

