import express, { Request, Response } from "express";
import morgan from "morgan";
import { config } from "dotenv";
config();

// database connection
import connectDB from "./config/db";

// routes
import authRoutes from "./routes/auth";
import drugRoutes from "./routes/drugRoutes";

// middleware
import errorHandler from "./middleware/errorHandler";
import authMiddleware from "./middleware/auth";

const app = express();
app.use(morgan("combined"));
app.use(express.json());
// routes
app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);

// error handler middleware
app.use(errorHandler);

const PORT = process.env.PROT || 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running at http://localhost:${PORT}`);
});
