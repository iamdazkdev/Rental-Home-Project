import 'package:flutter/material.dart';
import '../services/booking_service.dart';

class RejectBookingBottomSheet extends StatefulWidget {
  final Map<String, dynamic> booking;

  const RejectBookingBottomSheet({
    super.key,
    required this.booking,
  });

  @override
  State<RejectBookingBottomSheet> createState() =>
      _RejectBookingBottomSheetState();
}

class _RejectBookingBottomSheetState extends State<RejectBookingBottomSheet> {
  String? selectedReason;
  final TextEditingController _customReasonController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> predefinedReasons = [
    'Property not available for selected dates',
    'Guest requirements do not match property rules',
    'Maintenance or repairs needed',
    'Personal or family use',
    'Booking duration too short/long',
    'Suspicious or incomplete profile',
    'Other (please specify below)',
  ];

  @override
  void dispose() {
    _customReasonController.dispose();
    super.dispose();
  }

  Future<void> _handleReject() async {
    final reason = selectedReason == 'Other (please specify below)'
        ? _customReasonController.text.trim()
        : selectedReason;

    if (reason == null || reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select or enter a rejection reason'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final bookingService = BookingService();
      final result = await bookingService.rejectBooking(
        widget.booking['_id'],
        reason: reason,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        Navigator.of(context).pop(true); // Return success

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Booking rejected successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to reject booking'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to reject booking: $e'),
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
    final booking = widget.booking;
    final guest = booking['customerId'] as Map<String, dynamic>?;
    final listing = booking['listingId'] as Map<String, dynamic>?;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFff6b6b),
                  const Color(0xFFd32f2f),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                const Text(
                  '✗',
                  style: TextStyle(fontSize: 24, color: Colors.white),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Reject Booking Request',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Guest Info Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFFfff5f5),
                          const Color(0xFFffe0e0),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFffebee),
                        width: 2,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Text('👤', style: TextStyle(fontSize: 40)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${guest?['firstName'] ?? ''} ${guest?['lastName'] ?? ''}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFd32f2f),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '🏠 ${listing?['title'] ?? 'Property'}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[700],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '📅 ${booking['startDate']} → ${booking['endDate']}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '💰 \$${booking['totalPrice']?.toStringAsFixed(2) ?? '0.00'}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFFF385A),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Warning
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFFfff9e6),
                          const Color(0xFFffedcc),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border(
                        left: BorderSide(
                          color: const Color(0xFFffa000),
                          width: 4,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Text('⚠️', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Important',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFf57c00),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'The guest will be notified about the rejection and the reason you provide.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Reason Section
                  const Text(
                    'Reason for rejection:',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    '*',
                    style: TextStyle(color: Colors.red),
                  ),

                  const SizedBox(height: 16),

                  // Reason Options
                  ...predefinedReasons.map((reason) {
                    final isSelected = selectedReason == reason;
                    return GestureDetector(
                      onTap: () => setState(() => selectedReason = reason),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFFd32f2f)
                                : Colors.grey[300]!,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          gradient: isSelected
                              ? LinearGradient(
                                  colors: [
                                    const Color(0xFFfff5f5),
                                    const Color(0xFFffebee),
                                  ],
                                )
                              : null,
                          color: isSelected ? null : Colors.white,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isSelected
                                  ? Icons.radio_button_checked
                                  : Icons.radio_button_unchecked,
                              color: isSelected
                                  ? const Color(0xFFd32f2f)
                                  : Colors.grey[400],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                reason,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isSelected
                                      ? const Color(0xFFd32f2f)
                                      : Colors.grey[700],
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  // Custom Reason Input
                  if (selectedReason == 'Other (please specify below)') ...[
                    const SizedBox(height: 16),
                    TextField(
                      controller: _customReasonController,
                      maxLines: 4,
                      maxLength: 500,
                      decoration: InputDecoration(
                        hintText:
                            'Please provide your reason for rejecting this booking...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xFFd32f2f),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Footer Buttons
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleReject,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFFff6b6b),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Reject Booking'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Helper function to show the bottom sheet
void showRejectBookingSheet(BuildContext context, Map<String, dynamic> booking) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => SizedBox(
      height: MediaQuery.of(context).size.height * 0.9,
      child: RejectBookingBottomSheet(booking: booking),
    ),
  );
}

