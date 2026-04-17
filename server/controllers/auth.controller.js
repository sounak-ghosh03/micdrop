import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

// GENERATE JWT TOKEN
const generateToken = (id) => {
   return jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
   );
};

// REGISTER USER POST /api/auth/register
export const registerUser = async (req, res) => {
   try {
      const { username, email, password, role } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
         return res.status(400).json({
            message: "All fields are required",
         });
      }

      // Check existing user
      const existingUser = await User.findOne({
         $or: [{ email }, { username }],
      });

      if (existingUser) {
         return res.status(400).json({
            message: "User already exists",
         });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
         username,
         email,
         password: hashedPassword,
         role: role || "audience",
      });

      // Token
      const token = generateToken(user._id);

      res.status(201).json({
         _id: user._id,
         username: user.username,
         email: user.email,
         role: user.role,
         token,
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to register user",
      });
   }
};

// LOGIN USER POST /api/auth/login
export const loginUser = async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password) {
         return res.status(400).json({
            message: "Email and password required",
         });
      }

      // Find user with password
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
         return res.status(401).json({
            message: "Invalid credentials",
         });
      }

      // Check banned user
      if (user.isBanned) {
         return res.status(403).json({
            message: "Your account has been banned",
         });
      }

      // Compare password
      const isMatch = await bcrypt.compare(
         password,
         user.password
      );

      if (!isMatch) {
         return res.status(401).json({
            message: "Invalid credentials",
         });
      }

      // Update last active
      user.lastActiveAt = new Date();
      await user.save();

      // Token
      const token = generateToken(user._id);

      res.json({
         _id: user._id,
         username: user.username,
         email: user.email,
         role: user.role,
         token,
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to login",
      });
   }
};

// GET CURRENT USER GET /api/auth/me
export const getCurrentUser = async (req, res) => {
   try {
      const user = await User.findById(req.user.id)
         .select("-password");

      if (!user) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      res.json(user);

   } catch (error) {
      res.status(500).json({
         message: "Failed to fetch user",
      });
   }
};

// UPDATE PROFILE PATCH /api/auth/profile
export const updateProfile = async (req, res) => {
   try {
      const { username, bio, avatar } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      if (username) user.username = username;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      res.json({
         message: "Profile updated successfully",
         user,
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to update profile",
      });
   }
};

// LOGOUT USER POST /api/auth/logout
export const logoutUser = async (req, res) => {
   try {
      res.json({
         message: "Logout successful. Remove token on client side.",
      });
   } catch (error) {
      res.status(500).json({
         message: "Failed to logout",
      });
   }
};
