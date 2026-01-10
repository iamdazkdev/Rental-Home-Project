import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/repositories/message_repository.dart';
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
        emit(ChatMessageSent(message: result));

        // Add message to current list
        if (state is ChatMessagesLoaded) {
          final currentMessages = (state as ChatMessagesLoaded).messages;
          final conversations = (state as ChatMessagesLoaded).conversations;
          emit(ChatMessagesLoaded(
            messages: [...currentMessages, result],
            conversations: conversations,
          ));
        }
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
