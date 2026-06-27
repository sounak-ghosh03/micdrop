import express from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import {
   getAdminStats,
   getAllUsers,
   getUserDetail,
   banUser,
   unbanUser,
   deleteUser,
   changeUserRole,
   verifyUser,
   warnUser,
   resetWarnings,
   getAllPerformances,
   deletePerformance,
   forceEndPerformance,
   getAllComments,
   deleteComment,
   pinComment,
   refreshLeaderboard,
   resetLeaderboard,
   getBannedWords,
   updateBannedWords,
   getAuditLogs,
   getLiveRooms,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes require ADMIN_JWT_SECRET-signed token + admin DB role
router.use(adminAuthMiddleware);

// Dashboard
router.get("/stats", getAdminStats);

// Users
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/role", changeUserRole);
router.patch("/users/:id/verify", verifyUser);
router.patch("/users/:id/warn", warnUser);
router.patch("/users/:id/reset-warnings", resetWarnings);

// Performances
router.get("/performances", getAllPerformances);
router.delete("/performances/:id", deletePerformance);
router.patch("/performances/:id/force-end", forceEndPerformance);

// Comments
router.get("/comments", getAllComments);
router.delete("/comments/:id", deleteComment);
router.patch("/comments/:id/pin", pinComment);

// Leaderboard
router.post("/leaderboard/refresh", refreshLeaderboard);
router.delete("/leaderboard/reset", resetLeaderboard);

// Moderation settings
router.get("/moderation/banned-words", getBannedWords);
router.patch("/moderation/banned-words", updateBannedWords);

// Audit logs
router.get("/audit-logs", getAuditLogs);

// Live rooms
router.get("/live-rooms", getLiveRooms);

export default router;
