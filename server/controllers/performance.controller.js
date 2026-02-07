import { Performance } from "../models/performance.model.js";

// CREATE PERFORMANCE POST /api/performances
export const createPerformance = async (req, res) => {
   try {
      const performance = await Performance.create({
         creator: req.user.id,
         ...req.body,
      });

      res.status(201).json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to create performance" });
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

      // Realtime notify
      req.app.get("io").emit("performance:live", performance);

      res.json(performance);
   } catch (error) {
      res.status(500).json({ message: "Failed to start performance" });
   }
};

//END LIVE PERFORMANCE PATCH /api/performances/:id/end
export const endPerformance = async (req, res) => {
   try {
      const performance = await Performance.findOneAndUpdate(
         {
            _id: req.params.id,
            creator: req.user.id,
            status: "LIVE",
         },
         {
            status: "ENDED",
            endedAt: new Date(),
         },
         { new: true },
      );

      if (!performance)
         return res.status(404).json({ message: "Performance not found" });

      // Realtime notify
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
         .populate("creator", "name avatar")
         .sort({ createdAt: -1 });

      res.json(performances);
   } catch (error) {
      res.status(500).json({ message: "Failed to fetch performances" });
   }
};
