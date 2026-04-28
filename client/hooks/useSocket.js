"use client";

import { useEffect, useRef } from "react";
import {
   connectSocket,
   disconnectSocket,
   joinPerformanceRoom,
   leavePerformanceRoom,
   getSocket,
} from "../services/socket";

/**
 * useSocket — manages Socket.IO connection lifecycle and real-time event listeners.
 *
 * @param {object} options
 * @param {string|null}  options.token            JWT token for auth
 * @param {string|null}  options.performanceId    Auto-join this room on mount
 * @param {Function}     [options.onCommentNew]   comment:new  → (comment) => void
 * @param {Function}     [options.onCommentDeleted] comment:deleted → ({ commentId }) => void
 * @param {Function}     [options.onCommentLiked]  comment:liked → ({ commentId, likes }) => void
 * @param {Function}     [options.onCommentPinned] comment:pinned → ({ commentId }) => void
 * @param {Function}     [options.onCommentUnpinned] comment:unpinned → ({ commentId }) => void
 * @param {Function}     [options.onReactionNew]   reaction:new → ({ performanceId, type, value }) => void
 * @param {Function}     [options.onPerformanceLive]  performance:live → (performance) => void
 * @param {Function}     [options.onPerformanceEnded] performance:ended → (performance) => void
 *
 * @returns {import("socket.io-client").Socket|null}
 */
const useSocket = ({
   token = null,
   performanceId = null,
   onCommentNew,
   onCommentDeleted,
   onCommentLiked,
   onCommentPinned,
   onCommentUnpinned,
   onReactionNew,
   onPerformanceLive,
   onPerformanceEnded,
} = {}) => {
   const socketRef = useRef(null);

   useEffect(() => {
      // Connect / reconnect with the latest token
      const socket = connectSocket(token);
      socketRef.current = socket;

      // Join performance room if id provided
      if (performanceId) joinPerformanceRoom(performanceId);

      // Register event listeners
      if (onCommentNew) socket.on("comment:new", onCommentNew);
      if (onCommentDeleted) socket.on("comment:deleted", onCommentDeleted);
      if (onCommentLiked) socket.on("comment:liked", onCommentLiked);
      if (onCommentPinned) socket.on("comment:pinned", onCommentPinned);
      if (onCommentUnpinned) socket.on("comment:unpinned", onCommentUnpinned);
      if (onReactionNew) socket.on("reaction:new", onReactionNew);
      if (onPerformanceLive) socket.on("performance:live", onPerformanceLive);
      if (onPerformanceEnded)
         socket.on("performance:ended", onPerformanceEnded);

      return () => {
         // Leave room
         if (performanceId) leavePerformanceRoom(performanceId);

         // Clean up listeners (prevents duplicate listeners on re-mount)
         if (onCommentNew) socket.off("comment:new", onCommentNew);
         if (onCommentDeleted) socket.off("comment:deleted", onCommentDeleted);
         if (onCommentLiked) socket.off("comment:liked", onCommentLiked);
         if (onCommentPinned) socket.off("comment:pinned", onCommentPinned);
         if (onCommentUnpinned)
            socket.off("comment:unpinned", onCommentUnpinned);
         if (onReactionNew) socket.off("reaction:new", onReactionNew);
         if (onPerformanceLive)
            socket.off("performance:live", onPerformanceLive);
         if (onPerformanceEnded)
            socket.off("performance:ended", onPerformanceEnded);
      };
      // We intentionally only re-run when performanceId or token changes.
      // Callback refs are stable through useCallback at call site.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [performanceId, token]);

   return (
      socketRef.current ?? (typeof window !== "undefined" ? getSocket() : null)
   );
};

export default useSocket;
