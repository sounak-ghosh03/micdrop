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

const router = express.Router();

router.post("/", authMiddleware, createComment);
router.get("/:performanceId", getComments);
router.delete("/:id", authMiddleware, deleteComment);
router.patch("/:id/like", authMiddleware, likeComment);
router.patch("/:id/pin", authMiddleware, pinComment);
router.patch("/:id/unpin", authMiddleware, unpinComment);

export default router;
