import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:3001", {
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);

        // Emit user online event
        const userId = user._id || user.id;
        if (userId) {
          newSocket.emit("user_online", userId);
        }
      });

      newSocket.on("user_status_change", ({ userId, status }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status === "online") {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.has(userId),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

