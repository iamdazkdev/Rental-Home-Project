import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSocket } from "../../context/SocketContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import "../../styles/MessagesPage.scss";
import { CONFIG, HTTP_METHODS } from "../../constants/api";

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;
  const { socket, isUserOnline } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Get data from Contact Host button
  const contactData = location.state;

  // Create placeholder avatar with initials
  const createAvatarPlaceholder = (name) => {
    const initial = name?.charAt(0)?.toUpperCase() || "U";
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FF385A';
    ctx.fillRect(0, 0, 100, 100);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, 50, 50);

    return canvas.toDataURL();
  };

  // Create placeholder for listing
  const createListingPlaceholder = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, 100, 100);

    // House icon (simple)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏠', 50, 50);

    return canvas.toDataURL();
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  useEffect(() => {
    if (userId) {
      fetchConversations();
    } else {
      console.warn("⚠️ User not logged in, skipping conversations fetch");
      setLoading(false);
    }
  }, [userId]);

  // Handle Contact Host - Create new conversation if needed
  useEffect(() => {
    if (contactData && contactData.receiverId && userId) {
      console.log("📧 Contact Host data:", contactData);

      // Create temporary conversation for new contact
      const tempConversation = {
        conversationId: `temp_${userId}_${contactData.receiverId}`,
        otherUser: {
          _id: contactData.receiverId,
          firstName: contactData.receiverName?.split(' ')[0] || 'Host',
          lastName: contactData.receiverName?.split(' ').slice(1).join(' ') || '',
          profileImagePath: null,
        },
        listing: contactData.listingId ? {
          _id: contactData.listingId,
          title: contactData.listingTitle || 'Property',
          listingPhotoPaths: [],
        } : null,
        lastMessage: "Start a conversation...",
        lastMessageAt: new Date(),
        unreadCount: 0,
      };

      setSelectedConversation(tempConversation);
      setMessages([]);

      // Hide conversations list on mobile for Contact Host flow, keep visible on desktop
      if (window.innerWidth <= 720) {
        setShowConversationsList(false);
      } else {
        setShowConversationsList(true); // Always show on desktop
      }

      // Focus input after a short delay
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 500);

      // Clear location state
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [contactData, userId]);

  // Fetch messages when conversation selected
  useEffect(() => {
    // Skip if coming from Contact Host (contactData exists)
    if (contactData) return;

    if (conversationId) {
      fetchMessages(conversationId);
      // Only hide list on mobile
      if (window.innerWidth <= 720) {
        setShowConversationsList(false);
      } else {
        setShowConversationsList(true); // Always show on desktop
      }
    } else if (conversations.length > 0) {
      // Auto-select first conversation when user opens Messages Page from Account section
      // Only run once when conversations are first loaded
      const firstConv = conversations[0];
      if (!selectedConversation || selectedConversation.conversationId !== firstConv.conversationId) {
        setSelectedConversation(firstConv);
        fetchMessages(firstConv.conversationId);

        // Always show conversations list
        setShowConversationsList(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversations.length, contactData]);

  // Handle window resize - always show conversations list on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 720) {
        setShowConversationsList(true);
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (message) => {
      console.log("📨 Received message:", message);

      if (message.conversationId === selectedConversation?.conversationId) {
        setMessages((prev) => [...prev, message]);
      }

      // Update conversation list
      fetchConversations();
    });

    socket.on("user_typing", ({ conversationId: typingConvId, isTyping: typing }) => {
      if (typingConvId === selectedConversation?.conversationId) {
        setIsTyping(typing);
      }
    });

    socket.on("new_message_notification", ({ senderId, conversationId: notifConvId }) => {
      // Update unread count
      fetchConversations();
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("new_message_notification");
    };
  }, [socket, selectedConversation]);

  const fetchConversations = async () => {
    if (!userId) {
      console.warn("⚠️ Cannot fetch conversations: userId is undefined");
      setLoading(false);
      return;
    }

    try {
      console.log("📞 Fetching conversations for userId:", userId);
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/messages/conversations/${userId}`,
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Conversations fetched:", data.length);
        setConversations(data);
      } else {
        console.error("❌ Failed to fetch conversations:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!userId) {
      console.warn("⚠️ Cannot fetch messages: userId is undefined");
      return;
    }

    if (!convId) {
      console.warn("⚠️ Cannot fetch messages: conversationId is undefined");
      return;
    }

    try {
      console.log("📨 Fetching messages for conversation:", convId);
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/messages/messages/${convId}?userId=${userId}`,
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Messages fetched:", data.length);
        setMessages(data);

        // Find and set selected conversation
        const conv = conversations.find((c) => c.conversationId === convId);
        if (conv) {
          setSelectedConversation(conv);
        }
      } else {
        console.error("❌ Failed to fetch messages:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);

      const messageData = {
        senderId: userId,
        receiverId: selectedConversation.otherUser._id,
        listingId: selectedConversation.listing?._id || null,
        message: newMessage.trim(),
        messageType: "text",
      };

      console.log("📤 Sending message:", messageData);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/messages/messages`,
        {
          method: HTTP_METHODS.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        console.log("✅ Message sent:", data);

        // Add message to UI
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");

        // Update selected conversation with real ID
        if (selectedConversation.conversationId.startsWith('temp_')) {
          setSelectedConversation({
            ...selectedConversation,
            conversationId: data.message.conversationId,
            lastMessage: newMessage.trim(),
            lastMessageAt: new Date(),
          });
        }

        // Emit socket event
        if (socket) {
          socket.emit("send_message", {
            senderId: userId,
            receiverId: selectedConversation.otherUser._id,
            message: data.message,
          });
        }

        // Update conversations list
        fetchConversations();

        // Focus back to input
        messageInputRef.current?.focus();
      } else {
        const errorData = await response.text();
        console.error("❌ Error sending message:", errorData);
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedConversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socket.emit("typing", {
      receiverId: selectedConversation.otherUser._id,
      isTyping: true,
      conversationId: selectedConversation.conversationId,
    });

    // Emit typing stop after 1 second
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        receiverId: selectedConversation.otherUser._id,
        isTyping: false,
        conversationId: selectedConversation.conversationId,
      });
    }, 1000);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) return <Loader />;

  // Check if user is logged in
  if (!user || !userId) {
    return (
      <>
        <Navbar />
        <div className="messages-page">
          <div className="messages-container">
            <div className="no-conversation-selected">
              <div className="empty-state">
                <span className="empty-icon">🔒</span>
                <h3>Login Required</h3>
                <p>Please login to view your messages</p>
                <button
                  className="button"
                  onClick={() => navigate("/login")}
                  style={{ marginTop: "20px" }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="messages-page">
        <div className="messages-container">
          {/* Conversations List */}
          <div className={`conversations-list ${showConversationsList ? 'mobile-show' : ''}`}>
            <div className="list-header">
              <h2>💬 Messages</h2>
              <span className="conv-count">{conversations.length}</span>
            </div>

            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>📭 No messages yet</p>
                <p className="hint">Start a conversation with a host!</p>
              </div>
            ) : (
              <div className="conversations">
                {conversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`conversation-item ${
                      selectedConversation?.conversationId === conv.conversationId
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedConversation(conv);
                      fetchMessages(conv.conversationId);
                      navigate(`/messages/${conv.conversationId}`);
                      // Only hide on mobile
                      if (window.innerWidth <= 720) {
                        setShowConversationsList(false);
                      }
                    }}
                  >
                    <div className="conv-avatar-wrapper">
                      <img
                        src={
                          conv.otherUser.profileImagePath?.startsWith("https://")
                            ? conv.otherUser.profileImagePath
                            : conv.otherUser.profileImagePath
                            ? `${CONFIG.API_BASE_URL}/${conv.otherUser.profileImagePath.replace("public/", "")}`
                            : createAvatarPlaceholder(conv.otherUser.firstName)
                        }
                        alt={conv.otherUser.firstName}
                        className="conv-avatar"
                        onError={(e) => {
                          if (!e.target.dataset.fallback) {
                            e.target.dataset.fallback = "true";
                            e.target.src = createAvatarPlaceholder(conv.otherUser.firstName);
                          }
                        }}
                      />
                      {isUserOnline(conv.otherUser._id) && (
                        <div className="online-dot"></div>
                      )}
                    </div>

                    <div className="conv-info">
                      <div className="conv-header">
                        <h4>
                          {conv.otherUser.firstName} {conv.otherUser.lastName}
                        </h4>
                        <span className="conv-time">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      {conv.listing && (
                        <p className="conv-listing">📍 {conv.listing.title}</p>
                      )}

                      <p className="conv-last-message">
                        {conv.lastMessageSenderId?._id === userId && "You: "}
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <div className="unread-badge">{conv.unreadCount}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className={`messages-area ${!selectedConversation ? 'no-selection' : ''}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <button
                    className="back-to-list-btn"
                    onClick={() => setShowConversationsList(true)}
                  >
                    ← Back
                  </button>
                  <div className="chat-user-info">
                    <img
                      src={
                        selectedConversation.otherUser.profileImagePath?.startsWith("https://")
                          ? selectedConversation.otherUser.profileImagePath
                          : selectedConversation.otherUser.profileImagePath
                          ? `${CONFIG.API_BASE_URL}/${selectedConversation.otherUser.profileImagePath.replace("public/", "")}`
                          : createAvatarPlaceholder(selectedConversation.otherUser.firstName)
                      }
                      alt={selectedConversation.otherUser.firstName}
                      className="chat-avatar"
                      onError={(e) => {
                        if (!e.target.dataset.fallback) {
                          e.target.dataset.fallback = "true";
                          e.target.src = createAvatarPlaceholder(selectedConversation.otherUser.firstName);
                        }
                      }}
                    />
                    <div>
                      <h3>
                        {selectedConversation.otherUser.firstName}{" "}
                        {selectedConversation.otherUser.lastName}
                      </h3>
                      {isUserOnline(selectedConversation.otherUser._id) ? (
                        <span className="status online">🟢 Online</span>
                      ) : (
                        <span className="status offline">⚫ Offline</span>
                      )}
                    </div>
                  </div>

                  {selectedConversation.listing && (
                    <div className="chat-listing-info">
                      <img
                        src={
                          selectedConversation.listing.listingPhotoPaths?.[0]?.startsWith("https://")
                            ? selectedConversation.listing.listingPhotoPaths[0]
                            : selectedConversation.listing.listingPhotoPaths?.[0]
                            ? `${CONFIG.API_BASE_URL}/${selectedConversation.listing.listingPhotoPaths[0].replace("public/", "")}`
                            : createListingPlaceholder()
                        }
                        alt={selectedConversation.listing.title}
                        className="listing-thumb"
                        onError={(e) => {
                          if (!e.target.dataset.fallback) {
                            e.target.dataset.fallback = "true";
                            e.target.src = createListingPlaceholder();
                          }
                        }}
                      />
                      <span>{selectedConversation.listing.title}</span>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="messages-content">
                  {messages.length === 0 && selectedConversation.conversationId.startsWith('temp_') ? (
                    <div className="new-conversation-hint">
                      <div className="hint-icon">💬</div>
                      <h3>Start a conversation</h3>
                      <p>Say hi to {selectedConversation.otherUser.firstName}!</p>
                      {selectedConversation.listing && (
                        <p className="about-listing">
                          About: <strong>{selectedConversation.listing.title}</strong>
                        </p>
                      )}
                      <div className="suggested-starters">
                        <p className="starters-label">Quick starters:</p>
                        <button
                          className="starter-btn"
                          onClick={() => {
                            setNewMessage("Hi! I'm interested in your property. Is it available?");
                            messageInputRef.current?.focus();
                          }}
                        >
                          Ask about availability
                        </button>
                        <button
                          className="starter-btn"
                          onClick={() => {
                            setNewMessage("Hello! I have some questions about the property.");
                            messageInputRef.current?.focus();
                          }}
                        >
                          Ask questions
                        </button>
                        <button
                          className="starter-btn"
                          onClick={() => {
                            setNewMessage("Hi! I'd like to know more about check-in procedures.");
                            messageInputRef.current?.focus();
                          }}
                        >
                          Ask about check-in
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message ${
                          msg.senderId._id === userId ? "sent" : "received"
                        }`}
                      >
                        <div className="message-bubble">
                          <p>{msg.message}</p>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form className="message-input" onSubmit={sendMessage}>
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleTyping}
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? "📤" : "➤"}
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-state">
                  <span className="empty-icon">💬</span>
                  <h3>Select a conversation</h3>
                  <p>Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MessagesPage;

