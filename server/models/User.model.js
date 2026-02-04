import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic identity
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never return password by default
    },

    // Role management
    role: {
      type: String,
      enum: ["audience", "performer", "admin"],
      default: "audience",
    },

    // Profile details
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },

    avatar: {
      type: String, // Cloudinary / S3 URL
      default: "",
    },

    // Social graph
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Performer-specific stats
    stats: {
      totalPerformances: {
        type: Number,
        default: 0,
      },
      totalApplause: {
        type: Number,
        default: 0,
      },
      totalBoos: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
    },

    // Moderation & safety
    isBanned: {
      type: Boolean,
      default: false,
    },

    warningsCount: {
      type: Number,
      default: 0,
    },

    // Account status
    isVerified: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export const User = mongoose.model("User", userSchema);