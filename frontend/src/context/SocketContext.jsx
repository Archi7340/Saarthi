import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Use user._id as dependency — not the whole user object (avoids infinite loop)
  const userId = user?._id;

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("saarthi_token");
    if (!token) return;

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      console.log(`Socket connected: ${newSocket.id} | user: ${userId}`);
      setConnected(true);
    });

    // Debug: log ALL incoming events to confirm socket is receiving
    newSocket.onAny((event, ...args) => {
      console.log(`[Socket IN] event: ${event}`, args);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket auth error:", err.message);
      // Don't retry if auth failed — bad token
      if (err.message === "Authentication failed" || err.message === "No token provided") {
        newSocket.close();
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [userId]); // ← only re-run when user ID changes, not whole user object

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};