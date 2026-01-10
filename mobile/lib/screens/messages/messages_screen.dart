import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/conversation.dart';
import '../../models/message.dart';
import '../../presentation/chat/cubit/chat_cubit.dart';
import '../../presentation/chat/cubit/chat_state.dart';
import '../../utils/date_formatter.dart';

class MessagesScreen extends StatefulWidget {
  final String? conversationId;
  final String? receiverId;
  final String? receiverName;
  final String? receiverProfileImage;
  final String? listingId;
  final String? listingTitle;

  const MessagesScreen({
    super.key,
    this.conversationId,
    this.receiverId,
    this.receiverName,
    this.receiverProfileImage,
    this.listingId,
    this.listingTitle,
  });

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _showConversationsList = true;
  ConversationModel? _selectedConversation;

  @override
  void initState() {
    super.initState();
    _initializeScreen();
  }

  void _initializeScreen() {
    final chatCubit = context.read<ChatCubit>();

    // Handle Contact Host flow
    if (widget.receiverId != null) {
      final tempId = 'temp_${chatCubit.currentUserId}_${widget.receiverId}';

      // Create temporary conversation for new contact
      _selectedConversation = ConversationModel(
        id: tempId,
        participants: [chatCubit.currentUserId ?? '', widget.receiverId!],
        otherUser: UserInfo(
          id: widget.receiverId!,
          firstName: widget.receiverName?.split(' ').first ?? 'Host',
          lastName: widget.receiverName?.split(' ').skip(1).join(' ') ?? '',
          profileImagePath: widget.receiverProfileImage,
        ),
        listingId: widget.listingId,
        listingTitle: widget.listingTitle,
        listingPhotoPaths: [],
        lastMessage: 'Start a conversation...',
        lastMessageAt: DateTime.now(),
        unreadCount: 0,
      );
      setState(() {
        _showConversationsList = false;
      });
    } else {
      // Normal flow - load conversations
      chatCubit.loadConversations();
      if (widget.conversationId != null) {
        chatCubit.loadMessages(widget.conversationId!);
        setState(() {
          _showConversationsList = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty ||
        _selectedConversation == null) {
      return;
    }

    final chatCubit = context.read<ChatCubit>();
    chatCubit.sendMessage(
      receiverId: _selectedConversation!.otherUser.id,
      message: _messageController.text.trim(),
      listingId: _selectedConversation!.listingId,
    );

    _messageController.clear();
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _showConversationsList || MediaQuery.of(context).size.width > 720
          ? AppBar(
              title: const Text('Messages'),
              elevation: 0,
            )
          : null,
      body: SafeArea(
        child: BlocConsumer<ChatCubit, ChatState>(
          listener: (context, state) {
            if (state is ChatMessagesLoaded) {
              Future.delayed(
                  const Duration(milliseconds: 100), _scrollToBottom);
            }
            if (state is ChatMessageSent) {
              Future.delayed(
                  const Duration(milliseconds: 100), _scrollToBottom);
            }
          },
          builder: (context, state) {
            if (state is ChatLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is ChatError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        context.read<ChatCubit>().loadConversations();
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            // Get conversations and messages from state
            final conversations = state is ChatConversationsLoaded
                ? state.conversations
                : state is ChatMessagesLoaded
                    ? (state as dynamic).conversations ?? []
                    : [];

            final messages =
                state is ChatMessagesLoaded ? state.messages : <MessageModel>[];

            return Row(
              children: [
                // Conversations List (Left Panel)
                if (_showConversationsList)
                  Container(
                    width: MediaQuery.of(context).size.width > 720
                        ? 320
                        : MediaQuery.of(context).size.width,
                    decoration: BoxDecoration(
                      border: Border(
                        right: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                    child: _buildConversationsList(conversations),
                  ),

                // Chat Area (Right Panel)
                if (!_showConversationsList ||
                    MediaQuery.of(context).size.width > 720)
                  Expanded(
                    child: _selectedConversation == null
                        ? _buildEmptyState()
                        : _buildChatArea(messages),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildConversationsList(List<ConversationModel> conversations) {
    if (conversations.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No conversations yet',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: conversations.length,
      itemBuilder: (context, index) {
        final conversation = conversations[index];
        return _buildConversationItem(conversation);
      },
    );
  }

  Widget _buildConversationItem(ConversationModel conversation) {
    final isSelected = _selectedConversation?.id == conversation.id;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedConversation = conversation;
          _showConversationsList = MediaQuery.of(context).size.width > 720;
        });
        context.read<ChatCubit>().loadMessages(conversation.id);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade50 : Colors.transparent,
          border: Border(
            bottom: BorderSide(color: Colors.grey.shade200),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 28,
              backgroundImage: conversation.otherUser.profileImagePath != null
                  ? NetworkImage(conversation.otherUser.profileImagePath!)
                  : null,
              child: conversation.otherUser.profileImagePath == null
                  ? Text(
                      conversation.otherUser.firstName
                          .substring(0, 1)
                          .toUpperCase(),
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${conversation.otherUser.firstName} ${conversation.otherUser.lastName}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        DateFormatter.formatMessageTime(
                            conversation.lastMessageAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                  if (conversation.listingTitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      conversation.listingTitle!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage ?? 'No messages yet',
                          style: TextStyle(
                            fontSize: 14,
                            color: conversation.unreadCount > 0
                                ? Colors.black
                                : Colors.grey.shade700,
                            fontWeight: conversation.unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red,
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_outlined, size: 80, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Select a conversation to start messaging',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildChatArea(List<MessageModel> messages) {
    return Column(
      children: [
        // Chat Header
        _buildChatHeader(),
        // Messages List
        Expanded(
          child: messages.isEmpty
              ? const Center(
                  child: Text(
                    'No messages yet. Start the conversation!',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    return _buildMessageBubble(messages[index]);
                  },
                ),
        ),
        // Input Area
        _buildMessageInput(),
      ],
    );
  }

  Widget _buildChatHeader() {
    if (_selectedConversation == null) return const SizedBox();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade300),
        ),
      ),
      child: Row(
        children: [
          if (MediaQuery.of(context).size.width <= 720)
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                setState(() {
                  _showConversationsList = true;
                  _selectedConversation = null;
                });
              },
            ),
          CircleAvatar(
            radius: 20,
            backgroundImage:
                _selectedConversation!.otherUser.profileImagePath != null
                    ? NetworkImage(
                        _selectedConversation!.otherUser.profileImagePath!)
                    : null,
            child: _selectedConversation!.otherUser.profileImagePath == null
                ? Text(
                    _selectedConversation!.otherUser.firstName
                        .substring(0, 1)
                        .toUpperCase(),
                    style: const TextStyle(fontSize: 16),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_selectedConversation!.otherUser.firstName} ${_selectedConversation!.otherUser.lastName}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (_selectedConversation!.listingTitle != null)
                  Text(
                    _selectedConversation!.listingTitle!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(MessageModel message) {
    final chatCubit = context.read<ChatCubit>();
    final isMe = message.senderId == chatCubit.currentUserId;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFFFF385A) : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.message,
              style: TextStyle(
                fontSize: 15,
                color: isMe ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormatter.formatMessageTime(message.createdAt),
              style: TextStyle(
                fontSize: 11,
                color: isMe ? Colors.white70 : Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.shade300),
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
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 12),
          CircleAvatar(
            backgroundColor: const Color(0xFFFF385A),
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
