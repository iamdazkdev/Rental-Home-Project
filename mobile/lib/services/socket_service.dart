import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final Set<String> _onlineUsers = {};

  // Callbacks
  Function(Map<String, dynamic>)? onMessageReceived;
  Function(String, bool)? onTypingStatus;
  Function(String, bool)? onUserStatusChange;
  Function(Map<String, dynamic>)? onNewMessageNotification;

  IO.Socket? get socket => _socket;
  Set<String> get onlineUsers => _onlineUsers;

  bool isUserOnline(String userId) => _onlineUsers.contains(userId);

  Future<void> connect(String userId) async {
    if (_socket != null && _socket!.connected) {
      debugPrint('🔌 Socket already connected');
      return;
    }

    try {
      debugPrint('🔌 Connecting to socket server...');

      _socket = IO.io(
        ApiConfig.socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .disableAutoConnect()
            .build(),
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        debugPrint('✅ Socket connected: ${_socket!.id}');
        // Emit user online
        _socket!.emit('user_online', userId);
      });

      _socket!.on('user_status_change', (data) {
        debugPrint('👤 User status change: $data');
        final userId = data['userId'];
        final status = data['status'];

        if (status == 'online') {
          _onlineUsers.add(userId);
        } else {
          _onlineUsers.remove(userId);
        }

        onUserStatusChange?.call(userId, status == 'online');
      });

      _socket!.on('receive_message', (data) {
        debugPrint('📨 Received message: $data');
        onMessageReceived?.call(Map<String, dynamic>.from(data));
      });

      _socket!.on('user_typing', (data) {
        debugPrint('⌨️ User typing: $data');
        final conversationId = data['conversationId'];
        final isTyping = data['isTyping'];
        onTypingStatus?.call(conversationId, isTyping);
      });

      _socket!.on('new_message_notification', (data) {
        debugPrint('🔔 New message notification: $data');
        onNewMessageNotification?.call(Map<String, dynamic>.from(data));
      });

      _socket!.onDisconnect((_) {
        debugPrint('❌ Socket disconnected');
      });

      _socket!.onError((error) {
        debugPrint('❌ Socket error: $error');
      });
    } catch (e) {
      debugPrint('❌ Error connecting socket: $e');
    }
  }

  void sendMessage({
    required String conversationId,
    required String senderId,
    required String receiverId,
    required String messageText,
    String? listingId,
    Map<String, dynamic>? senderInfo,
    Map<String, dynamic>? receiverInfo,
  }) {
    if (_socket == null || !_socket!.connected) {
      debugPrint('❌ Socket not connected');
      return;
    }

    debugPrint('📤 Sending message via socket');
    debugPrint('   From: $senderId → To: $receiverId');
    debugPrint('   Message: $messageText');

    // Create message object with populated sender/receiver info
    // This matches the format that web client sends (from API response)
    final messageObject = {
      'conversationId': conversationId,
      'senderId': senderInfo ?? {
        '_id': senderId,
      },
      'receiverId': receiverInfo ?? {
        '_id': receiverId,
      },
      'message': messageText,
      'messageType': 'text',
      'createdAt': DateTime.now().toIso8601String(),
      'isRead': false,
      if (listingId != null) 'listingId': listingId,
    };

    // Send in format backend expects: { senderId, receiverId, message: {...} }
    _socket!.emit('send_message', {
      'senderId': senderId,
      'receiverId': receiverId,
      'message': messageObject,
    });

    debugPrint('✅ Message emitted via socket');
  }

  void emitTyping({
    required String conversationId,
    required String userId,
    required bool isTyping,
  }) {
    if (_socket == null || !_socket!.connected) return;

    _socket!.emit('typing', {
      'conversationId': conversationId,
      'userId': userId,
      'isTyping': isTyping,
    });
  }

  void joinConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) return;

    _socket!.emit('join_conversation', conversationId);
    debugPrint('🚪 Joined conversation: $conversationId');
  }

  void leaveConversation(String conversationId) {
    if (_socket == null || !_socket!.connected) return;

    _socket!.emit('leave_conversation', conversationId);
    debugPrint('🚪 Left conversation: $conversationId');
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _onlineUsers.clear();
      debugPrint('🔌 Socket disconnected and disposed');
    }
  }
}

