// server/models/AuditLog.model.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
   {
      admin: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      action: {
         type: String,
         enum: [
            "admin_login",
            "admin_logout",
            "ban_user",
            "unban_user",
            "delete_user",
            "change_role",
            "verify_user",
            "warn_user",
            "reset_warnings",
            "delete_performance",
            "force_end_performance",
            "delete_comment",
            "pin_comment",
            "update_banned_words",
            "reset_leaderboard",
            "refresh_leaderboard",
            "kick_from_room",
            "change_password",
         ],
         required: true,
      },
      targetType: {
         type: String,
         enum: ["user", "performance", "comment", "leaderboard", "system"],
         required: true,
      },
      targetId: {
         type: mongoose.Schema.Types.ObjectId,
      },
      details: {
         type: mongoose.Schema.Types.Mixed,
      },
      ip: {
         type: String,
      },
      userAgent: {
         type: String,
      },
   },
   {
      timestamps: true,
   },
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
