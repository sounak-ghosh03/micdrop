import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // User who posted the comment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Performance or live session where comment was posted
    performance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Performance",
      required: true,
    },

    // Comment text
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Number of likes on the comment
    likes: {
      type: Number,
      default: 0,
    },

    // Whether the comment is pinned by admin/performer
    pinned: {
      type: Boolean,
      default: false,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt automatically
  }
);

// Index to improve performance when fetching comments of a performance
commentSchema.index({ performance: 1, createdAt: -1 });

// Export model
export const Comment = mongoose.model("Comment", commentSchema);
