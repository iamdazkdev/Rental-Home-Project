
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/models/message_model.dart';
import '../../../data/repositories/message_repository.dart';

// States
abstract class ChatState {}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatLoaded extends ChatState {
  final List<MessageModel> messages;

  ChatLoaded({required this.messages});
}

class ChatError extends ChatState {
  final String message;

  ChatError({required this.message});
}

// Cubit
class ChatCubit extends Cubit<ChatState> {
  final MessageRepository _messageRepository;

  ChatCubit({required MessageRepository messageRepository})
      : _messageRepository = messageRepository,
        super(ChatInitial());

  Future<void> loadMessages(String conversationId) async {
    emit(ChatLoading());

    try {
      final messages = await _messageRepository.getMessages(conversationId);
      emit(ChatLoaded(messages: messages));
    } catch (e) {
      emit(ChatError(message: e.toString()));
    }
  }

  Future<void> sendMessage({
    required String conversationId,
    required String senderId,
    required String recipientId,
    required String message,
  }) async {
    try {
      final result = await _messageRepository.sendMessage(
        conversationId: conversationId,
        senderId: senderId,
        receiverId: recipientId,
        text: message,
      );

      if (result != null) {
        // Reload messages to include the new one
        loadMessages(conversationId);
      }
    } catch (e) {
      // Handle error silently or show notification
    }
  }

  void addMessageToList(MessageModel message) {
    if (state is ChatLoaded) {
      final currentMessages = (state as ChatLoaded).messages;
      emit(ChatLoaded(messages: [...currentMessages, message]));
    }
  }
}

