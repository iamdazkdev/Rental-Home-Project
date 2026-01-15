import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:rental_home/models/calendar_models.dart';
import 'package:rental_home/services/calendar_service.dart';
import 'package:table_calendar/table_calendar.dart';

/// Host Calendar Management Screen
class HostCalendarScreen extends StatefulWidget {
  final String listingId;
  final String listingTitle;

  const HostCalendarScreen({
    Key? key,
    required this.listingId,
    required this.listingTitle,
  }) : super(key: key);

  @override
  State<HostCalendarScreen> createState() => _HostCalendarScreenState();
}

class _HostCalendarScreenState extends State<HostCalendarScreen> {
  final CalendarService _calendarService = CalendarService();

  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  CalendarData? _calendarData;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCalendarData();
  }

  Future<void> _loadCalendarData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _calendarService.getCalendarData(
        widget.listingId,
        month: _focusedDay.month,
        year: _focusedDay.year,
      );

      setState(() {
        _calendarData = data;
        _isLoading = false;
      });

      debugPrint(
          '✅ Calendar data loaded: ${data.bookings.length} bookings, ${data.blockedDates.length} blocked dates');
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });

      debugPrint('❌ Error loading calendar: $e');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Color _getBookingColor(String status) {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.amber;
      case 'checked_in':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _formatStatus(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmed';
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'checked_in':
        return 'Checked In';
      case 'checked_out':
        return 'Checked Out';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return status
            .replaceAll('_', ' ')
            .split(' ')
            .map((word) =>
                word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1))
            .join(' ');
    }
  }

  Widget _buildDayCell(DateTime date,
      {bool isToday = false, bool isSelected = false}) {
    if (_calendarData == null) {
      return Center(
        child: Text(
          '${date.day}',
          style: TextStyle(
            color: isToday ? Colors.blue : Colors.black,
            fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      );
    }

    // Check what type of day this is
    final bookings =
        _calendarData!.bookings.where((b) => b.isOnDate(date)).toList();
    final isBlocked = _calendarData!.blockedDates.any((b) => b.isOnDate(date));
    final hasCustomPrice =
        _calendarData!.customPrices.any((p) => p.isOnDate(date));

    // Determine background color
    Color? backgroundColor;
    Color textColor = Colors.black;

    if (isSelected) {
      backgroundColor = Colors.blue;
      textColor = Colors.white;
    } else if (isBlocked) {
      backgroundColor = Colors.red.withValues(alpha: 0.2);
      textColor = Colors.red.shade900;
    } else if (bookings.isNotEmpty) {
      final status = bookings.first.status;
      final statusColor = _getBookingColor(status);
      backgroundColor = statusColor.withValues(alpha: 0.2);
      // Get dark shade based on color
      if (statusColor == Colors.green) {
        textColor = Colors.green.shade900;
      } else if (statusColor == Colors.amber) {
        textColor = Colors.amber.shade900;
      } else if (statusColor == Colors.blue) {
        textColor = Colors.blue.shade900;
      } else {
        textColor = Colors.grey.shade900;
      }
    } else if (hasCustomPrice) {
      backgroundColor = Colors.orange.withValues(alpha: 0.15);
      textColor = Colors.orange.shade900;
    } else if (isToday) {
      backgroundColor = Colors.blue.withValues(alpha: 0.1);
      textColor = Colors.blue.shade900;
    }

    return Container(
      margin: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
        border: isToday && !isSelected
            ? Border.all(color: Colors.blue, width: 2)
            : null,
      ),
      child: Center(
        child: Text(
          '${date.day}',
          style: TextStyle(
            color: textColor,
            fontWeight:
                isToday || isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  void _showDayDetails(DateTime day) {
    if (_calendarData == null) return;

    final bookings =
        _calendarData!.bookings.where((b) => b.isOnDate(day)).toList();
    final blockedDates =
        _calendarData!.blockedDates.where((b) => b.isOnDate(day)).toList();
    final customPrice = _calendarData!.customPrices.firstWhere(
      (p) => p.isOnDate(day),
      orElse: () => CustomPrice(id: '', date: day, price: 0),
    );

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              DateFormat('dd/MM/yyyy').format(day),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            if (bookings.isNotEmpty) ...[
              const Text('📅 Bookings:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...bookings.map((b) => ListTile(
                    leading: CircleAvatar(
                      child: Text(b.customerName[0]),
                    ),
                    title: Text(b.customerName),
                    subtitle: Text(
                        '${_formatStatus(b.status)} - ${NumberFormat.currency(locale: 'vi', symbol: 'đ').format(b.totalPrice)}'),
                    trailing: Chip(
                      label: Text(_formatStatus(b.status)),
                      backgroundColor: _getBookingColor(b.status),
                    ),
                  )),
            ],
            if (blockedDates.isNotEmpty) ...[
              const Divider(),
              const Text('🚫 Blocked:',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              ...blockedDates.map((b) => ListTile(
                    leading: const Icon(Icons.block, color: Colors.red),
                    title: Text(b.reasonDisplay),
                    subtitle: Text(b.note ?? ''),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () => _unblockDate(b.id),
                    ),
                  )),
            ],
            if (customPrice.id.isNotEmpty) ...[
              const Divider(),
              ListTile(
                leading: const Icon(Icons.attach_money, color: Colors.orange),
                title: Text(
                    'Giá đặc biệt: ${NumberFormat.currency(locale: 'vi', symbol: 'đ').format(customPrice.price)}'),
                subtitle: Text(customPrice.reason ?? ''),
                trailing: IconButton(
                  icon: const Icon(Icons.delete),
                  onPressed: () => _removeCustomPrice(customPrice.id),
                ),
              ),
            ],
            if (bookings.isEmpty &&
                blockedDates.isEmpty &&
                customPrice.id.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text('Không có dữ liệu cho ngày này'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showBlockDateDialog() {
    DateTime? startDate;
    DateTime? endDate;
    String reason = 'personal';
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🚫 Chặn ngày'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Từ ngày'),
                subtitle: Text(startDate != null
                    ? DateFormat('dd/MM/yyyy').format(startDate!)
                    : 'Chọn ngày'),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => startDate = picked);
                    Navigator.pop(context);
                    _showBlockDateDialog();
                  }
                },
              ),
              ListTile(
                title: const Text('Đến ngày'),
                subtitle: Text(endDate != null
                    ? DateFormat('dd/MM/yyyy').format(endDate!)
                    : 'Chọn ngày'),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: startDate ?? DateTime.now(),
                    firstDate: startDate ?? DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => endDate = picked);
                    Navigator.pop(context);
                    _showBlockDateDialog();
                  }
                },
              ),
              DropdownButtonFormField<String>(
                initialValue: reason,
                decoration: const InputDecoration(labelText: 'Lý do'),
                items: const [
                  DropdownMenuItem(
                      value: 'personal', child: Text('Sử dụng cá nhân')),
                  DropdownMenuItem(
                      value: 'maintenance', child: Text('Bảo trì')),
                  DropdownMenuItem(value: 'holiday', child: Text('Nghỉ lễ')),
                  DropdownMenuItem(
                      value: 'renovation', child: Text('Sửa chữa')),
                  DropdownMenuItem(value: 'other', child: Text('Khác')),
                ],
                onChanged: (value) {
                  if (value != null) reason = value;
                },
              ),
              TextField(
                controller: noteController,
                decoration: const InputDecoration(labelText: 'Ghi chú'),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (startDate != null && endDate != null) {
                Navigator.pop(context);
                _blockDates(startDate!, endDate!, reason, noteController.text);
              }
            },
            child: const Text('Chặn'),
          ),
        ],
      ),
    );
  }

  void _showCustomPriceDialog() {
    DateTime? selectedDate;
    final priceController = TextEditingController();
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('💰 Đặt giá đặc biệt'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Ngày'),
              subtitle: Text(selectedDate != null
                  ? DateFormat('dd/MM/yyyy').format(selectedDate!)
                  : 'Chọn ngày'),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() => selectedDate = picked);
                  Navigator.pop(context);
                  _showCustomPriceDialog();
                }
              },
            ),
            TextField(
              controller: priceController,
              decoration: const InputDecoration(
                labelText: 'Giá (VNĐ)',
                prefixIcon: Icon(Icons.attach_money),
              ),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(labelText: 'Lý do'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (selectedDate != null && priceController.text.isNotEmpty) {
                Navigator.pop(context);
                _setCustomPrice(
                  selectedDate!,
                  double.parse(priceController.text),
                  reasonController.text,
                );
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  Future<void> _blockDates(
      DateTime start, DateTime end, String reason, String note) async {
    try {
      await _calendarService.blockDates(
        widget.listingId,
        BlockDateRequest(
          startDate: start,
          endDate: end,
          reason: reason,
          note: note.isEmpty ? null : note,
        ),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Đã chặn ngày thành công')),
      );

      _loadCalendarData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _unblockDate(String blockId) async {
    try {
      await _calendarService.unblockDates(widget.listingId, blockId);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Đã bỏ chặn thành công')),
      );
      _loadCalendarData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _setCustomPrice(
      DateTime date, double price, String reason) async {
    try {
      await _calendarService.setCustomPrice(
        widget.listingId,
        CustomPriceRequest(
          date: date,
          price: price,
          reason: reason.isEmpty ? null : reason,
        ),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Đã đặt giá thành công')),
      );

      _loadCalendarData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _removeCustomPrice(String priceId) async {
    try {
      await _calendarService.removeCustomPrice(widget.listingId, priceId);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Đã xóa giá thành công')),
      );
      _loadCalendarData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Lỗi: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.listingTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCalendarData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Lỗi: $_errorMessage'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadCalendarData,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Calendar
                    TableCalendar(
                      firstDay: DateTime(2020),
                      lastDay: DateTime(2030),
                      focusedDay: _focusedDay,
                      selectedDayPredicate: (day) =>
                          isSameDay(_selectedDay, day),
                      onDaySelected: (selectedDay, focusedDay) {
                        setState(() {
                          _selectedDay = selectedDay;
                          _focusedDay = focusedDay;
                        });
                        _showDayDetails(selectedDay);
                      },
                      onPageChanged: (focusedDay) {
                        setState(() => _focusedDay = focusedDay);
                        _loadCalendarData();
                      },
                      calendarBuilders: CalendarBuilders(
                        // Custom day cell builder for default days
                        defaultBuilder: (context, day, focusedDay) {
                          final isSelected = isSameDay(_selectedDay, day);
                          final isToday = isSameDay(DateTime.now(), day);
                          return _buildDayCell(day,
                              isToday: isToday, isSelected: isSelected);
                        },
                        // Custom builder for today
                        todayBuilder: (context, day, focusedDay) {
                          final isSelected = isSameDay(_selectedDay, day);
                          return _buildDayCell(day,
                              isToday: true, isSelected: isSelected);
                        },
                        // Custom builder for selected day
                        selectedBuilder: (context, day, focusedDay) {
                          return _buildDayCell(day,
                              isToday: isSameDay(DateTime.now(), day),
                              isSelected: true);
                        },
                        // Custom builder for outside days (from other months)
                        outsideBuilder: (context, day, focusedDay) {
                          return Container(
                            margin: const EdgeInsets.all(4),
                            child: Center(
                              child: Text(
                                '${day.day}',
                                style: TextStyle(color: Colors.grey.shade400),
                              ),
                            ),
                          );
                        },
                      ),
                      headerStyle: const HeaderStyle(
                        formatButtonVisible: false,
                        titleCentered: true,
                      ),
                    ),

                    const Divider(),

                    // Legend
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Wrap(
                        spacing: 16,
                        runSpacing: 8,
                        children: [
                          _buildLegendItem(Colors.green, 'Đã xác nhận'),
                          _buildLegendItem(Colors.amber, 'Chờ duyệt'),
                          _buildLegendItem(Colors.red, 'Đã chặn'),
                          _buildLegendItem(Colors.orange, 'Giá đặc biệt'),
                        ],
                      ),
                    ),

                    const Divider(),

                    // Bookings list
                    Expanded(
                      child: _buildBookingsList(),
                    ),
                  ],
                ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'block',
            onPressed: _showBlockDateDialog,
            icon: const Icon(Icons.block),
            label: const Text('Chặn ngày'),
            backgroundColor: Colors.red,
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'price',
            onPressed: _showCustomPriceDialog,
            icon: const Icon(Icons.attach_money),
            label: const Text('Đặt giá'),
            backgroundColor: Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    // Map color to dark shade
    final darkColor = color == Colors.green
        ? Colors.green.shade900
        : color == Colors.amber
            ? Colors.amber.shade900
            : color == Colors.red
                ? Colors.red.shade900
                : color == Colors.orange
                    ? Colors.orange.shade900
                    : Colors.grey.shade900;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 1.5),
          ),
          child: Center(
            child: Text(
              '1',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: darkColor,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildBookingsList() {
    if (_calendarData == null || _calendarData!.bookings.isEmpty) {
      return const Center(
        child: Text('Chưa có booking nào'),
      );
    }

    return ListView.builder(
      itemCount: _calendarData!.bookings.length,
      itemBuilder: (context, index) {
        final booking = _calendarData!.bookings[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: booking.customerAvatar != null
                  ? NetworkImage(booking.customerAvatar!)
                  : null,
              child: booking.customerAvatar == null
                  ? Text(booking.customerName[0])
                  : null,
            ),
            title: Text(booking.customerName),
            subtitle: Text(
              '${DateFormat('dd/MM').format(booking.checkIn)} - ${DateFormat('dd/MM').format(booking.checkOut)}\n'
              '${NumberFormat.currency(locale: 'vi', symbol: 'đ').format(booking.totalPrice)}',
            ),
            trailing: Chip(
              label: Text(_formatStatus(booking.status)),
              backgroundColor: _getBookingColor(booking.status),
            ),
            isThreeLine: true,
          ),
        );
      },
    );
  }
}
