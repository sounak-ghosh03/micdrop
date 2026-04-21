import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";
import {
   addReaction,
   getReactionSummary,
} from "../controllers/reaction.controller.js";

const reactionRoute = express.Router();

reactionRoute
   .route("/")
   .post(authMiddleware, rateLimitMiddleware(20, 60000), addReaction)
   .get(getReactionSummary);

export default reactionRoute;
