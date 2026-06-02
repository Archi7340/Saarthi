import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

/**
 * Custom hook to listen to socket events cleanly.
 * Automatically removes listener on unmount.
 * Safe to call even when socket is not yet connected.
 */
const useSocketEvent = (event, handler) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !event || !handler) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, event, handler]);
};

export default useSocketEvent;