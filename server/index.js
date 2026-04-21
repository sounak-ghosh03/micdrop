import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { DB } from "./config/db.js";
import reactionRoute from "./routes/reaction.route.js";
import performanceRoute from "./routes/performance.route.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.routes.js";
import commentRoute from "./routes/comment.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
   cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
   }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/performances", performanceRoute);
app.use("/api/performances/:id/reactions", reactionRoute);
app.use("/api/comments", commentRoute);

// Global error handler
app.use(errorMiddleware);

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
