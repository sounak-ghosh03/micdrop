// backend/src/routes/comment.routes.js

import express from "express";
import {
   createComment,
   getComments,
   deleteComment,
   likeComment,
   pinComment,
   unpinComment,
} from "../controllers/comment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, rateLimitMiddleware(10, 60000), createComment);
router.get("/:performanceId", getComments);
router.delete("/:id", authMiddleware, deleteComment);
router.patch(
   "/:id/like",
   authMiddleware,
   rateLimitMiddleware(20, 60000),
   likeComment,
);
router.patch(
   "/:id/pin",
   authMiddleware,
   roleMiddleware("performer", "admin"),
   pinComment,
);
router.patch(
   "/:id/unpin",
   authMiddleware,
   roleMiddleware("performer", "admin"),
   unpinComment,
);

export default router;
