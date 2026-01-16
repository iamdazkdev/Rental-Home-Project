import 'package:flutter/material.dart';

import '../../models/conversation.dart';
import '../../services/chat_service.dart';
import '../../utils/auth_storage.dart';
import 'chat_screen.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  final ChatService _chatService = ChatService();
  List<Conversation> _conversations = [];
  bool _isLoading = true;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    try {
      setState(() => _isLoading = true);

      final user = await AuthStorage.getUser();
      final userId = user?.id;

      if (userId == null) {
        debugPrint('⚠️ User not logged in');
        if (mounted) {
          setState(() {
            _isLoading = false;
            _userId = null;
          });
        }
        return;
      }

      setState(() => _userId = userId);

      final conversations = await _chatService.getConversations(userId);

      if (mounted) {
        setState(() {
          _conversations = conversations;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('❌ Error loading conversations: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load conversations: $e')),
        );
      }
    }
  }

  String _getAvatarUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return 'http://localhost:3001/$path';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadConversations,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _userId == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.login, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('Please log in to view messages'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/login'),
                        child: const Text('Log In'),
                      ),
                    ],
                  ),
                )
              : _conversations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline,
                              size: 64, color: Colors.grey),
                          const SizedBox(height: 16),
                          const Text('No conversations yet'),
                          const SizedBox(height: 8),
                          const Text(
                            'Start chatting with hosts!',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadConversations,
                      child: ListView.builder(
                        itemCount: _conversations.length,
                        itemBuilder: (context, index) {
                          final conversation = _conversations[index];
                          return _buildConversationTile(conversation);
                        },
                      ),
                    ),
    );
  }

  Widget _buildConversationTile(Conversation conversation) {
    final isUnread = conversation.unreadCount > 0;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              conversationId: conversation.conversationId,
              otherUserId: conversation.otherUser.id,
              otherUserName: conversation.otherUser.fullName,
              otherUserAvatar: conversation.otherUser.profileImagePath,
              listingId: conversation.listing?.id,
            ),
          ),
        ).then((_) => _loadConversations()); // Refresh on return
      },
      child: Container(
        decoration: BoxDecoration(
          color: isUnread ? Colors.blue.shade50 : Colors.white,
          border: Border(
            bottom: BorderSide(color: Colors.grey.shade200),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              CircleAvatar(
                radius: 28,
                backgroundImage: conversation.otherUser.profileImagePath != null
                    ? NetworkImage(
                        _getAvatarUrl(conversation.otherUser.profileImagePath))
                    : null,
                child: conversation.otherUser.profileImagePath == null
                    ? Text(
                        conversation.otherUser.firstName[0].toUpperCase(),
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name and time
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          conversation.otherUser.fullName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                isUnread ? FontWeight.bold : FontWeight.w600,
                          ),
                        ),
                        Text(
                          conversation.formattedTime,
                          style: TextStyle(
                            fontSize: 12,
                            color: isUnread ? Colors.blue : Colors.grey,
                            fontWeight:
                                isUnread ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),

                    // Listing info if available
                    if (conversation.listing != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.home, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              conversation.listing!.title,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.grey,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Last message
                    if (conversation.lastMessage != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        conversation.lastMessage!,
                        style: TextStyle(
                          fontSize: 14,
                          color: isUnread ? Colors.black87 : Colors.grey,
                          fontWeight:
                              isUnread ? FontWeight.w500 : FontWeight.normal,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),

              // Unread badge
              if (isUnread)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${conversation.unreadCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
