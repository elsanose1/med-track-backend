import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserType } from "../models/User";
const jwtSecret: string = String(process.env.JWT_SECRET);

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    userType: UserType;
    firstName: string;
    lastName: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  userType: UserType;
  firstName: string;
  lastName: string;
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
