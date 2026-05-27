// backend/src/routes/auth.routes.js

import express from "express";
import {
   registerUser,
   loginUser,
   getCurrentUser,
   updateProfile,
   logoutUser,
   deleteAccount,
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", rateLimitMiddleware(5, 60000), registerUser);
router.post("/login", rateLimitMiddleware(5, 60000), loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.patch("/profile", authMiddleware, updateProfile);
router.post("/logout", authMiddleware, logoutUser);
router.delete("/account", authMiddleware, deleteAccount);

export default router;
