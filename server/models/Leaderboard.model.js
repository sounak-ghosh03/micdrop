import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema(
   {
      period: {
         type: String,
         enum: ["DAILY", "WEEKLY", "ALL_TIME"],
         required: true,
         index: true,
      },

      creator: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },

      score: {
         type: Number,
         required: true,
         default: 0,
      },

      breakdown: {
         totalViews: { type: Number, default: 0 },
         totalReactions: { type: Number, default: 0 },
         applauseCount: { type: Number, default: 0 },
         performancesCount: { type: Number, default: 0 },
      },

      rank: {
         type: Number,
         index: true,
      },
   },
   {
      timestamps: true,
   }
);

// Ensure one entry per creator per period
leaderboardSchema.index({ period: 1, creator: 1 }, { unique: true });

export const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
