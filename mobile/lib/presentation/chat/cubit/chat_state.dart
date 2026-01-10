import '../../../models/conversation.dart';
import '../../../models/message.dart';

abstract class ChatState {}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatConversationsLoaded extends ChatState {
  final List<ConversationModel> conversations;

  ChatConversationsLoaded({required this.conversations});
}

class ChatMessagesLoaded extends ChatState {
  final List<MessageModel> messages;
  final List<ConversationModel>? conversations;

  ChatMessagesLoaded({
    required this.messages,
    this.conversations,
  });
}

class ChatMessageSent extends ChatState {
  final MessageModel message;

  ChatMessageSent({required this.message});
}

class ChatError extends ChatState {
  final String message;

  ChatError({required this.message});
}
