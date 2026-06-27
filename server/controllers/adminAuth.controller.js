import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { AuditLog } from "../models/AuditLog.model.js";

const signAdminToken = (userId) =>
   jwt.sign(
      { id: userId, role: "admin", isAdminToken: true },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.ADMIN_TOKEN_EXPIRY || "4h" },
   );

// POST /api/admin/auth/login
export const adminLogin = async (req, res) => {
   try {
      const { email, password, accessCode } = req.body;

      if (!email || !password || !accessCode) {
         return res
            .status(400)
            .json({ message: "Email, password, and access code are required" });
      }

      // Generic error — don't reveal which field is wrong
      if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
         return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user || user.role !== "admin") {
         return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signAdminToken(user._id);

      AuditLog.create({
         admin: user._id,
         action: "admin_login",
         targetType: "system",
         targetId: user._id,
         ip: req.ip,
         userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.json({
         token,
         adminId: user._id,
         username: user.username,
         email: user.email,
         expiresIn: process.env.ADMIN_TOKEN_EXPIRY || "4h",
      });
   } catch (error) {
      console.error("[adminLogin]", error);
      return res.status(500).json({ message: "Login failed" });
   }
};

// GET /api/admin/auth/me
export const adminMe = async (req, res) => {
   try {
      const { _id, username, email, role, avatar, createdAt } = req.admin;
      return res.json({
         adminId: _id,
         username,
         email,
         role,
         avatar,
         createdAt,
      });
   } catch {
      return res.status(500).json({ message: "Failed to fetch admin info" });
   }
};

// POST /api/admin/auth/logout
export const adminLogout = async (req, res) => {
   try {
      AuditLog.create({
         admin: req.admin._id,
         action: "admin_logout",
         targetType: "system",
         targetId: req.admin._id,
         ip: req.ip,
         userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.json({
         message: "Admin logged out. Discard the admin token on the client.",
      });
   } catch {
      return res.status(500).json({ message: "Logout failed" });
   }
};

// POST /api/admin/auth/change-password
export const adminChangePassword = async (req, res) => {
   try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
         return res
            .status(400)
            .json({ message: "currentPassword and newPassword are required" });
      }

      if (newPassword.length < 8) {
         return res
            .status(400)
            .json({ message: "New password must be at least 8 characters" });
      }

      const admin = await User.findById(req.admin._id).select("+password");

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
         return res
            .status(401)
            .json({ message: "Current password is incorrect" });
      }

      admin.password = await bcrypt.hash(newPassword, 12);
      await admin.save();

      AuditLog.create({
         admin: req.admin._id,
         action: "change_password",
         targetType: "system",
         targetId: req.admin._id,
         ip: req.ip,
         userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.json({ message: "Password changed successfully" });
   } catch {
      return res.status(500).json({ message: "Failed to change password" });
   }
};
