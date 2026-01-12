import dotenv from "dotenv";
import express from "express";
// import cookieParser from "cookie-parser";
import cors from "cors";
import { DB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

app.use(cors(corsOptions));
// app.use(cookieParser());
app.use(express.json());

// Connect to DB
DB().catch((err) => {
  console.log("Failed to connect to DB", err);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
