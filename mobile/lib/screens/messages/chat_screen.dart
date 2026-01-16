import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../../config/api_config.dart';
import '../../models/message.dart';
import '../../providers/auth_provider.dart';
import '../../services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final String conversationId;
  final String otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;
  final String? listingId;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
    this.listingId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<Message> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _currentUserId;
  String? _realConversationId; // Track real conversation ID after first message
  IO.Socket? _socket;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    await _loadCurrentUser();
    await _loadMessages();
    _connectSocket();
  }

  Future<void> _loadCurrentUser() async {
    debugPrint('🔄 Loading current user...');
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    debugPrint('👤 Current user loaded: ${user?.id ?? "NULL"}');
    setState(() {
      _currentUserId = user?.id;
    });
  }

  Future<void> _loadMessages() async {
    try {
      setState(() => _isLoading = true);

      // Skip fetching if conversation is temporary (new conversation not yet created)
      if (widget.conversationId.startsWith('temp_')) {
        debugPrint('ℹ️ Skipping message fetch for temporary conversation');
        if (mounted) {
          setState(() {
            _messages = [];
            _isLoading = false;
          });
        }
        return;
      }

      final messages = await _chatService.getMessages(widget.conversationId);

      if (mounted) {
        setState(() {
          _messages = messages;
          _isLoading = false;
        });
        _scrollToBottom();

        // Mark as read
        if (_currentUserId != null) {
          await _chatService.markAsRead(widget.conversationId, _currentUserId!);
        }
      }
    } catch (e) {
      debugPrint('❌ Error loading messages: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load messages: $e')),
        );
      }
    }
  }

  void _connectSocket() {
    if (_currentUserId == null) return;

    try {
      debugPrint('🔌 Connecting to Socket.IO...');

      _socket = IO.io(
        ApiConfig.baseUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .build(),
      );

      _socket?.connect();

      _socket?.onConnect((_) {
        debugPrint('✅ Socket connected');
        _socket?.emit('join', _currentUserId);
      });

      _socket?.on('receiveMessage', (data) {
        debugPrint('📨 Received message via socket: $data');
        final message = _chatService.parseSocketMessage(data);

        // Accept message if it matches either widget conversationId or real conversationId
        final isForThisConversation =
            message.conversationId == widget.conversationId ||
                (_realConversationId != null &&
                    message.conversationId == _realConversationId);

        if (isForThisConversation) {
          setState(() {
            _messages.add(message);
          });
          _scrollToBottom();

          // Mark as read
          if (_currentUserId != null) {
            _chatService.markAsRead(message.conversationId, _currentUserId!);
          }
        }
      });

      _socket?.onDisconnect((_) {
        debugPrint('❌ Socket disconnected');
      });

      _socket?.onError((error) {
        debugPrint('❌ Socket error: $error');
      });
    } catch (e) {
      debugPrint('❌ Error connecting socket: $e');
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
    debugPrint('🔔 Send button pressed!');
    debugPrint('   _currentUserId: $_currentUserId');
    debugPrint('   _isSending: $_isSending');
    debugPrint(
        '   messageText length: ${_messageController.text.trim().length}');

    if (_messageController.text.trim().isEmpty || _currentUserId == null) {
      debugPrint('❌ Send aborted:');
      if (_messageController.text.trim().isEmpty) {
        debugPrint('   - Message is empty');
      }
      if (_currentUserId == null) {
        debugPrint('   - Current user ID is null');
      }
      return;
    }

    final messageText = _messageController.text.trim();
    _messageController.clear();

    try {
      setState(() => _isSending = true);

      debugPrint('📤 ChatScreen - Sending message:');
      debugPrint('   conversationId: ${widget.conversationId}');
      debugPrint('   senderId: $_currentUserId');
      debugPrint('   receiverId: ${widget.otherUserId}');
      debugPrint('   listingId: ${widget.listingId}');
      debugPrint('   text: $messageText');

      final message = await _chatService.sendMessage(
        conversationId: widget.conversationId,
        senderId: _currentUserId!,
        receiverId: widget.otherUserId,
        text: messageText,
        listingId: widget.listingId,
      );

      // Save real conversation ID from first message (if it was temporary)
      if (_realConversationId == null && message.conversationId.isNotEmpty) {
        setState(() {
          _realConversationId = message.conversationId;
        });
        debugPrint('✅ Real conversation ID: $_realConversationId');
      }

      // Emit via socket for real-time delivery
      _socket?.emit(
          'sendMessage', _chatService.formatMessageForSocket(message));

      // Add to local list if not already there (avoid duplicates)
      if (!_messages.any((m) => m.id == message.id)) {
        setState(() {
          _messages.add(message);
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('❌ Error sending message: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  String _getAvatarUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '${ApiConfig.baseUrl}/$path';
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: widget.otherUserAvatar != null
                  ? NetworkImage(_getAvatarUrl(widget.otherUserAvatar))
                  : null,
              child: widget.otherUserAvatar == null
                  ? Text(
                      widget.otherUserName[0].toUpperCase(),
                      style: const TextStyle(fontSize: 16),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.otherUserName,
                style: const TextStyle(fontSize: 18),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline,
                                size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(
                              'No messages yet',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Start the conversation!',
                              style: TextStyle(color: Colors.grey.shade500),
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
                          final isMe = message.senderId == _currentUserId;

                          return _buildMessageBubble(message, isMe);
                        },
                      ),
          ),

          // Message input
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.shade300,
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(8),
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
                        fillColor: Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.blue,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: _isSending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.send, color: Colors.white),
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

  Widget _buildMessageBubble(Message message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMe ? Colors.blue : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.text,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              message.formattedTime,
              style: TextStyle(
                color: isMe ? Colors.white70 : Colors.grey.shade600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
