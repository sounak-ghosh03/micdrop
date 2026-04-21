import express from "express";
import {
   getUserProfile,
   followUser,
   unfollowUser,
   getFollowers,
   getFollowing,
   searchUsers,
} from "../controllers/user.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/:id", getUserProfile);
router.post("/:id/follow", authMiddleware, followUser);
router.delete("/:id/follow", authMiddleware, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;
