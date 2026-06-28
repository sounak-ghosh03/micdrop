// Run once: npm run seed:admin
// Safe to re-run — exits early if admin already exists.

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema(
   {
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true, select: false },
      role: {
         type: String,
         enum: ["audience", "performer", "admin"],
         default: "audience",
      },
      bio: { type: String, default: "" },
      avatar: { type: String, default: "" },
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      stats: {
         totalPerformances: { type: Number, default: 0 },
         totalApplause: { type: Number, default: 0 },
         totalBoos: { type: Number, default: 0 },
         averageScore: { type: Number, default: 0 },
      },
      isBanned: { type: Boolean, default: false },
      warningsCount: { type: Number, default: 0 },
      isVerified: { type: Boolean, default: false },
      lastActiveAt: { type: Date, default: Date.now },
   },
   { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

const seed = async () => {
   try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ Connected to MongoDB");

      const email = process.env.ADMIN_SEED_EMAIL;
      const password = process.env.ADMIN_SEED_PASSWORD;

      if (!email || !password) {
         console.error(
            "❌ ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env",
         );
         process.exit(1);
      }

      const existing = await User.findOne({ email });
      if (existing) {
         console.log(`ℹ️  Admin already exists (${email}). Exiting.`);
         await mongoose.disconnect();
         process.exit(0);
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await User.create({
         username: "micdrop_admin",
         email,
         password: hashedPassword,
         role: "admin",
         isVerified: true,
      });

      console.log(`✅ Admin account created successfully!`);
      console.log(`   Email:    ${email}`);
      console.log(`   Username: micdrop_admin`);
      console.log(`   ⚠️  Change the password immediately after first login!`);

      await mongoose.disconnect();
      process.exit(0);
   } catch (error) {
      console.error("❌ Seed failed:", error.message);
      process.exit(1);
   }
};

seed();
