import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';

import '../../features/roommate/domain/entities/roommate_entity.dart';
import '../../features/roommate/presentation/cubits/roommate_management_cubit.dart';
import '../../providers/auth_provider.dart';

class MyRoommateRequestsScreen extends StatefulWidget {
  const MyRoommateRequestsScreen({super.key});

  @override
  State<MyRoommateRequestsScreen> createState() =>
      _MyRoommateRequestsScreenState();
}

class _MyRoommateRequestsScreenState extends State<MyRoommateRequestsScreen>
    with SingleTickerProviderStateMixin {
  late final RoommateManagementCubit _managementCubit;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _managementCubit = GetIt.I<RoommateManagementCubit>();
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
    if (user != null) {
      _managementCubit.loadMyRequests(user.id);
    }
  }

  void _handleAccept(String requestId) {
    _managementCubit.respondToRequest(requestId, 'ACCEPTED');
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

    if (confirm == true) {
      _managementCubit.respondToRequest(requestId, 'REJECTED');
    }
  }



  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _managementCubit,
      child: BlocConsumer<RoommateManagementCubit, RoommateManagementState>(
        listener: (context, state) {
          if (state is RoommateActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
            _loadRequests();
          } else if (state is RoommateManagementError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          List<RoommateRequestEntity> receivedRequests = [];
          List<RoommateRequestEntity> sentRequests = [];
          bool isLoading = state is RoommateManagementLoading;

          if (state is RoommateRequestsLoaded) {
            final user = context.read<AuthProvider>().user;
            if (user != null) {
              receivedRequests = state.requests.where((r) => r.receiverId == user.id).toList();
              sentRequests = state.requests.where((r) => r.senderId == user.id).toList();
            }
          }

          return Scaffold(
            appBar: AppBar(
              title: const Text('Roommate Requests'),
              bottom: TabBar(
                controller: _tabController,
                tabs: [
                  Tab(text: 'Received (${receivedRequests.length})'),
                  Tab(text: 'Sent (${sentRequests.length})'),
                ],
              ),
            ),
            body: isLoading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildRequestsList(receivedRequests, isReceived: true),
                      _buildRequestsList(sentRequests, isReceived: false),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buildRequestsList(List<RoommateRequestEntity> requests,
      {required bool isReceived}) {
    if (requests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isReceived ? Icons.inbox : Icons.send,
              size: 80,
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withValues(alpha: 0.3),
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
              style: Theme.of(context).textTheme.bodySmall,
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
  final RoommateRequestEntity request;
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
                  backgroundColor:
                      Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  child:
                      Icon(Icons.person, color: Theme.of(context).primaryColor),
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
                        style: Theme.of(context).textTheme.bodySmall,
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
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.article,
                        size: 20,
                        color: Theme.of(context)
                            .iconTheme
                            .color
                            ?.withValues(alpha: 0.6)),
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
                style: Theme.of(context).textTheme.bodyMedium,
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
                        backgroundColor: Colors.green,
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
                  backgroundColor: Theme.of(context).primaryColor,
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
        color = Colors.orange;
        text = 'Pending';
        break;
      case RoommateRequestStatus.accepted:
        color = Colors.green;
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
