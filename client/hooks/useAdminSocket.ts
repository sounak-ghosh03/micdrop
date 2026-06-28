"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getAdminToken } from "../utils/adminHelpers";

const WS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface LiveRoom {
   performanceId: string;
   viewers: number;
}

interface AdminSocketState {
   connected: boolean;
   liveRooms: LiveRoom[];
   recentEvents: Array<{ type: string; payload: unknown; at: number }>;
   kickUser: (userId: string, performanceId: string) => void;
   forceEndPerformance: (performanceId: string) => void;
   refreshLiveRooms: () => void;
}

export function useAdminSocket(): AdminSocketState {
   const socketRef = useRef<Socket | null>(null);
   const [connected, setConnected] = useState(false);
   const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
   const [recentEvents, setRecentEvents] = useState<
      Array<{ type: string; payload: unknown; at: number }>
   >([]);

   const pushEvent = useCallback((type: string, payload: unknown) => {
      setRecentEvents((prev) =>
         [{ type, payload, at: Date.now() }, ...prev].slice(0, 50),
      );
   }, []);

   useEffect(() => {
      const token = getAdminToken();
      if (!token) return;

      const socket = io(`${WS_URL}/admin`, {
         auth: { token },
         transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => {
         setConnected(true);
         // Request initial live rooms snapshot
         socket.emit("admin:get-all-live-rooms");
      });

      socket.on("disconnect", () => setConnected(false));

      // Live room snapshot
      socket.on(
         "admin:live-rooms-snapshot",
         ({ rooms }: { rooms: LiveRoom[] }) => {
            setLiveRooms(rooms);
         },
      );

      // Real-time viewer count updates
      socket.on(
         "admin:viewer-count-update",
         ({
            performanceId,
            viewerCount,
         }: {
            performanceId: string;
            viewerCount: number;
         }) => {
            setLiveRooms((prev) => {
               const existing = prev.find(
                  (r) => r.performanceId === performanceId,
               );
               if (existing) {
                  return prev.map((r) =>
                     r.performanceId === performanceId
                        ? { ...r, viewers: viewerCount }
                        : r,
                  );
               }
               if (viewerCount > 0) {
                  return [...prev, { performanceId, viewers: viewerCount }];
               }
               return prev.filter((r) => r.performanceId !== performanceId);
            });
         },
      );

      // User events
      socket.on("admin:user-connected", (payload) =>
         pushEvent("user_connected", payload),
      );
      socket.on("admin:user-disconnected", (payload) =>
         pushEvent("user_disconnected", payload),
      );
      socket.on("admin:user-banned", (payload) =>
         pushEvent("user_banned", payload),
      );
      socket.on("admin:user-kicked", (payload) =>
         pushEvent("user_kicked", payload),
      );

      // Performance events
      socket.on("admin:performance-started", (payload) =>
         pushEvent("performance_started", payload),
      );
      socket.on("admin:performance-ended", (payload) => {
         pushEvent("performance_ended", payload);
         setLiveRooms((prev) =>
            prev.filter((r) => r.performanceId !== payload.performanceId),
         );
      });

      return () => {
         socket.disconnect();
         socketRef.current = null;
      };
   }, [pushEvent]);

   const kickUser = useCallback((userId: string, performanceId: string) => {
      socketRef.current?.emit("admin:kick-user", { userId, performanceId });
   }, []);

   const forceEndPerformance = useCallback((performanceId: string) => {
      socketRef.current?.emit("admin:force-end-performance", { performanceId });
   }, []);

   const refreshLiveRooms = useCallback(() => {
      socketRef.current?.emit("admin:get-all-live-rooms");
   }, []);

   return {
      connected,
      liveRooms,
      recentEvents,
      kickUser,
      forceEndPerformance,
      refreshLiveRooms,
   };
}
