import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../utils/date_formatter.dart';
import '../../utils/price_formatter.dart';
import '../../data/models/booking_model.dart';
import '../../presentation/booking/cubit/booking_cubit.dart';

class ExtendStayScreen extends StatefulWidget {
  final BookingModel booking;

  const ExtendStayScreen({
    Key? key,
    required this.booking,
  }) : super(key: key);

  @override
  State<ExtendStayScreen> createState() => _ExtendStayScreenState();
}

class _ExtendStayScreenState extends State<ExtendStayScreen> {
  DateTime? _newEndDate;
  int _additionalDays = 0;
  double _additionalCost = 0.0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _newEndDate = widget.booking.endDate;
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: widget.booking.endDate.add(const Duration(days: 1)),
      firstDate: widget.booking.endDate.add(const Duration(days: 1)),
      lastDate: widget.booking.endDate.add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFFF385C),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _newEndDate) {
      setState(() {
        _newEndDate = picked;
        _calculateExtension();
      });
    }
  }

  void _calculateExtension() {
    if (_newEndDate == null) return;

    final originalDays = widget.booking.endDate.difference(widget.booking.startDate).inDays;
    final dailyRate = widget.booking.totalPrice / originalDays;

    _additionalDays = _newEndDate!.difference(widget.booking.endDate).inDays;
    _additionalCost = dailyRate * _additionalDays;
  }

  Future<void> _submitExtensionRequest() async {
    if (_newEndDate == null || _additionalDays <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a valid extension date'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Extension Request'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Extension Summary:'),
            const SizedBox(height: 12),
            Text('• Additional $_additionalDays day(s)'),
            Text('• New checkout: ${DateFormatter.formatDate(_newEndDate!)}'),
            Text('• Additional cost: ${formatVND(_additionalCost)}'),
            const SizedBox(height: 12),
            const Text(
              'The host will need to approve this extension request.',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF385C),
            ),
            child: const Text('Send Request'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      final cubit = context.read<BookingCubit>();

      final result = await cubit.requestStayExtension(
        bookingId: widget.booking.id,
        newEndDate: _newEndDate!,
      );

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Extension request sent to host'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to send request'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Extend Your Stay'),
        backgroundColor: const Color(0xFFFF385C),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Current Booking Info
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Current Reservation',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildInfoRow(
                        'Check-in',
                        DateFormatter.formatDate(widget.booking.startDate),
                        Icons.login,
                      ),
                      const Divider(),
                      _buildInfoRow(
                        'Check-out',
                        DateFormatter.formatDate(widget.booking.endDate),
                        Icons.logout,
                      ),
                      const Divider(),
                      _buildInfoRow(
                        'Total Days',
                        '${widget.booking.endDate.difference(widget.booking.startDate).inDays} days',
                        Icons.calendar_today,
                      ),
                      const Divider(),
                      _buildInfoRow(
                        'Total Price',
                        formatVND(widget.booking.totalPrice),
                        Icons.payment,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // New End Date Selection
              const Text(
                'Select New Check-out Date',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),

              InkWell(
                onTap: _selectDate,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Color(0xFFFF385C)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _newEndDate != null && _newEndDate != widget.booking.endDate
                              ? DateFormat('EEE, MMM d, yyyy').format(_newEndDate!)
                              : 'Tap to select new checkout date',
                          style: TextStyle(
                            fontSize: 16,
                            color: _newEndDate != null && _newEndDate != widget.booking.endDate
                                ? Colors.black
                                : Colors.grey,
                          ),
                        ),
                      ),
                      const Icon(Icons.arrow_drop_down),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Extension Summary
              if (_newEndDate != null && _additionalDays > 0) ...[
                Card(
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue.shade700),
                            const SizedBox(width: 8),
                            const Text(
                              'Extension Summary',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildSummaryRow('Additional Days', '$_additionalDays day(s)'),
                        const Divider(),
                        _buildSummaryRow(
                          'New Total Days',
                          '${widget.booking.endDate.difference(widget.booking.startDate).inDays + _additionalDays} day(s)',
                        ),
                        const Divider(),
                        _buildSummaryRow(
                          'Additional Cost',
                          formatVND(_additionalCost),
                          isBold: true,
                        ),
                        const Divider(),
                        _buildSummaryRow(
                          'New Total Price',
                          formatVND(widget.booking.totalPrice + _additionalCost),
                          isBold: true,
                          color: const Color(0xFFFF385C),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Important Note
                Card(
                  color: Colors.orange.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.warning_amber, color: Colors.orange.shade700),
                            const SizedBox(width: 8),
                            const Text(
                              'Important Notice',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '• The host must approve your extension request\n'
                          '• You will be notified once the host responds\n'
                          '• Payment for additional days will be processed after approval\n'
                          '• Extension requests should be made at least 2 days before checkout',
                          style: TextStyle(height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _isLoading ? null : _submitExtensionRequest,
                    icon: const Icon(Icons.send),
                    label: const Text('Send Extension Request'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF385C),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
          if (_isLoading)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey),
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

