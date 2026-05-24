import { Comment } from "../models/Comment.model.js";
import { Performance } from "../models/Performance.model.js";
import { moderateComment } from "../services/moderation.services.js";

// CREATE COMMENT POST /api/comments
export const createComment = async (req, res) => {
   try {
      const { performanceId, text } = req.body;

      if (!performanceId || !text) {
         return res.status(400).json({
            message: "Performance ID and comment text required",
         });
      }

      // Check performance exists
      const performance = await Performance.findById(performanceId);

      if (!performance) {
         return res.status(404).json({
            message: "Performance not found",
         });
      }

      // Moderation check
      const result = await moderateComment(req.user.id, text);

      if (!result.allowed) {
         return res.status(400).json({
            message: result.reason,
         });
      }

      // Create comment
      const comment = await Comment.create({
         user: req.user.id,
         performance: performanceId,
         text: result.sanitizedText,
      });

      const populatedComment = await Comment.findById(comment._id)
         .populate("user", "username avatar");

      // Keep performance comment count in sync
      await Performance.findByIdAndUpdate(performanceId, {
         $inc: { "stats.commentCount": 1 },
      });

      // Realtime emit
      req.app
         .get("io")
         .to(performanceId.toString())
         .emit("comment:new", populatedComment);

      res.status(201).json(populatedComment);

   } catch (error) {
      res.status(500).json({
         message: "Failed to create comment",
      });
   }
};

// GET COMMENTS GET /api/comments/:performanceId
export const getComments = async (req, res) => {
   try {
      const comments = await Comment.find({
         performance: req.params.performanceId,
         isDeleted: false,
      })
         .populate("user", "username avatar")
         .sort({ pinned: -1, createdAt: -1 });

      res.json(comments);

   } catch (error) {
      res.status(500).json({
         message: "Failed to fetch comments",
      });
   }
};

// DELETE COMMENT DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
   try {
      const comment = await Comment.findById(req.params.id);

      if (!comment || comment.isDeleted) {
         return res.status(404).json({
            message: "Comment not found",
         });
      }

      // Only owner or admin can delete
      if (
         comment.user.toString() !== req.user.id &&
         req.user.role !== "admin"
      ) {
         return res.status(403).json({
            message: "Not authorized",
         });
      }

      comment.isDeleted = true;
      await comment.save();

      req.app
         .get("io")
         .to(comment.performance.toString())
         .emit("comment:deleted", {
            commentId: comment._id,
         });

      res.json({
         message: "Comment deleted successfully",
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to delete comment",
      });
   }
};

// LIKE COMMENT PATCH /api/comments/:id/like
export const likeComment = async (req, res) => {
   try {
      const comment = await Comment.findById(req.params.id);

      if (!comment || comment.isDeleted) {
         return res.status(404).json({
            message: "Comment not found",
         });
      }

      comment.likes += 1;
      await comment.save();

      req.app
         .get("io")
         .to(comment.performance.toString())
         .emit("comment:liked", {
            commentId: comment._id,
            likes: comment.likes,
         });

      res.json({
         message: "Comment liked",
         likes: comment.likes,
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to like comment",
      });
   }
};

// PIN COMMENT PATCH /api/comments/:id/pin
export const pinComment = async (req, res) => {
   try {
      const comment = await Comment.findById(req.params.id);

      if (!comment || comment.isDeleted) {
         return res.status(404).json({
            message: "Comment not found",
         });
      }

      // Only performer or admin can pin
      if (
         req.user.role !== "performer" &&
         req.user.role !== "admin"
      ) {
         return res.status(403).json({
            message: "Not authorized to pin comment",
         });
      }

      comment.pinned = true;
      await comment.save();

      req.app
         .get("io")
         .to(comment.performance.toString())
         .emit("comment:pinned", {
            commentId: comment._id,
         });

      res.json({
         message: "Comment pinned successfully",
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to pin comment",
      });
   }
};

// UNPIN COMMENT PATCH /api/comments/:id/unpin
export const unpinComment = async (req, res) => {
   try {
      const comment = await Comment.findById(req.params.id);

      if (!comment || comment.isDeleted) {
         return res.status(404).json({
            message: "Comment not found",
         });
      }

      if (
         req.user.role !== "performer" &&
         req.user.role !== "admin"
      ) {
         return res.status(403).json({
            message: "Not authorized to unpin comment",
         });
      }

      comment.pinned = false;
      await comment.save();

      req.app
         .get("io")
         .to(comment.performance.toString())
         .emit("comment:unpinned", {
            commentId: comment._id,
         });

      res.json({
         message: "Comment unpinned successfully",
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to unpin comment",
      });
   }
};
