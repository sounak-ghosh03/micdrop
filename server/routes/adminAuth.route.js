import express from "express";
import {
   adminLogin,
   adminMe,
   adminLogout,
   adminChangePassword,
} from "../controllers/adminAuth.controller.js";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Login is public; rate-limited to 5 attempts / 15 min
router.post("/login", rateLimitMiddleware(5, 15 * 60 * 1000), adminLogin);

// Protected
router.get("/me", adminAuthMiddleware, adminMe);
router.post("/logout", adminAuthMiddleware, adminLogout);
router.post("/change-password", adminAuthMiddleware, adminChangePassword);

export default router;
