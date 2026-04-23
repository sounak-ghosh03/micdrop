import { io } from "socket.io-client";
import { getToken } from "../utils/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** Singleton socket instance */
let socket = null;

/**
 * Get the shared socket instance (creates it once).
 * The socket starts disconnected — call connectSocket() to open the connection.
 * @returns {import("socket.io-client").Socket}
 */
export const getSocket = () => {
   if (!socket) {
      socket = io(API_URL, {
         autoConnect: false,
         withCredentials: true,
         transports: ["websocket", "polling"],
      });
   }
   return socket;
};

/**
 * Connect (or re-connect) the socket, injecting the current JWT.
 * Safe to call multiple times — only opens one connection.
 * @param {string|null} [token]  Override token (defaults to localStorage)
 * @returns {import("socket.io-client").Socket}
 */
export const connectSocket = (token) => {
   const s = getSocket();
   const t = token ?? getToken();
   if (t) s.auth = { token: t };
   if (!s.connected) s.connect();
   return s;
};

/**
 * Disconnect the socket if it is currently connected.
 */
export const disconnectSocket = () => {
   if (socket?.connected) socket.disconnect();
};

// ─── Room helpers ─────────────────────────────────────────────────────────────

/**
 * Join the Socket.IO room for a specific performance.
 * The server will start forwarding room-scoped events (comments, reactions, etc.)
 * @param {string} performanceId
 */
export const joinPerformanceRoom = (performanceId) => {
   getSocket().emit("join-performance", performanceId);
};

/**
 * Leave the performance room on cleanup.
 * @param {string} performanceId
 */
export const leavePerformanceRoom = (performanceId) => {
   getSocket().emit("leave-performance", performanceId);
};
