import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/room_rental.dart';
import '../../providers/auth_provider.dart';
import '../../services/room_rental_service.dart';
import '../../utils/price_formatter.dart';

class HostAgreementsScreen extends StatefulWidget {
  const HostAgreementsScreen({super.key});

  @override
  State<HostAgreementsScreen> createState() => _HostAgreementsScreenState();
}

class _HostAgreementsScreenState extends State<HostAgreementsScreen> {
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

    final agreements = await _roomRentalService.getHostAgreements(user.id);

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
        title: const Text('Rental Agreements'),
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
                            return _HostAgreementCard(
                              agreement: _filteredAgreements[index],
                              onConfirm: _confirmAgreement,
                              onRecordPayment: _showRecordPaymentDialog,
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
            'Rental agreements will appear here after approving requests',
            style: TextStyle(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _confirmAgreement(RentalAgreement agreement) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.verified, color: Colors.green),
            SizedBox(width: 8),
            Text('Confirm Agreement'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('The tenant has accepted the agreement.'),
            const SizedBox(height: 12),
            const Text('By confirming, you agree to:'),
            const SizedBox(height: 8),
            _buildTermItem('Rent out the room at ${PriceFormatter.formatPriceInteger(agreement.rentAmount)}/month'),
            _buildTermItem('Collect deposit of ${PriceFormatter.formatPriceInteger(agreement.depositAmount)}'),
            _buildTermItem('Follow the ${agreement.noticePeriod}-day notice period'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'This will activate the rental agreement.',
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
            child: const Text('Confirm & Activate'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final result = await _roomRentalService.confirmAgreement(agreement.id);

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Agreement confirmed and activated!'),
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

  Future<void> _showRecordPaymentDialog(RentalAgreement agreement) async {
    final amountController = TextEditingController();
    String paymentType = 'MONTHLY';
    String? notes;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Record Cash Payment'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Payment Type
                const Text('Payment Type'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: paymentType,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'DEPOSIT', child: Text('Deposit')),
                    DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly Rent')),
                  ],
                  onChanged: (value) {
                    setDialogState(() => paymentType = value!);
                  },
                ),

                const SizedBox(height: 16),

                // Amount
                const Text('Amount'),
                const SizedBox(height: 8),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    prefixText: '₫ ',
                    hintText: 'Enter amount',
                  ),
                ),

                const SizedBox(height: 16),

                // Notes
                const Text('Notes (optional)'),
                const SizedBox(height: 8),
                TextField(
                  maxLines: 2,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Add notes...',
                  ),
                  onChanged: (value) => notes = value,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (amountController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter an amount')),
                  );
                  return;
                }
                Navigator.pop(context, true);
              },
              child: const Text('Record Payment'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;

    final amount = double.tryParse(amountController.text.replaceAll(',', '')) ?? 0;

    final result = await _roomRentalService.recordCashPayment(
      agreementId: agreement.id,
      amount: amount,
      paymentType: paymentType,
      notes: notes,
    );

    if (result['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment recorded!'),
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

class _HostAgreementCard extends StatelessWidget {
  final RentalAgreement agreement;
  final Function(RentalAgreement) onConfirm;
  final Function(RentalAgreement) onRecordPayment;

  const _HostAgreementCard({
    required this.agreement,
    required this.onConfirm,
    required this.onRecordPayment,
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
            // Header
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

            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),

            // Tenant Info
            const Text('Tenant:', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.grey[200],
                  child: const Icon(Icons.person, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  agreement.tenantName ?? 'Tenant',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Financial Info
            Row(
              children: [
                Expanded(
                  child: _buildInfoTile('Monthly Rent', PriceFormatter.formatPriceInteger(agreement.rentAmount)),
                ),
                Expanded(
                  child: _buildInfoTile('Deposit', PriceFormatter.formatPriceInteger(agreement.depositAmount)),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Payment Method & Notice
            Row(
              children: [
                Expanded(
                  child: _buildInfoTile('Payment', _formatPaymentMethod(agreement.paymentMethod)),
                ),
                Expanded(
                  child: _buildInfoTile('Notice Period', '${agreement.noticePeriod} days'),
                ),
              ],
            ),

            // Signature Status for Draft
            if (agreement.status.value.toLowerCase() == 'draft') ...[
              const SizedBox(height: 16),
              _buildSignatureStatus(),
            ],

            // Actions
            const SizedBox(height: 16),

            // Confirm button when tenant has signed
            if (agreement.status.value.toLowerCase() == 'draft' &&
                agreement.agreedByTenantAt != null &&
                agreement.agreedByHostAt == null)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => onConfirm(agreement),
                  icon: const Icon(Icons.check),
                  label: const Text('Confirm Agreement'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),

            // Record Payment for Active agreements
            if (agreement.status.value.toLowerCase() == 'active')
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => onRecordPayment(agreement),
                  icon: const Icon(Icons.add),
                  label: const Text('Record Cash Payment'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
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
                'Host: ${agreement.agreedByHostAt != null ? "Confirmed" : "Pending"}',
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
        return 'Online';
      case 'cash':
        return 'Cash';
      case 'mixed':
        return 'Mixed';
      default:
        return method;
    }
  }
}

