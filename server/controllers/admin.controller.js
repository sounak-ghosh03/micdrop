import mongoose from "mongoose";
import { User } from "../models/User.model.js";
import { Performance } from "../models/Performance.model.js";
import { Comment } from "../models/Comment.model.js";
import { Reaction } from "../models/Reaction.model.js";
import { Leaderboard } from "../models/Leaderboard.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import {
   refreshCreatorScore,
   recomputeRanks,
} from "../services/leaderboard.js";
import {
   incrementWarning,
   getBannedWordsList,
   setBannedWords,
} from "../services/moderation.services.js";
import { getViewerCount, getAllRooms } from "../services/liveRoom.js";

const log = (adminId, action, targetType, targetId, details, req) =>
   AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
   }).catch(() => { });

// Dashboard 

export const getAdminStats = async (req, res) => {
   try {
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const [
         totalUsers,
         totalPerformers,
         totalAudience,
         totalAdmins,
         bannedUsers,
         verifiedUsers,
         totalPerformances,
         livePerformances,
         totalComments,
         totalReactions,
         newUsersToday,
         newUsersThisWeek,
      ] = await Promise.all([
         User.countDocuments(),
         User.countDocuments({ role: "performer" }),
         User.countDocuments({ role: "audience" }),
         User.countDocuments({ role: "admin" }),
         User.countDocuments({ isBanned: true }),
         User.countDocuments({ isVerified: true }),
         Performance.countDocuments({ isDeleted: false }),
         Performance.countDocuments({ status: "LIVE", isDeleted: false }),
         Comment.countDocuments({ isDeleted: false }),
         Reaction.countDocuments(),
         User.countDocuments({ createdAt: { $gte: startOfToday } }),
         User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      ]);

      const liveRooms = getAllRooms ? getAllRooms() : [];

      return res.json({
         users: {
            total: totalUsers,
            performers: totalPerformers,
            audience: totalAudience,
            admins: totalAdmins,
            banned: bannedUsers,
            verified: verifiedUsers,
            newToday: newUsersToday,
            newThisWeek: newUsersThisWeek,
         },
         performances: { total: totalPerformances, live: livePerformances },
         engagement: {
            totalComments,
            totalReactions,
            activeRooms: liveRooms.length,
         },
      });
   } catch (error) {
      console.error("[getAdminStats]", error);
      return res.status(500).json({ message: "Failed to fetch stats" });
   }
};

// Users 

export const getAllUsers = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         role,
         isBanned,
         isVerified,
         q,
         sortBy = "createdAt",
         sortOrder = "desc",
      } = req.query;

      const filter = {};
      if (role) filter.role = role;
      if (isBanned !== undefined) filter.isBanned = isBanned === "true";
      if (isVerified !== undefined) filter.isVerified = isVerified === "true";
      if (q) filter.username = { $regex: q, $options: "i" };

      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
         User.find(filter)
            .select("-password")
            .sort(sort)
            .skip(skip)
            .limit(Number(limit)),
         User.countDocuments(filter),
      ]);

      return res.json({
         users,
         pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
         },
      });
   } catch {
      return res.status(500).json({ message: "Failed to fetch users" });
   }
};

export const getUserDetail = async (req, res) => {
   try {
      const user = await User.findById(req.params.id)
         .select("-password")
         .populate("followers", "username avatar role")
         .populate("following", "username avatar role");

      if (!user) return res.status(404).json({ message: "User not found" });

      const [performances, comments, reactionCount] = await Promise.all([
         Performance.find({ creator: user._id, isDeleted: false })
            .select("title status stats createdAt")
            .sort({ createdAt: -1 })
            .limit(20),
         Comment.find({ user: user._id, isDeleted: false })
            .select("text performance createdAt")
            .populate("performance", "title")
            .sort({ createdAt: -1 })
            .limit(20),
         Reaction.countDocuments({ user: user._id }),
      ]);

      return res.json({ user, performances, comments, reactionCount });
   } catch {
      return res.status(500).json({ message: "Failed to fetch user detail" });
   }
};

export const banUser = async (req, res) => {
   try {
      const { reason } = req.body;
      const user = await User.findByIdAndUpdate(
         req.params.id,
         { isBanned: true },
         { new: true },
      ).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(req.admin._id, "ban_user", "user", user._id, { reason }, req);

      const io = req.app.get("io");
      if (io)
         io.of("/admin").emit("admin:user-banned", {
            userId: user._id,
            username: user.username,
         });

      return res.json({ message: "User banned successfully", user });
   } catch {
      return res.status(500).json({ message: "Failed to ban user" });
   }
};

export const unbanUser = async (req, res) => {
   try {
      const user = await User.findByIdAndUpdate(
         req.params.id,
         { isBanned: false, warningsCount: 0 },
         { new: true },
      ).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(req.admin._id, "unban_user", "user", user._id, {}, req);

      return res.json({ message: "User unbanned successfully", user });
   } catch {
      return res.status(500).json({ message: "Failed to unban user" });
   }
};

export const deleteUser = async (req, res) => {
   try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.role === "admin") {
         return res
            .status(403)
            .json({ message: "Cannot delete another admin account" });
      }

      await Promise.all([
         Performance.updateMany({ creator: user._id }, { isDeleted: true }),
         Comment.updateMany({ user: user._id }, { isDeleted: true }),
         User.findByIdAndDelete(user._id),
      ]);

      log(
         req.admin._id,
         "delete_user",
         "user",
         user._id,
         { username: user.username, email: user.email },
         req,
      );

      return res.json({ message: "User and all content deleted successfully" });
   } catch {
      return res.status(500).json({ message: "Failed to delete user" });
   }
};

export const changeUserRole = async (req, res) => {
   try {
      const { role } = req.body;
      if (!["audience", "performer", "admin"].includes(role)) {
         return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
         req.params.id,
         { role },
         { new: true },
      ).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(
         req.admin._id,
         "change_role",
         "user",
         user._id,
         { newRole: role },
         req,
      );

      return res.json({ message: "Role updated successfully", user });
   } catch {
      return res.status(500).json({ message: "Failed to change role" });
   }
};

export const verifyUser = async (req, res) => {
   try {
      const user = await User.findByIdAndUpdate(
         req.params.id,
         { isVerified: true },
         { new: true },
      ).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(req.admin._id, "verify_user", "user", user._id, {}, req);

      return res.json({ message: "User verified successfully", user });
   } catch {
      return res.status(500).json({ message: "Failed to verify user" });
   }
};

export const warnUser = async (req, res) => {
   try {
      await incrementWarning(req.params.id);
      const user = await User.findById(req.params.id).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(
         req.admin._id,
         "warn_user",
         "user",
         user._id,
         {
            warningsCount: user.warningsCount,
            isBanned: user.isBanned,
         },
         req,
      );

      return res.json({
         message: "Warning issued",
         warningsCount: user.warningsCount,
         isBanned: user.isBanned,
      });
   } catch {
      return res.status(500).json({ message: "Failed to warn user" });
   }
};

export const resetWarnings = async (req, res) => {
   try {
      const user = await User.findByIdAndUpdate(
         req.params.id,
         { warningsCount: 0, isBanned: false },
         { new: true },
      ).select("-password");

      if (!user) return res.status(404).json({ message: "User not found" });

      log(req.admin._id, "reset_warnings", "user", user._id, {}, req);

      return res.json({ message: "Warnings reset successfully", user });
   } catch {
      return res.status(500).json({ message: "Failed to reset warnings" });
   }
};

// Performances

export const getAllPerformances = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 20,
         status,
         includeDeleted = "false",
         q,
      } = req.query;

      const filter = {};
      if (includeDeleted !== "true") filter.isDeleted = false;
      if (status) filter.status = status;
      if (q) filter.title = { $regex: q, $options: "i" };

      const skip = (Number(page) - 1) * Number(limit);

      const [performances, total] = await Promise.all([
         Performance.find(filter)
            .populate("creator", "username avatar role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
         Performance.countDocuments(filter),
      ]);

      return res.json({
         performances,
         pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
         },
      });
   } catch {
      return res.status(500).json({ message: "Failed to fetch performances" });
   }
};

export const deletePerformance = async (req, res) => {
   try {
      const performance = await Performance.findByIdAndUpdate(
         req.params.id,
         { isDeleted: true },
         { new: true },
      );

      if (!performance)
         return res.status(404).json({ message: "Performance not found" });

      log(
         req.admin._id,
         "delete_performance",
         "performance",
         performance._id,
         { title: performance.title },
         req,
      );

      return res.json({ message: "Performance deleted successfully" });
   } catch {
      return res.status(500).json({ message: "Failed to delete performance" });
   }
};

export const forceEndPerformance = async (req, res) => {
   try {
      const performance = await Performance.findOneAndUpdate(
         { _id: req.params.id, status: "LIVE" },
         { status: "ENDED", endedAt: new Date() },
         { new: true },
      ).populate("creator", "username avatar");

      if (!performance)
         return res
            .status(404)
            .json({ message: "No LIVE performance found with that ID" });

      const io = req.app.get("io");
      if (io) io.emit("performance:ended", performance);

      log(
         req.admin._id,
         "force_end_performance",
         "performance",
         performance._id,
         { title: performance.title },
         req,
      );

      return res.json({ message: "Performance force-ended", performance });
   } catch {
      return res
         .status(500)
         .json({ message: "Failed to force-end performance" });
   }
};

// Comments

export const getAllComments = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 30,
         performanceId,
         userId,
         includeDeleted = "false",
      } = req.query;

      const filter = {};
      if (includeDeleted !== "true") filter.isDeleted = false;
      if (performanceId) filter.performance = performanceId;
      if (userId) filter.user = userId;

      const skip = (Number(page) - 1) * Number(limit);

      const [comments, total] = await Promise.all([
         Comment.find(filter)
            .populate("user", "username avatar")
            .populate("performance", "title")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
         Comment.countDocuments(filter),
      ]);

      return res.json({
         comments,
         pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
         },
      });
   } catch {
      return res.status(500).json({ message: "Failed to fetch comments" });
   }
};

export const deleteComment = async (req, res) => {
   try {
      const comment = await Comment.findByIdAndUpdate(
         req.params.id,
         { isDeleted: true },
         { new: true },
      );

      if (!comment)
         return res.status(404).json({ message: "Comment not found" });

      log(
         req.admin._id,
         "delete_comment",
         "comment",
         comment._id,
         { text: comment.text.substring(0, 80) },
         req,
      );

      return res.json({ message: "Comment deleted successfully" });
   } catch {
      return res.status(500).json({ message: "Failed to delete comment" });
   }
};

export const pinComment = async (req, res) => {
   try {
      const comment = await Comment.findById(req.params.id);
      if (!comment)
         return res.status(404).json({ message: "Comment not found" });

      comment.pinned = !comment.pinned;
      await comment.save();

      log(
         req.admin._id,
         "pin_comment",
         "comment",
         comment._id,
         { pinned: comment.pinned },
         req,
      );

      return res.json({
         message: `Comment ${comment.pinned ? "pinned" : "unpinned"}`,
         comment,
      });
   } catch {
      return res.status(500).json({ message: "Failed to pin comment" });
   }
};

// Leaderboard

export const refreshLeaderboard = async (req, res) => {
   try {
      const performers = await User.find({ role: "performer" }).select("_id");

      for (const p of performers) await refreshCreatorScore(p._id.toString());
      for (const period of ["DAILY", "WEEKLY", "ALL_TIME"])
         await recomputeRanks(period);

      const io = req.app.get("io");
      if (io) {
         for (const period of ["DAILY", "WEEKLY", "ALL_TIME"]) {
            io.emit("leaderboard:updated", { period });
         }
      }

      log(req.admin._id, "refresh_leaderboard", "leaderboard", null, {}, req);

      return res.json({ message: "Leaderboard refreshed for all periods" });
   } catch {
      return res.status(500).json({ message: "Failed to refresh leaderboard" });
   }
};

export const resetLeaderboard = async (req, res) => {
   try {
      await Leaderboard.deleteMany({});
      log(req.admin._id, "reset_leaderboard", "leaderboard", null, {}, req);
      return res.json({ message: "Leaderboard reset successfully" });
   } catch {
      return res.status(500).json({ message: "Failed to reset leaderboard" });
   }
};

//  Moderation settings

export const getBannedWords = async (req, res) => {
   return res.json({ bannedWords: getBannedWordsList() });
};

export const updateBannedWords = async (req, res) => {
   try {
      const { bannedWords } = req.body;
      if (!Array.isArray(bannedWords)) {
         return res
            .status(400)
            .json({ message: "bannedWords must be an array" });
      }

      const cleaned = bannedWords.map((w) => w.toLowerCase().trim());
      setBannedWords(cleaned);
      log(
         req.admin._id,
         "update_banned_words",
         "system",
         null,
         { count: cleaned.length },
         req,
      );

      return res.json({
         message: "Banned words updated",
         bannedWords: getBannedWordsList(),
      });
   } catch {
      return res.status(500).json({ message: "Failed to update banned words" });
   }
};

// Audit logs

export const getAuditLogs = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 30,
         action,
         targetType,
         adminId,
         from,
         to,
      } = req.query;

      const filter = {};
      if (action) filter.action = action;
      if (targetType) filter.targetType = targetType;
      if (adminId) filter.admin = adminId;
      if (from || to) {
         filter.createdAt = {};
         if (from) filter.createdAt.$gte = new Date(from);
         if (to) filter.createdAt.$lte = new Date(to);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
         AuditLog.find(filter)
            .populate("admin", "username email avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
         AuditLog.countDocuments(filter),
      ]);

      return res.json({
         logs,
         pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
         },
      });
   } catch {
      return res.status(500).json({ message: "Failed to fetch audit logs" });
   }
};

// Live rooms

export const getLiveRooms = async (req, res) => {
   try {
      const livePerformances = await Performance.find({
         status: "LIVE",
         isDeleted: false,
      }).populate("creator", "username avatar");

      const rooms = livePerformances.map((p) => ({
         performanceId: p._id,
         title: p.title,
         creator: p.creator,
         startedAt: p.startedAt,
         viewerCount: getViewerCount ? getViewerCount(p._id.toString()) : 0,
      }));

      return res.json({ rooms });
   } catch {
      return res.status(500).json({ message: "Failed to fetch live rooms" });
   }
};
