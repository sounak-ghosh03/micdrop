import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
   createPerformance,
   startPerformance,
   endPerformance,
   getPerformances,
} from "../controllers/performance.controller.js";

const performanceRoute = express.Router();

performanceRoute.post(
   "/",
   authMiddleware,
   roleMiddleware("performer", "admin"),
   createPerformance,
);
performanceRoute.patch(
   "/:id/start",
   authMiddleware,
   roleMiddleware("performer", "admin"),
   startPerformance,
);
performanceRoute.patch(
   "/:id/end",
   authMiddleware,
   roleMiddleware("performer", "admin"),
   endPerformance,
);
performanceRoute.get("/", getPerformances);

export default performanceRoute;
