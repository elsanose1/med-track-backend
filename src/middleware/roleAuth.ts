import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { UserType } from "../models/User";

/**
 * Middleware to check if the user has one of the required roles
 * @param allowedRoles Array of user types that are allowed to access the route
 * @returns Middleware function
 */
export const authorize = (allowedRoles: UserType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userType = req.user.userType;

    if (!allowedRoles.includes(userType)) {
      return res.status(403).json({
        message:
          "Access denied. You don't have permission to access this resource.",
      });
    }

    next();
  };
};

/**
 * Middleware to check if the user is an admin
 */
export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.userType !== UserType.ADMIN) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
  next();
};

/**
 * Middleware to check if the user is a pharmacy
 */
export const isPharmacy = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.userType !== UserType.PHARMACY) {
    return res.status(403).json({
      message: "Pharmacy access required",
    });
  }
  next();
};

/**
 * Middleware to check if the user is a patient
 */
export const isPatient = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user.userType !== UserType.PATIENT) {
    return res.status(403).json({
      message: "Patient access required",
    });
  }
  next();
};

/**
 * Middleware to check if the pharmacy user is verified by an admin
 * This should be used after isPharmacy middleware
 */
export const isVerifiedPharmacy = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // First check if user is a pharmacy
  if (req.user.userType !== UserType.PHARMACY) {
    return res.status(403).json({
      message: "Pharmacy access required",
    });
  }

  // Then check if the pharmacy is verified
  if (!req.user.isVerified) {
    return res.status(403).json({
      message:
        "Your pharmacy account is pending verification by an administrator.",
    });
  }

  next();
};
