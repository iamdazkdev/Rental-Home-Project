import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';

class MyRoommateRequestsScreen extends StatefulWidget {
  const MyRoommateRequestsScreen({super.key});

  @override
  State<MyRoommateRequestsScreen> createState() =>
      _MyRoommateRequestsScreenState();
}

class _MyRoommateRequestsScreenState extends State<MyRoommateRequestsScreen>
    with SingleTickerProviderStateMixin {
  final RoommateService _roommateService = RoommateService();
  late TabController _tabController;

  List<RoommateRequest> _sentRequests = [];
  List<RoommateRequest> _receivedRequests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadRequests();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadRequests() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final requests = await _roommateService.getMyRequests(user.id);

    setState(() {
      _sentRequests = requests.where((r) => r.senderId == user.id).toList();
      _receivedRequests =
          requests.where((r) => r.receiverId == user.id).toList();
      _isLoading = false;
    });
  }

  Future<void> _handleAccept(String requestId) async {
    final result =
        await _roommateService.respondToRequest(requestId, 'ACCEPTED');

    if (result['success']) {
      _loadRequests();
      _showSuccessDialog(
          'Request Accepted', 'You can now chat with your potential roommate!');
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(result['message'] ?? 'Failed to accept request')),
      );
    }
  }

  Future<void> _handleReject(String requestId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Request?'),
        content: const Text('Are you sure you want to reject this request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final result =
        await _roommateService.respondToRequest(requestId, 'REJECTED');

    if (result['success']) {
      _loadRequests();
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(result['message'] ?? 'Failed to reject request')),
      );
    }
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: AppTheme.successColor),
            const SizedBox(width: 12),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Roommate Requests'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Received (${_receivedRequests.length})'),
            Tab(text: 'Sent (${_sentRequests.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRequestsList(_receivedRequests, isReceived: true),
                _buildRequestsList(_sentRequests, isReceived: false),
              ],
            ),
    );
  }

  Widget _buildRequestsList(List<RoommateRequest> requests,
      {required bool isReceived}) {
    if (requests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isReceived ? Icons.inbox : Icons.send,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              isReceived ? 'No received requests' : 'No sent requests',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              isReceived
                  ? 'Requests from other users will appear here'
                  : 'Your requests to other users will appear here',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRequests,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: requests.length,
        itemBuilder: (context, index) {
          final request = requests[index];
          return _RequestCard(
            request: request,
            isReceived: isReceived,
            onAccept: () => _handleAccept(request.id),
            onReject: () => _handleReject(request.id),
            onChat: () {
              // TODO: Implement chat feature
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Chat feature coming soon'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final RoommateRequest request;
  final bool isReceived;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final VoidCallback onChat;

  const _RequestCard({
    required this.request,
    required this.isReceived,
    required this.onAccept,
    required this.onReject,
    required this.onChat,
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
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                  child: const Icon(Icons.person, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isReceived
                            ? (request.senderName ?? 'Unknown User')
                            : (request.receiverName ?? 'Unknown User'),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        request.formattedDate,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(),
              ],
            ),

            const SizedBox(height: 12),

            // Post Info
            if (request.postTitle != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.article, size: 20, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        request.postTitle!,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 12),

            // Message
            if (request.message.isNotEmpty) ...[
              const Text(
                'Message:',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                request.message,
                style: TextStyle(color: Colors.grey[700]),
              ),
              const SizedBox(height: 12),
            ],

            // Actions
            if (request.isPending && isReceived)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onReject,
                      icon: const Icon(Icons.close, color: Colors.red),
                      label: const Text('Reject'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onAccept,
                      icon: const Icon(Icons.check),
                      label: const Text('Accept'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.successColor,
                      ),
                    ),
                  ),
                ],
              )
            else if (request.isAccepted)
              ElevatedButton.icon(
                onPressed: onChat,
                icon: const Icon(Icons.chat),
                label: const Text('Chat Now'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String text;

    switch (request.status) {
      case RoommateRequestStatus.pending:
        color = AppTheme.warningColor;
        text = 'Pending';
        break;
      case RoommateRequestStatus.accepted:
        color = AppTheme.successColor;
        text = 'Accepted';
        break;
      case RoommateRequestStatus.rejected:
        color = Colors.red;
        text = 'Rejected';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
