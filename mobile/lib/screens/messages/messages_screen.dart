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

  List<Conversation> _conversations = [];
  bool _isLoading = true;

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

    // Setup listener for new messages
    _socketService.onNewMessageNotification = (data) {
      if (mounted) {
        _loadConversations();
      }
    };

    // Load conversations
    await _loadConversations();

    // Handle contact data (from listing detail)
    if (widget.contactData != null) {
      _handleContactData();
    }
  }

  void _handleContactData() {
    if (widget.contactData == null) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    final contactData = widget.contactData!;

    // Sort user IDs to match backend conversation ID generation
    final userId = user.id;
    final receiverId = contactData['receiverId'];
    final listingId = contactData['listingId'];
    final sortedIds = [userId, receiverId]..sort();

    // Generate conversation ID matching backend logic
    final conversationId = listingId != null
        ? 'temp_${sortedIds[0]}_${sortedIds[1]}_$listingId'
        : 'temp_${sortedIds[0]}_${sortedIds[1]}';

    // Create temporary conversation
    final tempConversation = Conversation(
      conversationId: conversationId,
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

    // Navigate to chat screen immediately
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(conversation: tempConversation),
        ),
      );
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
    }
  }

  @override
  void dispose() {
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
      body: _buildConversationList(),
    );
  }

  Widget _buildConversationList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_conversations.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No conversations yet',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            SizedBox(height: 8),
            Text(
              'Start chatting with hosts',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _conversations.length,
      itemBuilder: (context, index) {
        final conversation = _conversations[index];

        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: CircleAvatar(
            radius: 28,
            backgroundImage: conversation.otherUserImage != null
                ? CachedNetworkImageProvider(conversation.otherUserImage!)
                : null,
            backgroundColor: AppTheme.primaryColor,
            child: conversation.otherUserImage == null
                ? Text(
                    conversation.otherUserName[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          title: Text(
            conversation.otherUserName,
            style: TextStyle(
              fontWeight: conversation.unreadCount > 0 ? FontWeight.bold : FontWeight.w600,
              fontSize: 16,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              conversation.lastMessage,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: conversation.unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
                color: conversation.unreadCount > 0 ? Colors.black87 : Colors.grey,
              ),
            ),
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (conversation.lastMessageAt != null)
                Text(
                  DateFormatter.getRelativeTime(conversation.lastMessageAt!),
                  style: TextStyle(
                    fontSize: 12,
                    color: conversation.unreadCount > 0
                        ? AppTheme.primaryColor
                        : Colors.grey,
                    fontWeight: conversation.unreadCount > 0
                        ? FontWeight.w600
                        : FontWeight.normal,
                  ),
                ),
              if (conversation.unreadCount > 0) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  constraints: const BoxConstraints(minWidth: 20),
                  child: Text(
                    conversation.unreadCount.toString(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
          onTap: () {
            // Navigate to chat screen
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ChatScreen(
                  conversation: conversation,
                ),
              ),
            ).then((_) {
              // Reload conversations when coming back
              _loadConversations();
            });
          },
        );
      },
    );
  }
}

// ==================== CHAT SCREEN ====================

class ChatScreen extends StatefulWidget {
  final Conversation conversation;

  const ChatScreen({
    super.key,
    required this.conversation,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final MessageService _messageService = MessageService();
  final SocketService _socketService = SocketService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Message> _messages = [];
  bool _isSending = false;
  bool _isTyping = false;
  Timer? _typingTimer;

  // Track the actual conversation ID (may differ from widget.conversation if temp)
  String? _actualConversationId;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    // Setup socket listeners
    _setupSocketListeners();

    // Join conversation
    _socketService.joinConversation(widget.conversation.conversationId);

    // Load messages
    await _loadMessages();
  }

  void _setupSocketListeners() {
    _socketService.onMessageReceived = (message) {
      // Check against both actual conversation ID and widget conversation ID
      final messageConvId = message['conversationId'];
      final isForThisConversation = messageConvId == (_actualConversationId ?? widget.conversation.conversationId) ||
                                     messageConvId == widget.conversation.conversationId;

      if (mounted && isForThisConversation) {
        setState(() {
          _messages.add(Message.fromJson(message));
        });
        _scrollToBottom();
      }
    };

    _socketService.onTypingStatus = (conversationId, isTyping) {
      // Check against both actual conversation ID and widget conversation ID
      final isForThisConversation = conversationId == (_actualConversationId ?? widget.conversation.conversationId) ||
                                     conversationId == widget.conversation.conversationId;

      if (mounted && isForThisConversation) {
        setState(() {
          _isTyping = isTyping;
        });
      }
    };
  }

  Future<void> _loadMessages() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    String conversationIdToUse = widget.conversation.conversationId;

    // If this is a temporary conversation (from Contact Host),
    // try to find the real conversation if it already exists
    if (widget.conversation.conversationId.startsWith('temp_')) {
      debugPrint('🔍 Temporary conversation detected: ${widget.conversation.conversationId}');
      debugPrint('   Looking for existing conversation...');

      // Get all conversations for this user
      final allConversations = await _messageService.getConversations(user.id);
      debugPrint('📋 Total conversations: ${allConversations.length}');

      // Try to find existing conversation with this host and listing
      final receiverId = widget.conversation.otherUser['_id'];
      final listingId = widget.conversation.listing?['_id'];

      debugPrint('🔎 Search criteria:');
      debugPrint('   receiverId: $receiverId');
      debugPrint('   listingId: $listingId');

      Conversation? foundConversation;

      for (var conv in allConversations) {
        final convReceiverId = conv.otherUser['_id'];
        final convListingId = conv.listing?['_id'];

        debugPrint('   Checking conversation: ${conv.conversationId}');
        debugPrint('     - otherUser: $convReceiverId');
        debugPrint('     - listing: $convListingId');

        // Match by receiver
        final matchesReceiver = convReceiverId == receiverId;

        // Match by listing (if both have listing)
        bool matchesListing = false;
        if (listingId != null && convListingId != null) {
          matchesListing = convListingId == listingId;
        } else if (listingId == null && convListingId == null) {
          // Both don't have listing - match by receiver only
          matchesListing = true;
        }

        debugPrint('     → Matches receiver: $matchesReceiver, listing: $matchesListing');

        if (matchesReceiver && matchesListing) {
          foundConversation = conv;
          debugPrint('✅ MATCH FOUND!');
          break;
        }
      }

      if (foundConversation != null && foundConversation.conversationId != widget.conversation.conversationId) {
        debugPrint('✅ Using existing conversation: ${foundConversation.conversationId}');
        conversationIdToUse = foundConversation.conversationId;

        // Update socket to join the real conversation
        _socketService.leaveConversation(widget.conversation.conversationId);
        _socketService.joinConversation(conversationIdToUse);
      } else {
        debugPrint('📝 No existing conversation found, will create new one on first message');
      }
    }

    // Save the actual conversation ID being used
    _actualConversationId = conversationIdToUse;

    debugPrint('💾 Using conversation ID: $conversationIdToUse');

    // Load messages from the conversation (real or temp)
    final messages = await _messageService.getMessages(
      conversationIdToUse,
      user.id,
    );

    debugPrint('📨 Loaded ${messages.length} messages');

    if (mounted) {
      setState(() {
        _messages = messages;
      });
      _scrollToBottom();

      // Mark as read (only if not temp conversation)
      if (!conversationIdToUse.startsWith('temp_')) {
        _messageService.markAsRead(conversationIdToUse, user.id);
      }
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
    if (_messageController.text.trim().isEmpty) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isSending = true);

    final messageText = _messageController.text.trim();
    final receiverId = widget.conversation.otherUserId;
    // Use actual conversation ID if available, otherwise use widget conversation ID
    final conversationId = _actualConversationId ?? widget.conversation.conversationId;
    final listingId = widget.conversation.listing?['_id'];

    debugPrint('📤 Sending message:');
    debugPrint('   Text: ${messageText.substring(0, messageText.length > 50 ? 50 : messageText.length)}...');
    debugPrint('   ConversationId: $conversationId');
    debugPrint('   To: $receiverId');
    debugPrint('   ListingId: $listingId');
    debugPrint('   Is temp conversation: ${conversationId.startsWith('temp_')}');

    _messageController.clear();

    // Send via socket
    _socketService.sendMessage(
      conversationId: conversationId,
      senderId: user.id,
      receiverId: receiverId,
      messageText: messageText,
      listingId: listingId,
      senderInfo: {
        '_id': user.id,
        'firstName': user.firstName,
        'lastName': user.lastName,
        'profileImagePath': user.profileImagePath,
      },
      receiverInfo: {
        '_id': widget.conversation.otherUser['_id'],
        'firstName': widget.conversation.otherUser['firstName'] ?? '',
        'lastName': widget.conversation.otherUser['lastName'] ?? '',
        'profileImagePath': widget.conversation.otherUser['profileImagePath'],
      },
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

    // HTTP fallback
    Future.delayed(const Duration(seconds: 1), () async {
      await _messageService.sendMessage(
        conversationId: conversationId,
        senderId: user.id,
        receiverId: receiverId,
        message: messageText,
        listingId: listingId,
      );
    });
  }

  void _handleTyping(String text) {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    // Use actual conversation ID if available
    final conversationId = _actualConversationId ?? widget.conversation.conversationId;

    _socketService.emitTyping(
      conversationId: conversationId,
      userId: user.id,
      isTyping: text.isNotEmpty,
    );

    _typingTimer?.cancel();
    if (text.isNotEmpty) {
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socketService.emitTyping(
          conversationId: conversationId,
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
    // Leave the actual conversation being used
    final conversationId = _actualConversationId ?? widget.conversation.conversationId;
    _socketService.leaveConversation(conversationId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const Scaffold();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: widget.conversation.otherUserImage != null
                  ? CachedNetworkImageProvider(widget.conversation.otherUserImage!)
                  : null,
              backgroundColor: AppTheme.primaryColor,
              child: widget.conversation.otherUserImage == null
                  ? Text(
                      widget.conversation.otherUserName[0].toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.conversation.otherUserName,
                    style: const TextStyle(fontSize: 16),
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
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: _messages.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No messages yet. Say hi! 👋',
                          style: TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isMine = message.isSentByMe(user.id);
                      final showAvatar = index == 0 ||
                          _messages[index - 1].senderId != message.senderId;

                      return _MessageBubble(
                        message: message,
                        isMine: isMine,
                        showAvatar: showAvatar,
                        avatarUrl: isMine ? null : widget.conversation.otherUserImage,
                      );
                    },
                  ),
          ),

          // Message Input
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
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
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 22),
                      onPressed: _isSending ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== MESSAGE BUBBLE ====================

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

