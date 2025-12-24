import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/message_service.dart';
import '../../services/socket_service.dart';
import '../../models/conversation.dart';
import '../../models/message.dart';
import '../../utils/date_formatter.dart';

class MessagesScreen extends StatefulWidget {
  final String? conversationId;
  final Map<String, dynamic>? contactData;

  const MessagesScreen({
    super.key,
    this.conversationId,
    this.contactData,
  });

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final MessageService _messageService = MessageService();
  final SocketService _socketService = SocketService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Conversation> _conversations = [];
  Conversation? _selectedConversation;
  List<Message> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  bool _isTyping = false;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    // Connect socket
    await _socketService.connect(user.id);
    _setupSocketListeners();

    // Load conversations
    await _loadConversations();

    // Handle contact data (from listing detail)
    if (widget.contactData != null) {
      _handleContactData();
    }
  }

  void _setupSocketListeners() {
    _socketService.onMessageReceived = (message) {
      if (mounted) {
        if (message['conversationId'] == _selectedConversation?.conversationId) {
          setState(() {
            _messages.add(Message.fromJson(message));
          });
          _scrollToBottom();
        }
        _loadConversations();
      }
    };

    _socketService.onTypingStatus = (conversationId, isTyping) {
      if (mounted && conversationId == _selectedConversation?.conversationId) {
        setState(() {
          _isTyping = isTyping;
        });
      }
    };

    _socketService.onNewMessageNotification = (data) {
      if (mounted) {
        _loadConversations();
      }
    };
  }

  void _handleContactData() {
    if (widget.contactData == null) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    final contactData = widget.contactData!;

    // Create temporary conversation
    final tempConversation = Conversation(
      conversationId: 'temp_${user.id}_${contactData['receiverId']}',
      otherUser: {
        '_id': contactData['receiverId'],
        'firstName': contactData['receiverName']?.toString().split(' ').first ?? 'User',
        'lastName': contactData['receiverName']?.toString().split(' ').skip(1).join(' ') ?? '',
        'profileImagePath': null,
      },
      listing: contactData['listingId'] != null ? {
        '_id': contactData['listingId'],
        'title': contactData['listingTitle'] ?? 'Property',
        'listingPhotoPaths': [],
      } : null,
      lastMessage: 'Start a conversation...',
      lastMessageAt: DateTime.now(),
      unreadCount: 0,
    );

    setState(() {
      _selectedConversation = tempConversation;
      _messages = [];
    });
  }

  Future<void> _loadConversations() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    final conversations = await _messageService.getConversations(user.id);

    if (mounted) {
      setState(() {
        _conversations = conversations;
        _isLoading = false;
      });

      // Auto-select conversation
      if (_selectedConversation == null && conversations.isNotEmpty) {
        _selectConversation(conversations.first);
      } else if (widget.conversationId != null) {
        final conv = conversations.firstWhere(
          (c) => c.conversationId == widget.conversationId,
          orElse: () => conversations.isNotEmpty ? conversations.first : _selectedConversation!,
        );
        _selectConversation(conv);
      }
    }
  }

  void _selectConversation(Conversation conversation) {
    setState(() {
      _selectedConversation = conversation;
    });

    _loadMessages(conversation.conversationId);
    _socketService.joinConversation(conversation.conversationId);
  }

  Future<void> _loadMessages(String conversationId) async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    final messages = await _messageService.getMessages(conversationId, user.id);

    if (mounted) {
      setState(() {
        _messages = messages;
      });
      _scrollToBottom();

      // Mark as read
      _messageService.markAsRead(conversationId, user.id);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty || _selectedConversation == null) {
      return;
    }

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isSending = true);

    final messageText = _messageController.text.trim();
    final receiverId = _selectedConversation!.otherUserId;
    final conversationId = _selectedConversation!.conversationId;
    final listingId = _selectedConversation!.listing?['_id'];

    _messageController.clear();

    // Send via socket
    _socketService.sendMessage(
      conversationId: conversationId,
      senderId: user.id,
      receiverId: receiverId,
      message: messageText,
      listingId: listingId,
    );

    // Add optimistic message
    final optimisticMessage = Message(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: user.id,
      receiverId: receiverId,
      message: messageText,
      createdAt: DateTime.now(),
      isRead: false,
    );

    setState(() {
      _messages.add(optimisticMessage);
      _isSending = false;
    });

    _scrollToBottom();

    // Fallback: send via HTTP if socket fails
    Future.delayed(const Duration(seconds: 1), () async {
      final result = await _messageService.sendMessage(
        conversationId: conversationId,
        senderId: user.id,
        receiverId: receiverId,
        message: messageText,
        listingId: listingId,
      );

      if (result['success']) {
        _loadConversations();
      }
    });
  }

  void _handleTyping(String text) {
    final user = context.read<AuthProvider>().user;
    if (user == null || _selectedConversation == null) return;

    _socketService.emitTyping(
      conversationId: _selectedConversation!.conversationId,
      userId: user.id,
      isTyping: text.isNotEmpty,
    );

    // Reset typing after 2 seconds
    _typingTimer?.cancel();
    if (text.isNotEmpty) {
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socketService.emitTyping(
          conversationId: _selectedConversation!.conversationId,
          userId: user.id,
          isTyping: false,
        );
      });
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    if (_selectedConversation != null) {
      _socketService.leaveConversation(_selectedConversation!.conversationId);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Please login to view messages')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
      ),
      body: Row(
        children: [
          // Conversation List
          SizedBox(
            width: MediaQuery.of(context).size.width * 0.35,
            child: _buildConversationList(),
          ),

          // Vertical Divider
          const VerticalDivider(width: 1),

          // Chat View
          Expanded(
            child: _selectedConversation == null
                ? _buildEmptyState()
                : _buildChatView(user.id),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_conversations.isEmpty) {
      return const Center(
        child: Text(
          'No conversations yet',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      itemCount: _conversations.length,
      itemBuilder: (context, index) {
        final conversation = _conversations[index];
        final isSelected = conversation.conversationId == _selectedConversation?.conversationId;

        return Container(
          color: isSelected ? AppTheme.primaryColor.withValues(alpha: 0.1) : null,
          child: ListTile(
            leading: CircleAvatar(
              backgroundImage: conversation.otherUserImage != null
                  ? CachedNetworkImageProvider(conversation.otherUserImage!)
                  : null,
              backgroundColor: AppTheme.primaryColor,
              child: conversation.otherUserImage == null
                  ? Text(
                      conversation.otherUserName[0].toUpperCase(),
                      style: const TextStyle(color: Colors.white),
                    )
                  : null,
            ),
            title: Text(
              conversation.otherUserName,
              style: TextStyle(
                fontWeight: conversation.unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(
              conversation.lastMessage,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: conversation.unreadCount > 0 ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (conversation.lastMessageAt != null)
                  Text(
                    DateFormatter.getRelativeTime(conversation.lastMessageAt!),
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                if (conversation.unreadCount > 0) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      conversation.unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            onTap: () => _selectConversation(conversation),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Select a conversation',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildChatView(String userId) {
    return Column(
      children: [
        // Chat Header
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            border: Border(
              bottom: BorderSide(color: AppTheme.borderColor),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundImage: _selectedConversation!.otherUserImage != null
                    ? CachedNetworkImageProvider(_selectedConversation!.otherUserImage!)
                    : null,
                backgroundColor: AppTheme.primaryColor,
                child: _selectedConversation!.otherUserImage == null
                    ? Text(
                        _selectedConversation!.otherUserName[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedConversation!.otherUserName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (_isTyping)
                      const Text(
                        'typing...',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.primaryColor,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Messages List
        Expanded(
          child: _messages.isEmpty
              ? const Center(
                  child: Text(
                    'No messages yet. Say hi! 👋',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final message = _messages[index];
                    final isMine = message.isSentByMe(userId);
                    final showAvatar = index == 0 ||
                        _messages[index - 1].senderId != message.senderId;

                    return _MessageBubble(
                      message: message,
                      isMine: isMine,
                      showAvatar: showAvatar,
                      avatarUrl: isMine ? null : _selectedConversation!.otherUserImage,
                    );
                  },
                ),
        ),

        // Message Input
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(color: AppTheme.borderColor),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: AppTheme.backgroundColor,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  onChanged: _handleTyping,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: Colors.white),
                  onPressed: _isSending ? null : _sendMessage,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMine;
  final bool showAvatar;
  final String? avatarUrl;

  const _MessageBubble({
    required this.message,
    required this.isMine,
    required this.showAvatar,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine && showAvatar)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CircleAvatar(
                radius: 16,
                backgroundImage: avatarUrl != null
                    ? CachedNetworkImageProvider(avatarUrl!)
                    : null,
                backgroundColor: AppTheme.primaryColor,
              ),
            )
          else if (!isMine)
            const SizedBox(width: 40),

          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isMine ? AppTheme.primaryColor : AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.message,
                    style: TextStyle(
                      color: isMine ? Colors.white : Colors.black87,
                      fontSize: 15,
                    ),
                  ),
                  if (message.createdAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      DateFormatter.formatTime(message.createdAt!),
                      style: TextStyle(
                        color: isMine
                            ? Colors.white.withValues(alpha: 0.7)
                            : Colors.grey,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

