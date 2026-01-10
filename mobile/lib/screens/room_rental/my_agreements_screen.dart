import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/room_rental.dart';
import '../../providers/auth_provider.dart';
import '../../services/room_rental_service.dart';
import '../../utils/price_formatter.dart';

class MyAgreementsScreen extends StatefulWidget {
  const MyAgreementsScreen({super.key});

  @override
  State<MyAgreementsScreen> createState() => _MyAgreementsScreenState();
}

class _MyAgreementsScreenState extends State<MyAgreementsScreen> {
  final RoomRentalService _roomRentalService = RoomRentalService();
  List<RentalAgreement> _agreements = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadAgreements();
  }

  Future<void> _loadAgreements() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final agreements = await _roomRentalService.getMyAgreements(user.id);

    setState(() {
      _agreements = agreements;
      _isLoading = false;
    });
  }

  List<RentalAgreement> get _filteredAgreements {
    if (_selectedFilter == 'all') return _agreements;
    return _agreements
        .where((a) => a.status.value.toLowerCase() == _selectedFilter)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'My Agreements',
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
          // Filter Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', 'all', Icons.list_alt),
                  _buildFilterChip('Draft', 'draft', Icons.pending_outlined),
                  _buildFilterChip(
                      'Active', 'active', Icons.check_circle_outline),
                  _buildFilterChip(
                      'Terminated', 'terminated', Icons.block_outlined),
                ],
              ),
            ),
          ),

          const Divider(height: 1),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredAgreements.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadAgreements,
                        color: AppTheme.primaryColor,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredAgreements.length,
                          itemBuilder: (context, index) {
                            return _AgreementCard(
                              agreement: _filteredAgreements[index],
                              onAccept: _acceptAgreement,
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
        ? _agreements.length
        : _agreements
            .where((a) => a.status.value.toLowerCase() == value)
            .length;

    Color chipColor;
    Color selectedBgColor;
    switch (value) {
      case 'all':
        chipColor = AppTheme.primaryColor;
        selectedBgColor = AppTheme.primaryColor;
        break;
      case 'draft':
        chipColor = Colors.orange.shade600;
        selectedBgColor = Colors.orange.shade600;
        break;
      case 'active':
        chipColor = Colors.green.shade600;
        selectedBgColor = Colors.green.shade600;
        break;
      case 'terminated':
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
      case 'draft':
        message = 'No draft agreements';
        iconData = Icons.pending_outlined;
        break;
      case 'active':
        message = 'No active agreements';
        iconData = Icons.check_circle_outline;
        break;
      case 'terminated':
        message = 'No terminated agreements';
        iconData = Icons.block_outlined;
        break;
      default:
        message = 'No agreements yet';
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
                  ? 'Agreements will appear here when\nhosts create them for your requests'
                  : 'Filter your agreements using the tabs above',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _acceptAgreement(RentalAgreement agreement) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.verified, color: Colors.green),
            SizedBox(width: 8),
            Text('Accept Agreement'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
                'By accepting this agreement, you agree to rent the room at:'),
            const SizedBox(height: 12),
            _buildTermItem(
                'Monthly rent: ${PriceFormatter.formatPriceInteger(agreement.rentAmount)}'),
            _buildTermItem(
                'Security deposit: ${PriceFormatter.formatPriceInteger(agreement.depositAmount)}'),
            _buildTermItem('Notice period: ${agreement.noticePeriod} days'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'This is a legally binding agreement.',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
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
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Accept Agreement'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final result = await _roomRentalService.acceptAgreement(agreement.id);

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Agreement accepted!'),
          backgroundColor: Colors.green,
        ),
      );
      _loadAgreements();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message']), backgroundColor: Colors.red),
      );
    }
  }

  Widget _buildTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const Icon(Icons.check, size: 16, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}

class _AgreementCard extends StatelessWidget {
  final RentalAgreement agreement;
  final Function(RentalAgreement) onAccept;

  const _AgreementCard({
    required this.agreement,
    required this.onAccept,
  });

  Color _getStatusColor() {
    switch (agreement.status.value.toLowerCase()) {
      case 'draft':
        return Colors.orange;
      case 'active':
        return Colors.green;
      case 'terminated':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (agreement.status.value.toLowerCase()) {
      case 'draft':
        return Icons.pending_outlined;
      case 'active':
        return Icons.check_circle_outline;
      case 'terminated':
        return Icons.block_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: statusColor.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with gradient
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  statusColor.withValues(alpha: 0.15),
                  statusColor.withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getStatusIcon(),
                    color: statusColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        agreement.roomTitle ?? 'Room Rental Agreement',
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
                // Host Info
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person_rounded,
                          size: 24, color: Colors.blue),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Host',
                            style: TextStyle(
                                fontSize: 12, color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            agreement.hostName ?? 'Host',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Financial Details
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildInfoRow(
                              Icons.attach_money_rounded,
                              'Monthly Rent',
                              PriceFormatter.formatPriceInteger(
                                  agreement.rentAmount),
                              Colors.green,
                            ),
                          ),
                          Container(
                              width: 1, height: 40, color: Colors.grey[300]),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildInfoRow(
                              Icons.account_balance_wallet_rounded,
                              'Deposit',
                              PriceFormatter.formatPriceInteger(
                                  agreement.depositAmount),
                              Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Signature Status for Draft
                if (agreement.status.value.toLowerCase() == 'draft') ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.orange.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.info_outline_rounded,
                                size: 18, color: Colors.orange),
                            SizedBox(width: 8),
                            Text(
                              'Waiting for your signature',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'The host has created this agreement. Review and accept to activate it.',
                          style:
                              TextStyle(fontSize: 13, color: Colors.grey[700]),
                        ),
                      ],
                    ),
                  ),
                ],

                // Accept Button
                if (agreement.status.value.toLowerCase() == 'draft' &&
                    agreement.agreedByTenantAt == null) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => onAccept(agreement),
                      icon: const Icon(Icons.check_circle_rounded, size: 20),
                      label: const Text(
                        'Accept Agreement',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge() {
    Color color = _getStatusColor();
    String label;

    switch (agreement.status.value.toLowerCase()) {
      case 'draft':
        label = 'Pending Acceptance';
        break;
      case 'active':
        label = 'Active';
        break;
      case 'terminated':
        label = 'Terminated';
        break;
      default:
        label = agreement.status.value;
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
