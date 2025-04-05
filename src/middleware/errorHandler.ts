// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

// Custom error-handling middleware function
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error details (optional, for debugging purposes)
  console.error(err.stack);

  // Send a generic error response
  res.status(500).json({
    message: "Internal Server Error",
    // Optionally include error details in development mode
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
};

export default errorHandler;
