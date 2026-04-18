import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { DB } from "./config/db.js";
import reactionRoute from "./routes/reaction.route.js";
import performanceRoute from "./routes/performance.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
   cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
   }),
);
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use("/api/performances", performanceRoute);
app.use("/api/performances/:id/reactions", reactionRoute);

// Connect to DB and start server
DB()
   .then(() => {
      app.listen(PORT, () => {
         console.log(`Server running on http://localhost:${PORT}`);
      });
   })
   .catch((error) => {
      console.log("Mongodb connection Failed!!!", error);
   });
