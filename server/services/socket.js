import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import {
   joinRoom,
   leaveRoom,
   removeUserFromAllRooms,
   getViewerCount,
   registerBroadcaster,
   getBroadcasterSocketId,
   removeBroadcasterBySocketId,
} from "./liveRoom.js";
import { refreshCreatorScore, recomputeRanks } from "./leaderboard.js";

/*
   JWT handshake middleware
   Clients must send:  { auth: { token: "<JWT>" } }
   Unauthenticated guests are rejected at the gate.
*/
const authHandshake = async (socket, next) => {
   try {
      const token = socket.handshake.auth?.token;

      if (!token) {
         return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select(
         "username avatar role isBanned",
      );

      if (!user) return next(new Error("User not found"));
      if (user.isBanned) return next(new Error("Account is banned"));

      // Attach user to socket so every handler can read socket.user
      socket.user = {
         id: user._id.toString(),
         username: user.username,
         avatar: user.avatar,
         role: user.role,
      };

      next();
   } catch {
      next(new Error("Invalid or expired token"));
   }
};

/*
   Per-socket event handlers
*/

// Handle a user joining a performance room.
//
// Emits back to the joining socket:
//   "room:joined"  → { performanceId, viewerCount }
//
// Broadcasts to the room:
//   "room:viewer-count" → { performanceId, viewerCount }
const handleJoinPerformance = async (socket, io, performanceId) => {
   if (!performanceId) return;

   const pid = performanceId.toString();

   socket.join(pid);

   const viewerCount = joinRoom(pid, socket.user.id);

   // Acknowledge the joining socket
   socket.emit("room:joined", { performanceId: pid, viewerCount });

   // Broadcast updated count to everyone in the room (including sender)
   io.to(pid).emit("room:viewer-count", { performanceId: pid, viewerCount });
};

// Handle a user explicitly leaving a performance room.
//
// Broadcasts to the room:
//   "room:viewer-count" → { performanceId, viewerCount }
const handleLeavePerformance = (socket, io, performanceId) => {
   if (!performanceId) return;

   const pid = performanceId.toString();

   socket.leave(pid);

   const viewerCount = leaveRoom(pid, socket.user.id);

   io.to(pid).emit("room:viewer-count", { performanceId: pid, viewerCount });
};

// Handle socket disconnection.
// Removes user from every room they were in and broadcasts updated counts.
//
// Also triggers a leaderboard score refresh + rank recompute for any
// performance rooms that just lost viewers (lightweight, fire-and-forget).
const handleDisconnect = async (socket, io) => {
   // viewer registry cleanup
   const affected = removeUserFromAllRooms(socket.user.id);

   for (const [performanceId, viewerCount] of affected.entries()) {
      io.to(performanceId).emit("room:viewer-count", {
         performanceId,
         viewerCount,
      });
   }

   // broadcaster registry cleanup
   // If this socket was streaming for any room, notify all viewers so they
   // can update their UI (stream ended unexpectedly).
   const broadcastRooms = removeBroadcasterBySocketId(socket.id);
   for (const performanceId of broadcastRooms) {
      io.to(performanceId).emit("webrtc:broadcaster-left", { performanceId });
   }
};

// Handle a performer triggering a leaderboard refresh after their
// performance ends. Clients emit "leaderboard:refresh" with their
// creatorId so scores and ranks are immediately updated.
//
// Only performer / admin roles are permitted.
//
// Broadcasts to all connected clients:
//   "leaderboard:updated" → { period }  (once per period)
const handleLeaderboardRefresh = async (socket, io, creatorId) => {
   if (!["performer", "admin"].includes(socket.user.role)) {
      socket.emit("error", { message: "Not authorized" });
      return;
   }

   const targetId = creatorId?.toString() ?? socket.user.id;

   try {
      await refreshCreatorScore(targetId);

      for (const period of ["DAILY", "WEEKLY", "ALL_TIME"]) {
         await recomputeRanks(period);
         io.emit("leaderboard:updated", { period });
      }
   } catch (err) {
      console.error("[socket] handleLeaderboardRefresh error:", err);
      socket.emit("error", { message: "Leaderboard refresh failed" });
   }
};

/* 
   Main initialiser — call once from index.js
 */

// Attach a Socket.IO server to an existing http.Server and wire it
// into the Express app so controllers can do `req.app.get("io")`.
//
// @param httpServer  – the raw Node http server
// @param app         – the Express app instance
// @returns the Socket.IO server
export const initSocket = (httpServer, app) => {
   const io = new Server(httpServer, {
      cors: {
         origin: process.env.CLIENT_URL,
         methods: ["GET", "POST"],
         credentials: true,
      },
      // Tune transports for reliability; fall back to long-polling
      transports: ["websocket", "polling"],
      // Heartbeat settings
      pingInterval: 25000,
      pingTimeout: 20000,
   });

   // Make `io` available to every Express route handler via
   // req.app.get("io")  — this is what the existing controllers already use
   app.set("io", io);

   // Apply JWT auth middleware to every incoming connection
   io.use(authHandshake);

   io.on("connection", (socket) => {
      console.log(
         `[socket] connected  user=${socket.user.username}  id=${socket.id}`,
      );

      /* room management */

      socket.on("join-performance", (performanceId) => {
         handleJoinPerformance(socket, io, performanceId);
      });

      socket.on("leave-performance", (performanceId) => {
         handleLeavePerformance(socket, io, performanceId);
      });

      /* leaderboard */

      socket.on("leaderboard:refresh", (creatorId) => {
         handleLeaderboardRefresh(socket, io, creatorId);
      });

      /* viewer count probe (for admin dashboards)*/

      socket.on("room:viewer-count:get", (performanceId) => {
         if (!performanceId) return;
         const viewerCount = getViewerCount(performanceId.toString());
         socket.emit("room:viewer-count", {
            performanceId: performanceId.toString(),
            viewerCount,
         });
      });

      /* disconnect*/

      socket.on("disconnect", (reason) => {
         console.log(
            `[socket] disconnected  user=${socket.user.username}  reason=${reason}`,
         );
         handleDisconnect(socket, io);
      });

      /* WebRTC signaling
         Socket.IO is used exclusively as the signaling channel.
         All SDP offers/answers and ICE candidates are relayed here;
         the actual media stream travels directly between peers via WebRTC.
       */

      // Broadcaster announces it is ready to stream.
      // Stored in the registry and relayed to existing room members so they
      // can immediately request an offer.
      socket.on("webrtc:broadcaster-ready", (performanceId) => {
         if (!performanceId) return;
         const pid = performanceId.toString();
         registerBroadcaster(pid, socket.id);
         console.log(
            `[webrtc] broadcaster-ready  room=${pid}  socket=${socket.id}`,
         );

         // Notify viewers already in the room
         socket.to(pid).emit("webrtc:broadcaster-ready", {
            performanceId: pid,
            broadcasterSocketId: socket.id,
         });
      });

      // Viewer signals it wants to receive the stream.
      // Routed to the broadcaster so they can initiate the offer.
      socket.on("webrtc:viewer-ready", ({ performanceId } = {}) => {
         if (!performanceId) return;
         const pid = performanceId.toString();
         const broadcasterSocketId = getBroadcasterSocketId(pid);

         if (!broadcasterSocketId) return; // broadcaster not yet live; they'll emit broadcaster-ready later

         io.to(broadcasterSocketId).emit("webrtc:viewer-ready", {
            performanceId: pid,
            viewerSocketId: socket.id,
         });
      });

      // Relay SDP offer — broadcaster → specific viewer.
      socket.on(
         "webrtc:offer",
         ({ targetSocketId, performanceId, sdp } = {}) => {
            if (!targetSocketId || !sdp) return;
            io.to(targetSocketId).emit("webrtc:offer", {
               performanceId,
               sdp,
               fromSocketId: socket.id,
            });
         },
      );

      // Relay SDP answer — viewer → broadcaster.
      socket.on(
         "webrtc:answer",
         ({ targetSocketId, performanceId, sdp } = {}) => {
            if (!targetSocketId || !sdp) return;
            io.to(targetSocketId).emit("webrtc:answer", {
               performanceId,
               sdp,
               fromSocketId: socket.id,
            });
         },
      );

      // Relay ICE candidate — bidirectional between broadcaster and viewer.
      socket.on(
         "webrtc:ice-candidate",
         ({ targetSocketId, performanceId, candidate } = {}) => {
            if (!targetSocketId || !candidate) return;
            io.to(targetSocketId).emit("webrtc:ice-candidate", {
               performanceId,
               candidate,
               fromSocketId: socket.id,
            });
         },
      );
   });

   return io;
};
