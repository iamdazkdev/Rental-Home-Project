import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/repositories/message_repository.dart';
import '../../../models/conversation.dart';
import '../../../models/message.dart';
import 'chat_state.dart';

class ChatCubit extends Cubit<ChatState> {
  final MessageRepository _messageRepository;
  final String currentUserId;

  ChatCubit({
    required MessageRepository messageRepository,
    required this.currentUserId,
  })  : _messageRepository = messageRepository,
        super(ChatInitial());

  Future<void> loadConversations() async {
    emit(ChatLoading());

    try {
      final conversations =
          await _messageRepository.getConversations(currentUserId);
      emit(ChatConversationsLoaded(conversations: conversations));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> loadMessages(String conversationId) async {
    try {
      // Skip fetching if conversation is temporary (new conversation not yet created)
      if (conversationId.startsWith('temp_')) {
        // Keep conversations in state when loading messages
        if (state is ChatConversationsLoaded) {
          final conversations =
              (state as ChatConversationsLoaded).conversations;
          emit(ChatMessagesLoaded(
            messages: [], // Empty messages for new conversation
            conversations: conversations,
          ));
        } else {
          emit(ChatMessagesLoaded(messages: [])); // Empty messages
        }
        return;
      }

      final messages = await _messageRepository.getMessages(conversationId);

      // Keep conversations in state when loading messages
      if (state is ChatConversationsLoaded) {
        final conversations = (state as ChatConversationsLoaded).conversations;
        emit(ChatMessagesLoaded(
          messages: messages,
          conversations: conversations,
        ));
      } else {
        emit(ChatMessagesLoaded(messages: messages));
      }
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> sendMessage({
    required String receiverId,
    required String message,
    String? listingId,
  }) async {
    try {
      final result = await _messageRepository.sendMessage(
        senderId: currentUserId,
        receiverId: receiverId,
        text: message,
        listingId: listingId,
      );

      if (result != null) {
        // Get current messages and conversations from state
        List<MessageModel> currentMessages = [];
        List<ConversationModel>? conversations;

        if (state is ChatMessagesLoaded) {
          currentMessages = (state as ChatMessagesLoaded).messages;
          conversations = (state as ChatMessagesLoaded).conversations;
        } else if (state is ChatConversationsLoaded) {
          conversations = (state as ChatConversationsLoaded).conversations;
        }

        // Emit updated state with new message
        emit(ChatMessagesLoaded(
          messages: [...currentMessages, result],
          conversations: conversations,
        ));
      }
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  void addMessageToList(MessageModel message) {
    if (state is ChatMessagesLoaded) {
      final currentMessages = (state as ChatMessagesLoaded).messages;
      final conversations = (state as ChatMessagesLoaded).conversations;
      emit(ChatMessagesLoaded(
        messages: [...currentMessages, message],
        conversations: conversations,
      ));
    }
  }
}
