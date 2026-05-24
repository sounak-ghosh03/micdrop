import mongoose from "mongoose";
import { Performance } from "../models/Performance.model.js";
import { Comment } from "../models/Comment.model.js";
import { Reaction } from "../models/reaction.model.js";

// CREATE PERFORMANCE POST /api/performances
export const createPerformance = async (req, res) => {
   try {
      const performance = await Performance.create({
         creator: req.user.id,
         ...req.body,
      });

      await performance.populate("creator", "username name avatar");

      res.status(201).json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to create performance" });
   }
};

// GET SINGLE PERFORMANCE GET /api/performances/:id
export const getPerformanceById = async (req, res) => {
   try {
      const performance = await Performance.findOne({
         _id: req.params.id,
         isDeleted: false,
      }).populate("creator", "username name avatar");

      if (!performance)
         return res.status(404).json({ message: "Performance not found" });

      res.json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance" });
   }
};

// START LIVE PERFORMANCE PATCH /api/performances/:id/start
export const startPerformance = async (req, res) => {
   try {
      const performance = await Performance.findOneAndUpdate(
         {
            _id: req.params.id,
            creator: req.user.id,
            status: { $ne: "LIVE" },
         },
         {
            status: "LIVE",
            startedAt: new Date(),
         },
         { new: true },
      );

      if (!performance)
         return res.status(404).json({ message: "Performance not found" });

      await performance.populate("creator", "username name avatar");

      // Realtime notify — send populated document so clients keep creator info
      req.app.get("io").emit("performance:live", performance);

      res.json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to start performance" });
   }
};

//END LIVE PERFORMANCE PATCH /api/performances/:id/end
export const endPerformance = async (req, res) => {
   try {
      // Verify the performance is owned by this user and currently LIVE
      const existing = await Performance.findOne({
         _id: req.params.id,
         creator: req.user.id,
         status: "LIVE",
      });

      if (!existing)
         return res.status(404).json({ message: "Performance not found" });

      // Aggregate accurate final stats directly from source collections
      const [commentCount, reactionData] = await Promise.all([
         Comment.countDocuments({
            performance: req.params.id,
            isDeleted: false,
         }),
         Reaction.aggregate([
            {
               $match: {
                  performance: new mongoose.Types.ObjectId(req.params.id),
               },
            },
            {
               $group: {
                  _id: null,
                  totalReactions: { $sum: "$value" },
                  applauseCount: {
                     $sum: {
                        $cond: [{ $eq: ["$type", "APPLAUSE"] }, "$value", 0],
                     },
                  },
               },
            },
         ]),
      ]);

      const { totalReactions = 0, applauseCount = 0 } = reactionData[0] ?? {};

      const performance = await Performance.findOneAndUpdate(
         { _id: req.params.id, creator: req.user.id, status: "LIVE" },
         {
            status: "ENDED",
            endedAt: new Date(),
            // Snapshot accurate final stats
            "stats.commentCount": commentCount,
            "stats.totalReactions": totalReactions,
            "stats.applauseCount": applauseCount,
         },
         { new: true },
      );

      await performance.populate("creator", "username name avatar");

      // Realtime notify — send populated document so clients keep creator info
      req.app.get("io").emit("performance:ended", performance);

      res.json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to end performance" });
   }
};

// GET PERFORMANCE FEED GET /api/performances
export const getPerformances = async (req, res) => {
   try {
      const performances = await Performance.find({
         isDeleted: false,
         status: { $in: ["LIVE", "ENDED"] },
      })
         .populate("creator", "username name avatar")
         .sort({ createdAt: -1 });

      res.json(performances);
   } catch (error) {
      res.status(500).json({ message: "Failed to fetch performances" });
   }
};
