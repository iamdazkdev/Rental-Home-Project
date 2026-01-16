import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';
import '../../utils/price_formatter.dart';

class RoommatePostDetailScreen extends StatefulWidget {
  final String postId;

  const RoommatePostDetailScreen({
    super.key,
    required this.postId,
  });

  @override
  State<RoommatePostDetailScreen> createState() =>
      _RoommatePostDetailScreenState();
}

class _RoommatePostDetailScreenState extends State<RoommatePostDetailScreen> {
  final RoommateService _roommateService = RoommateService();

  RoommatePost? _post;
  bool _isLoading = true;
  bool _isSendingRequest = false;

  @override
  void initState() {
    super.initState();
    _loadPost();
  }

  Future<void> _loadPost() async {
    setState(() => _isLoading = true);

    final post = await _roommateService.getPostDetail(widget.postId);

    setState(() {
      _post = post;
      _isLoading = false;
    });
  }

  Future<void> _sendRequest() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to send a request')),
      );
      return;
    }

    // Show message dialog
    final message = await showDialog<String>(
      context: context,
      builder: (context) => _SendRequestDialog(),
    );

    if (message == null) return;

    setState(() => _isSendingRequest = true);

    final result = await _roommateService.sendRequest(
      postId: widget.postId,
      senderId: user.id,
      receiverId: _post!.userId,
      message: message,
    );

    setState(() => _isSendingRequest = false);

    if (result['success']) {
      _showSuccessDialog();
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to send request')),
      );
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 12),
            Text('Request Sent!'),
          ],
        ),
        content: const Text(
          'Your roommate request has been sent. You will be notified when they respond.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _contactUser() {
    if (_post == null) return;

    // TODO: Implement chat feature
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Chat feature coming soon'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_post == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Post not found')),
      );
    }

    final user = context.read<AuthProvider>().user;
    final isOwnPost = user?.id == _post!.userId;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Image Header
          SliverAppBar(
            expandedHeight: _post!.photos.isNotEmpty ? 300 : 0,
            pinned: true,
            flexibleSpace: _post!.photos.isNotEmpty
                ? FlexibleSpaceBar(
                    background: PageView.builder(
                      itemCount: _post!.photos.length,
                      itemBuilder: (context, index) {
                        return CachedNetworkImage(
                          imageUrl: _post!.photos[index],
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: Colors.grey[200],
                            child: const Center(
                                child: CircularProgressIndicator()),
                          ),
                        );
                      },
                    ),
                  )
                : null,
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type Badge & Status
                  Row(
                    children: [
                      _buildTypeBadge(),
                      const Spacer(),
                      _buildStatusBadge(),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    _post!.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${_post!.city}, ${_post!.province}',
                          style: const TextStyle(fontSize: 16),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Budget
                  Row(
                    children: [
                      const Icon(Icons.attach_money, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${PriceFormatter.formatPriceInteger(_post!.budgetMin)} - ${PriceFormatter.formatPriceInteger(_post!.budgetMax)}/month',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).primaryColor,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Move-in date
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, color: Colors.grey),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Move-in: ${_post!.formattedMoveInDate}',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  const Divider(height: 32),

                  // Description
                  const Text(
                    'Description',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _post!.description,
                    style: TextStyle(
                      color: Colors.grey[700],
                      height: 1.5,
                    ),
                  ),

                  const Divider(height: 32),

                  // Preferences
                  const Text(
                    'Preferences',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  _buildPreferences(),

                  const Divider(height: 32),

                  // Lifestyle
                  if (_post!.lifestyle.isNotEmpty) ...[
                    const Text(
                      'Lifestyle',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildLifestyle(),
                    const Divider(height: 32),
                  ],

                  // Contact Info (if allowed)
                  _buildContactSection(isOwnPost),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: isOwnPost ? null : _buildBottomBar(),
    );
  }

  Widget _buildTypeBadge() {
    final isSeeker = _post!.postType == 'SEEKER';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isSeeker
            ? Colors.blue.withValues(alpha: 0.1)
            : Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSeeker ? Icons.search : Icons.home,
            size: 16,
            color: isSeeker ? Colors.blue : Colors.green,
          ),
          const SizedBox(width: 6),
          Text(
            isSeeker ? 'Looking for Room' : 'Has Room Available',
            style: TextStyle(
              color: isSeeker ? Colors.blue : Colors.green,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String text;

    switch (_post!.status) {
      case RoommatePostStatus.active:
        color = Colors.green;
        text = 'Active';
        break;
      case RoommatePostStatus.matched:
        color = Colors.orange;
        text = 'Matched';
        break;
      case RoommatePostStatus.closed:
        color = Colors.grey;
        text = 'Closed';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildPreferences() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _buildPreferenceChip(
          Icons.person,
          _post!.genderPreference == 'ANY'
              ? 'Any Gender'
              : '${_post!.genderPreference} Only',
        ),
        if (_post!.ageRangeMin != null || _post!.ageRangeMax != null)
          _buildPreferenceChip(
            Icons.cake,
            'Age: ${_post!.ageRangeMin ?? 18} - ${_post!.ageRangeMax ?? 60}',
          ),
      ],
    );
  }

  Widget _buildPreferenceChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              size: 16,
              color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.7)),
          const SizedBox(width: 6),
          Text(label),
        ],
      ),
    );
  }

  Widget _buildLifestyle() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _post!.lifestyle.displayList.map<Widget>((item) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            item,
            style: const TextStyle(fontSize: 13),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildContactSection(bool isOwnPost) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Contact',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (isOwnPost)
          Text(
            'This is your post',
            style: TextStyle(color: Colors.grey[600]),
          )
        else ...[
          Text(
            'Preferred contact: ${_post!.preferredContact}',
            style: TextStyle(color: Colors.grey[700]),
          ),
          const SizedBox(height: 8),
          if (_post!.preferredContact == 'PHONE' && _post!.phoneNumber != null)
            Text('Phone: ${_post!.phoneNumber}'),
          if (_post!.preferredContact == 'EMAIL' && _post!.emailAddress != null)
            Text('Email: ${_post!.emailAddress}'),
        ],
      ],
    );
  }

  Widget _buildBottomBar() {
    if (_post!.status != RoommatePostStatus.active) {
      return Container(
        padding: const EdgeInsets.all(16),
        child: const Text(
          'This post is no longer active',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).shadowColor.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Chat Button
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _contactUser,
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Chat'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Request Button
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: _isSendingRequest ? null : _sendRequest,
                icon: _isSendingRequest
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(_isSendingRequest ? 'Sending...' : 'Send Request'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SendRequestDialog extends StatefulWidget {
  @override
  State<_SendRequestDialog> createState() => _SendRequestDialogState();
}

class _SendRequestDialogState extends State<_SendRequestDialog> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Send Request'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Introduce yourself to the poster:'),
          const SizedBox(height: 12),
          TextField(
            controller: _messageController,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Hi! I am interested in becoming roommates...',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_messageController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please enter a message')),
              );
              return;
            }
            Navigator.pop(context, _messageController.text.trim());
          },
          child: const Text('Send'),
        ),
      ],
    );
  }
}
