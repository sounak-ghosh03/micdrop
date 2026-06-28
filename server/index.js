import http from "http";
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
import adminAuthRoute from "./routes/adminAuth.route.js";
import adminRoute from "./routes/admin.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { initSocket } from "./services/socket.js";

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
// Admin routes — admin auth is public, all other /api/admin/* are JWT-gated
app.use("/api/admin/auth", adminAuthRoute);
app.use("/api/admin", adminRoute);

// Global error handler
app.use(errorMiddleware);

// Wrap Express in a raw http.Server so Socket.IO can share the same port
const httpServer = http.createServer(app);

// Attach Socket.IO — also does app.set("io", io) for controllers
initSocket(httpServer, app);

// Connect to DB and start server
DB()
   .then(() => {
      httpServer.listen(PORT, () => {
         console.log(`Server running on http://localhost:${PORT}`);
      });
   })
   .catch((error) => {
      console.log("Mongodb connection Failed!!!", error);
   });
