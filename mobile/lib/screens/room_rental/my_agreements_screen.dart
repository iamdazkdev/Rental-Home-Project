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
    return _agreements.where((a) => a.status.value.toLowerCase() == _selectedFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Agreements'),
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('All', 'all'),
                  _buildFilterChip('Draft', 'draft'),
                  _buildFilterChip('Active', 'active'),
                  _buildFilterChip('Terminated', 'terminated'),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredAgreements.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadAgreements,
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

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() => _selectedFilter = value);
        },
        selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
        checkmarkColor: AppTheme.primaryColor,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.description_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No agreements',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Your rental agreements will appear here',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Future<void> _acceptAgreement(RentalAgreement agreement) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.handshake, color: Colors.green),
            SizedBox(width: 8),
            Text('Accept Agreement'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('By accepting, you agree to:'),
            const SizedBox(height: 12),
            _buildAgreementTermItem('Monthly rent: ${PriceFormatter.formatPriceInteger(agreement.rentAmount)}'),
            _buildAgreementTermItem('Deposit: ${PriceFormatter.formatPriceInteger(agreement.depositAmount)}'),
            _buildAgreementTermItem('Notice period: ${agreement.noticePeriod} days'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'This will serve as your digital signature.',
                style: TextStyle(fontSize: 13),
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
            child: const Text('Accept & Sign'),
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

  Widget _buildAgreementTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const Icon(Icons.check, size: 16, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
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

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    agreement.roomTitle ?? 'Rental Agreement',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _buildStatusBadge(),
              ],
            ),

            const SizedBox(height: 16),

            // Rent & Deposit
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Monthly Rent', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 4),
                      Text(
                        PriceFormatter.formatPriceInteger(agreement.rentAmount),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Deposit', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(height: 4),
                      Text(
                        PriceFormatter.formatPriceInteger(agreement.depositAmount),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Payment Method
            Row(
              children: [
                const Icon(Icons.payment, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  'Payment: ${_formatPaymentMethod(agreement.paymentMethod)}',
                  style: TextStyle(color: Colors.grey[700]),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Notice Period
            Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  'Notice period: ${agreement.noticePeriod} days',
                  style: TextStyle(color: Colors.grey[700]),
                ),
              ],
            ),

            // House Rules
            if (agreement.houseRules.isNotEmpty) ...[
              const SizedBox(height: 12),
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: const Text('House Rules', style: TextStyle(fontWeight: FontWeight.w600)),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(agreement.houseRules.join('\n')),
                  ),
                ],
              ),
            ],

            // Actions based on status
            if (agreement.status.value.toLowerCase() == 'draft' && agreement.agreedByTenantAt == null) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => onAccept(agreement),
                  icon: const Icon(Icons.check),
                  label: const Text('Accept Agreement'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],

            // Show signature status
            if (agreement.status.value.toLowerCase() == 'draft') ...[
              const SizedBox(height: 12),
              _buildSignatureStatus(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String label;

    switch (agreement.status.value.toLowerCase()) {
      case 'draft':
        color = Colors.orange;
        label = 'Pending Signatures';
        break;
      case 'active':
        color = Colors.green;
        label = 'Active';
        break;
      case 'terminated':
        color = Colors.grey;
        label = 'Terminated';
        break;
      default:
        color = Colors.grey;
        label = agreement.status.value;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }

  Widget _buildSignatureStatus() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Signature Status:', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                agreement.agreedByTenantAt != null ? Icons.check_circle : Icons.pending,
                size: 16,
                color: agreement.agreedByTenantAt != null ? Colors.green : Colors.orange,
              ),
              const SizedBox(width: 8),
              Text(
                'Tenant: ${agreement.agreedByTenantAt != null ? "Signed" : "Pending"}',
                style: const TextStyle(fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                agreement.agreedByHostAt != null ? Icons.check_circle : Icons.pending,
                size: 16,
                color: agreement.agreedByHostAt != null ? Colors.green : Colors.orange,
              ),
              const SizedBox(width: 8),
              Text(
                'Host: ${agreement.agreedByHostAt != null ? "Signed" : "Pending"}',
                style: const TextStyle(fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatPaymentMethod(String method) {
    switch (method.toLowerCase()) {
      case 'online':
        return 'Online Payment';
      case 'cash':
        return 'Cash';
      case 'mixed':
        return 'Mixed';
      default:
        return method;
    }
  }
}

