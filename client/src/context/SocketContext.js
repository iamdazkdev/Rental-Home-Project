import React, {createContext, useContext, useEffect, useState} from "react";
import {io} from "socket.io-client";
import {useSelector} from "react-redux";
import API_BASE_URL from "../config/api";

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({children}) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const user = useSelector((state) => state.user.profile);
    const userId = user?._id || user?.id;

    useEffect(() => {
        if (userId) {
            const newSocket = io(API_BASE_URL, {
                transports: ["websocket", "polling"],
            });

            newSocket.on("connect", () => {
                console.log("✅ Socket connected:", newSocket.id);

                // Emit user online event
                newSocket.emit("user_online", userId);
            });

            newSocket.on("user_status_change", ({userId: changedUserId, status}) => {
                setOnlineUsers((prev) => {
                    const updated = new Set(prev);
                    if (status === "online") {
                        updated.add(changedUserId);
                    } else {
                        updated.delete(changedUserId);
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
    }, [userId]);

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

