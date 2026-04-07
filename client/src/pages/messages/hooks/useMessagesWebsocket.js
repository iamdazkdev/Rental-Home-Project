import { useEffect, useRef, useState } from "react";

const useMessagesWebsocket = (socket, selectedConversation, setMessages, fetchConversations) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      console.log("📨 Received message:", message);
      if (message.conversationId === selectedConversation?.conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    };

    const handleUserTyping = ({ conversationId: typingConvId, isTyping: typing }) => {
      if (typingConvId === selectedConversation?.conversationId) {
        setIsTyping(typing);
      }
    };

    const handleNewMessageNotif = () => {
      fetchConversations();
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("new_message_notification", handleNewMessageNotif);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("new_message_notification", handleNewMessageNotif);
    };
  }, [socket, selectedConversation, setMessages, fetchConversations]);

  // Cleanup timeout on unmount to fix memory leak
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const emitTyping = (receiverId, conversationId, status) => {
    if (!socket) return;
    socket.emit("typing", {
      receiverId,
      isTyping: status,
      conversationId,
    });
  };

  const handleTypingEvent = (receiverId, conversationId) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emitTyping(receiverId, conversationId, true);

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(receiverId, conversationId, false);
    }, 1000);
  };

  return { isTyping, handleTypingEvent };
};

export default useMessagesWebsocket;
