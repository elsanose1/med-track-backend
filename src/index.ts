import express, { Request, Response } from "express";
import morgan from "morgan";
import { config } from "dotenv";
import http from "http";
import cors from "cors";
config();

// database connection
import connectDB from "./config/db";

// Socket.IO service
import {
  initializeSocketIO,
  setSocketIOInstance,
} from "./services/socketService";

// routes
import authRoutes from "./routes/auth";
import drugRoutes from "./routes/drugRoutes";
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import chatRoutes from "./routes/chat";

// middleware
import errorHandler from "./middleware/errorHandler";
import authMiddleware from "./middleware/auth";

const app = express();
app.use(morgan("combined"));
app.use(express.json());

// Enable CORS for all routes
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Allow requests from frontend URL or all origins if not specified
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(server);
setSocketIOInstance(io);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

// error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Socket.IO running on the same port`);
});
