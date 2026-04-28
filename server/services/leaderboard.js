import mongoose from "mongoose";
import { Performance } from "../models/Performance.model.js";
import { Leaderboard } from "../models/Leaderboard.model.js";

/*
  Scoring weights — tweak without touching logic.
  Each unique view counts as 1 point.
  Each reaction counts as 2 points.
  Applause (APPLAUSE type) carries an extra 1-point premium (3 total).
*/
const WEIGHTS = {
   VIEW: 1,
   REACTION: 2,
   APPLAUSE_BONUS: 1, // stacks on top of REACTION weight
};

/* helpers 
  Determine which period label covers a given Date.
  DAILY  → rows are recomputed/upserted each day.
  WEEKLY → rows are recomputed/upserted each ISO week.
  ALL_TIME → single ever-accumulating row per creator.
 */
const getPeriodKey = (period) => {
   const now = new Date();

   if (period === "DAILY") {
      // "YYYY-MM-DD" — useful if you ever want to store a date tag
      return now.toISOString().slice(0, 10);
   }

   if (period === "WEEKLY") {
      // ISO week number within the year
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const week = Math.ceil(
         ((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7,
      );
      return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
   }

   // ALL_TIME has no time dimension
   return "all_time";
};

// Compute score from a breakdown object.

const computeScore = (breakdown) => {
   return (
      breakdown.totalViews * WEIGHTS.VIEW +
      breakdown.totalReactions * WEIGHTS.REACTION +
      breakdown.applauseCount * WEIGHTS.APPLAUSE_BONUS
   );
};


//core aggregation
/** 
 * Build the raw breakdown stats for a creator over a date range.
 * @param {string|ObjectId} creatorId
 * @param {Date|null} since  – null means all-time
 */
const buildBreakdown = async (creatorId, since) => {
   const performanceMatch = {
      creator: new mongoose.Types.ObjectId(creatorId),
      isDeleted: false,
   };

   if (since) {
      performanceMatch.createdAt = { $gte: since };
   }

   // Aggregate performance stats
   const [perfAgg] = await Performance.aggregate([
      { $match: performanceMatch },
      {
         $group: {
            _id: null,
            totalViews: { $sum: "$stats.viewers" },
            totalReactions: { $sum: "$stats.totalReactions" },
            applauseCount: { $sum: "$stats.applauseCount" },
            performancesCount: { $sum: 1 },
         },
      },
   ]);

   return {
      totalViews: perfAgg?.totalViews ?? 0,
      totalReactions: perfAgg?.totalReactions ?? 0,
      applauseCount: perfAgg?.applauseCount ?? 0,
      performancesCount: perfAgg?.performancesCount ?? 0,
   };
};

//public API

/**
 * Upsert leaderboard score for a single creator across all three periods.
 * Call this after a performance ends or after any significant stat change.
 *
 * @param {string|ObjectId} creatorId
 */
export const refreshCreatorScore = async (creatorId) => {
   const periods = [
      { label: "DAILY", since: new Date(Date.now() - 86400000) },
      { label: "WEEKLY", since: new Date(Date.now() - 7 * 86400000) },
      { label: "ALL_TIME", since: null },
   ];

   for (const { label, since } of periods) {
      try {
         const breakdown = await buildBreakdown(creatorId, since);
         const score = computeScore(breakdown);

         await Leaderboard.findOneAndUpdate(
            { period: label, creator: creatorId },
            {
               $set: {
                  score,
                  breakdown,
               },
            },
            { upsert: true, new: true },
         );
      } catch (err) {
         console.error(
            `[leaderboard] refreshCreatorScore error (${label}):`,
            err,
         );
      }
   }
};

/**
 * Recompute rank positions for a given period and persist to DB.
 * Ranks are 1-indexed, sorted by score descending.
 * 
 * @param {"DAILY"|"WEEKLY"|"ALL_TIME"} period
 */
export const recomputeRanks = async (period) => {
   try {
      const entries = await Leaderboard.find({ period })
         .sort({ score: -1 })
         .select("_id score");

      const bulkOps = entries.map((entry, idx) => ({
         updateOne: {
            filter: { _id: entry._id },
            update: { $set: { rank: idx + 1 } },
         },
      }));

      if (bulkOps.length > 0) {
         await Leaderboard.bulkWrite(bulkOps);
      }
   } catch (err) {
      console.error(`[leaderboard] recomputeRanks error (${period}):`, err);
   }
};

/**
 * Fetch the leaderboard for a period, with creator details populated.
 *
 * @param {"DAILY"|"WEEKLY"|"ALL_TIME"} period
 * @param {number} limit  – max entries to return (default 50)
 * @returns {Array}
 */
export const getLeaderboard = async (period, limit = 50) => {
   return Leaderboard.find({ period })
      .sort({ rank: 1 })
      .limit(limit)
      .populate("creator", "username avatar bio stats")
      .lean();
};

/**
 * Full refresh: recompute scores for ALL creators that appear in the DB,
 * then recompute ranks for every period.
 *
 * This is the function to call from a scheduled job (e.g. nightly cron).
 */
export const runFullLeaderboardRefresh = async () => {
   console.log("[leaderboard] Starting full refresh…");

   try {
      // Collect unique creator IDs from existing leaderboard entries
      // (safer than querying all users, which may include inactive accounts)
      const existingEntries = await Leaderboard.distinct("creator");

      // Also pick up creators who have performances but no leaderboard row yet
      const performanceCreators = await Performance.distinct("creator", {
         isDeleted: false,
      });

      const allCreatorIds = [
         ...new Set([
            ...existingEntries.map((id) => id.toString()),
            ...performanceCreators.map((id) => id.toString()),
         ]),
      ];

      // Refresh scores in parallel (cap concurrency to avoid DB overload)
      const BATCH = 20;
      for (let i = 0; i < allCreatorIds.length; i += BATCH) {
         const batch = allCreatorIds.slice(i, i + BATCH);
         await Promise.all(batch.map((id) => refreshCreatorScore(id)));
      }

      // Recompute ranks for each period sequentially
      for (const period of ["DAILY", "WEEKLY", "ALL_TIME"]) {
         await recomputeRanks(period);
      }

      console.log(
         `[leaderboard] Full refresh complete — processed ${allCreatorIds.length} creators.`,
      );
   } catch (err) {
      console.error("[leaderboard] runFullLeaderboardRefresh error:", err);
   }
};
