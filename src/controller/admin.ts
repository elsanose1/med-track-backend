import { Response } from "express";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";
import { UserType } from "../models/User";

/**
 * Admin endpoint to create a pharmacy account
 */
export async function createPharmacyAccount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      licenseNumber,
      pharmacyName,
    } = req.body;

    // Validate required fields
    if (
      !username ||
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !licenseNumber ||
      !pharmacyName
    ) {
      return res.status(400).json({
        message:
          "Missing required fields. Username, email, password, first name, last name, license number, and pharmacy name are required.",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists",
      });
    }

    // Create new pharmacy user
    const newPharmacy = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      licenseNumber,
      pharmacyName,
      userType: UserType.PHARMACY,
    });

    await newPharmacy.save();

    // Return success without exposing password
    const createdUser = await User.findById(newPharmacy._id).select(
      "-password"
    );
    res.status(201).json({
      message: "Pharmacy account created successfully",
      pharmacy: createdUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating pharmacy account",
      error: err,
    });
  }
}

/**
 * Admin endpoint to create another admin account
 */
export async function createAdminAccount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Missing required fields. Username, email, password, first name, and last name are required.",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already exists",
      });
    }

    // Create new admin user
    const newAdmin = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      userType: UserType.ADMIN,
    });

    await newAdmin.save();

    // Return success without exposing password
    const createdUser = await User.findById(newAdmin._id).select("-password");
    res.status(201).json({
      message: "Admin account created successfully",
      admin: createdUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating admin account",
      error: err,
    });
  }
}
