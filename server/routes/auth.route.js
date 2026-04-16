// backend/src/routes/auth.routes.js

import express from "express";
import {
   registerUser,
   loginUser,
   getCurrentUser,
   updateProfile,
   logoutUser,
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.patch("/profile", authMiddleware, updateProfile);
router.post("/logout", authMiddleware, logoutUser);

export default router;
