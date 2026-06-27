import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

// Verifies ADMIN_JWT_SECRET + isAdminToken claim.
// Sets req.admin (not req.user) to keep admin/user pipelines separate.
export const adminAuthMiddleware = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
         return res.status(401).json({ message: "Admin token required" });
      }

      const token = authHeader.split(" ")[1];

      let decoded;
      try {
         decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      } catch {
         return res
            .status(401)
            .json({ message: "Invalid or expired admin token" });
      }

      if (!decoded.isAdminToken) {
         return res.status(403).json({ message: "Not an admin token" });
      }

      const admin = await User.findById(decoded.id).select("-password");
      if (!admin || admin.role !== "admin") {
         return res.status(403).json({ message: "Admin access denied" });
      }

      if (admin.isBanned) {
         return res.status(403).json({ message: "Admin account suspended" });
      }

      req.admin = admin;
      next();
   } catch {
      return res
         .status(401)
         .json({ message: "Invalid or expired admin token" });
   }
};
