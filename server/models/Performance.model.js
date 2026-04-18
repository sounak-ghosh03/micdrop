import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
   {
      creator: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },

      title: {
         type: String,
         required: true,
         trim: true,
         maxlength: 120,
      },

      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },

      type: {
         type: String,
         enum: ["LIVE", "RECORDED"],
         required: true,
      },

      streamUrl: {
         type: String, // Live stream URL (WebRTC / RTMP)
      },

      videoUrl: {
         type: String, // Stored video for recorded performances
      },

      status: {
         type: String,
         enum: ["SCHEDULED", "LIVE", "ENDED"],
         default: "SCHEDULED",
      },

      startedAt: Date,
      endedAt: Date,

      stats: {
         viewers: { type: Number, default: 0 },
         totalReactions: { type: Number, default: 0 },
         applauseCount: { type: Number, default: 0 },
         commentCount: { type: Number, default: 0 },
      },

      isDeleted: {
         type: Boolean,
         default: false,
      },
   },
   {
      timestamps: true,
   }
);

export const Performance = mongoose.model("Performance", performanceSchema);
