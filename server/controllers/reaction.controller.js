import mongoose from "mongoose";
import { Reaction } from "../models/reaction.model.js";
import { Performance } from "../models/performance.model.js";

// ADD REACTION
//POST /api/performances/:id/reactions
export const addReaction = async (req, res) => {
   const session = await mongoose.startSession();
   session.startTransaction();

   try {
      const { type, value = 1 } = req.body;

      const reaction = await Reaction.create(
         [
            {
               performance: req.params.id,
               user: req.user.id,
               type,
               value,
            },
         ],
         { session },
      );

      await Performance.findByIdAndUpdate(
         req.params.id,
         {
            $inc: {
               "stats.totalReactions": value,
               "stats.applauseCount": type === "APPLAUSE" ? value : 0,
            },
         },
         { session },
      );

      await session.commitTransaction();

      //Realtime reaction event (performance room)
      req.app.get("io").to(req.params.id).emit("reaction:new", {
         performanceId: req.params.id,
         type,
         value,
      });

      res.status(201).json(reaction[0]);
   } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: "Failed to add reaction" });
   } finally {
      session.endSession();
   }
};

//GET REACTION SUMMARY
//GET /api/performances/:id/reactions
export const getReactionSummary = async (req, res) => {
   try {
      const summary = await Reaction.aggregate([
         {
            $match: {
               performance: new mongoose.Types.ObjectId(req.params.id),
            },
         },
         {
            $group: {
               _id: "$type",
               count: { $sum: "$value" },
            },
         },
      ]);

      res.json(summary);
   } catch (error) {
      res.status(500).json({ message: "Failed to fetch reactions" });
   }
};
