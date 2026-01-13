import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
   {
      performance: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Performance",
         required: true,
         index: true,
      },

      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },

      type: {
         type: String,
         enum: ["LIKE", "APPLAUSE", "LOVE", "LAUGH", "WOW"],
         required: true,
      },

      value: {
         type: Number,
         default: 1, // Useful for later allow paid applause
      },
   },
   {
      timestamps: true,
   }
);

// Prevent spamming same reaction type rapidly
reactionSchema.index({ performance: 1, user: 1, type: 1 }, { unique: false });

export const Reaction = mongoose.model("Reaction", reactionSchema);
