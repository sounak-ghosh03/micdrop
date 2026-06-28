import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import {
   joinRoom,
   leaveRoom,
   removeUserFromAllRooms,
   getViewerCount,
   getRoomSnapshot,
   registerBroadcaster,
   getBroadcasterSocketId,
   removeBroadcasterBySocketId,
} from "./liveRoom.js";
import { refreshCreatorScore, recomputeRanks } from "./leaderboard.js";
import { Performance } from "../models/Performance.model.js";

// Handshake middleware — clients must send { auth: { token } }; bans are rejected
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

// Admin handshake — verifies ADMIN_JWT_SECRET + isAdminToken claim
const adminAuthHandshake = async (socket, next) => {
   try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Admin token required"));

      let decoded;
      try {
         decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      } catch {
         return next(new Error("Invalid or expired admin token"));
      }

      if (!decoded.isAdminToken) return next(new Error("Not an admin token"));

      const admin = await User.findById(decoded.id).select(
         "username avatar role isBanned",
      );

      if (!admin || admin.role !== "admin")
         return next(new Error("Admin access denied"));
      if (admin.isBanned) return next(new Error("Admin account suspended"));

      socket.admin = {
         id: admin._id.toString(),
         username: admin.username,
         avatar: admin.avatar,
      };

      next();
   } catch {
      next(new Error("Invalid or expired admin token"));
   }
};

const handleJoinPerformance = async (socket, io, performanceId) => {
   if (!performanceId) return;

   const pid = performanceId.toString();

   socket.join(pid);

   const viewerCount = joinRoom(pid, socket.user.id);

   socket.emit("room:joined", { performanceId: pid, viewerCount });
   io.to(pid).emit("room:viewer-count", { performanceId: pid, viewerCount });

   io.of("/admin").emit("admin:viewer-count-update", {
      performanceId: pid,
      viewerCount,
   });
};

const handleLeavePerformance = (socket, io, performanceId) => {
   if (!performanceId) return;

   const pid = performanceId.toString();

   socket.leave(pid);

   const viewerCount = leaveRoom(pid, socket.user.id);

   io.to(pid).emit("room:viewer-count", { performanceId: pid, viewerCount });

   io.of("/admin").emit("admin:viewer-count-update", {
      performanceId: pid,
      viewerCount,
   });
};

const handleDisconnect = async (socket, io) => {
   const affected = removeUserFromAllRooms(socket.user.id);

   for (const [performanceId, viewerCount] of affected.entries()) {
      io.to(performanceId).emit("room:viewer-count", {
         performanceId,
         viewerCount,
      });
   }

   const broadcastRooms = removeBroadcasterBySocketId(socket.id);
   for (const performanceId of broadcastRooms) {
      io.to(performanceId).emit("webrtc:broadcaster-left", { performanceId });
   }

   io.of("/admin").emit("admin:user-disconnected", {
      userId: socket.user.id,
      username: socket.user.username,
   });
};

// Performer/admin only — refreshes scores + recomputes ranks for all periods
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

// Attaches Socket.IO to the http server; makes io available via req.app.get("io")
export const initSocket = (httpServer, app) => {
   const io = new Server(httpServer, {
      cors: {
         origin: process.env.CLIENT_URL,
         methods: ["GET", "POST"],
         credentials: true,
      },
      transports: ["websocket", "polling"],
      pingInterval: 25000,
      pingTimeout: 20000,
   });

   app.set("io", io);
   io.use(authHandshake);

   io.on("connection", (socket) => {
      console.log(
         `[socket] connected  user=${socket.user.username}  id=${socket.id}`,
      );

      io.of("/admin").emit("admin:user-connected", {
         userId: socket.user.id,
         username: socket.user.username,
         role: socket.user.role,
      });

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

      /* viewer count probe */

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

      /* WebRTC signaling — Socket.IO relays SDP/ICE; media goes peer-to-peer */

      socket.on("webrtc:broadcaster-ready", (performanceId) => {
         if (!performanceId) return;
         const pid = performanceId.toString();
         registerBroadcaster(pid, socket.id);
         console.log(
            `[webrtc] broadcaster-ready  room=${pid}  socket=${socket.id}`,
         );

         socket.to(pid).emit("webrtc:broadcaster-ready", {
            performanceId: pid,
            broadcasterSocketId: socket.id,
         });

         io.of("/admin").emit("admin:performance-started", {
            performanceId: pid,
            broadcasterUsername: socket.user.username,
         });
      });

      socket.on("webrtc:viewer-ready", ({ performanceId } = {}) => {
         if (!performanceId) return;
         const pid = performanceId.toString();
         const broadcasterSocketId = getBroadcasterSocketId(pid);

         if (!broadcasterSocketId) return;

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

   // /admin namespace — only admin JWTs accepted
   const adminNs = io.of("/admin");
   adminNs.use(adminAuthHandshake);

   adminNs.on("connection", (socket) => {
      console.log(
         `[admin-socket] connected  admin=${socket.admin.username}  id=${socket.id}`,
      );

      // ── Get snapshot of all live rooms ─────────────────────────────────
      socket.on("admin:get-all-live-rooms", () => {
         const rooms = getRoomSnapshot();
         socket.emit("admin:live-rooms-snapshot", { rooms });
      });

      // ── Kick a user from a live room ───────────────────────────────────
      socket.on("admin:kick-user", async ({ userId, performanceId }) => {
         if (!userId || !performanceId) return;
         const pid = performanceId.toString();

         const sockets = await io.fetchSockets();
         for (const s of sockets) {
            if (s.data?.user?.id === userId || s.user?.id === userId) {
               s.emit("room:kicked", {
                  performanceId: pid,
                  reason: "Removed by admin",
               });
               s.leave(pid);
               break;
            }
         }

         console.log(`[admin-socket] kicked user=${userId} from room=${pid}`);
         adminNs.emit("admin:user-kicked", { userId, performanceId: pid });
      });

      // ── Force-end a live performance ───────────────────────────────────
      socket.on("admin:force-end-performance", async ({ performanceId }) => {
         if (!performanceId) return;
         const pid = performanceId.toString();

         try {
            const performance = await Performance.findOneAndUpdate(
               { _id: pid, status: "LIVE" },
               { status: "ENDED", endedAt: new Date() },
               { new: true },
            ).populate("creator", "username avatar");

            if (!performance) {
               socket.emit("error", { message: "No LIVE performance found" });
               return;
            }

            io.to(pid).emit("performance:ended", performance);
            adminNs.emit("admin:performance-ended", {
               performanceId: pid,
               title: performance.title,
            });

            console.log(`[admin-socket] force-ended performance=${pid}`);
         } catch (err) {
            console.error("[admin-socket] force-end error:", err);
            socket.emit("error", {
               message: "Failed to force-end performance",
            });
         }
      });

      // ── Monitor a specific room (silent observer) ──────────────────────
      socket.on("admin:monitor-room", ({ performanceId }) => {
         if (!performanceId) return;
         socket.join(performanceId.toString());
         socket.emit("admin:monitoring", { performanceId });
      });

      socket.on("disconnect", () => {
         console.log(
            `[admin-socket] disconnected  admin=${socket.admin.username}`,
         );
      });
   });

   return io;
};
