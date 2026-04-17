import { User } from "../models/User.model.js";

// GET USER PROFILE GET /api/users/:id
export const getUserProfile = async (req, res) => {
   try {
      const user = await User.findById(req.params.id)
         .select("-password")
         .populate("followers", "username avatar")
         .populate("following", "username avatar");

      if (!user) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      res.json(user);

   } catch (error) {
      res.status(500).json({
         message: "Failed to fetch user profile",
      });
   }
};

// FOLLOW USER POST /api/users/:id/follow
export const followUser = async (req, res) => {
   try {
      const targetUserId = req.params.id;
      const currentUserId = req.user.id;

      if (targetUserId === currentUserId) {
         return res.status(400).json({
            message: "You cannot follow yourself",
         });
      }

      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      const alreadyFollowing = currentUser.following.includes(targetUserId);

      if (alreadyFollowing) {
         return res.status(400).json({
            message: "Already following this user",
         });
      }

      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      res.json({
         message: "User followed successfully",
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to follow user",
      });
   }
};

// UNFOLLOW USER DELETE /api/users/:id/follow
export const unfollowUser = async (req, res) => {
   try {
      const targetUserId = req.params.id;
      const currentUserId = req.user.id;

      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      currentUser.following = currentUser.following.filter(
         (id) => id.toString() !== targetUserId
      );

      targetUser.followers = targetUser.followers.filter(
         (id) => id.toString() !== currentUserId
      );

      await currentUser.save();
      await targetUser.save();

      res.json({
         message: "User unfollowed successfully",
      });

   } catch (error) {
      res.status(500).json({
         message: "Failed to unfollow user",
      });
   }
};

// GET FOLLOWERS GET /api/users/:id/followers
export const getFollowers = async (req, res) => {
   try {
      const user = await User.findById(req.params.id)
         .populate("followers", "username avatar bio");

      if (!user) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      res.json(user.followers);

   } catch (error) {
      res.status(500).json({
         message: "Failed to fetch followers",
      });
   }
};

// GET FOLLOWING GET /api/users/:id/following
export const getFollowing = async (req, res) => {
   try {
      const user = await User.findById(req.params.id)
         .populate("following", "username avatar bio");

      if (!user) {
         return res.status(404).json({
            message: "User not found",
         });
      }

      res.json(user.following);

   } catch (error) {
      res.status(500).json({
         message: "Failed to fetch following users",
      });
   }
};

// SEARCH USERS GET /api/users/search?q=
export const searchUsers = async (req, res) => {
   try {
      const query = req.query.q;

      if (!query) {
         return res.status(400).json({
            message: "Search query required",
         });
      }

      const users = await User.find({
         username: { $regex: query, $options: "i" },
         isBanned: false,
      })
         .select("username avatar bio role")
         .limit(10);

      res.json(users);

   } catch (error) {
      res.status(500).json({
         message: "Failed to search users",
      });
   }
};
