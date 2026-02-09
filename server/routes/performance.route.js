import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
   createPerformance,
   startPerformance,
   endPerformance,
   getPerformances,
} from "../controllers/performance.controller.js";

const performanceRoute = express.Router();

performanceRoute.post("/", authMiddleware, createPerformance);

performanceRoute.patch("/:id/start", authMiddleware, startPerformance);

performanceRoute.patch("/:id/end", authMiddleware, endPerformance);

performanceRoute.get("/", getPerformances);

export default performanceRoute;
