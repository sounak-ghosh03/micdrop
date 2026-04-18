import express from "express";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {
   addReaction,
   getReactionSummary,
} from "../controllers/reaction.controller.js";

const reactionRoute = express.Router();

reactionRoute
   .route("/")
   .post(authMiddleware, addReaction)
   .get(getReactionSummary);

export default reactionRoute;
