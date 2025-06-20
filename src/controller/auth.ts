import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth";
import { UserType } from "../models/User";

const jwtSecret = String(process.env.JWT_SECRET);

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    // For pharmacy users, check if they're verified
    if (user.userType === UserType.PHARMACY) {
      const isVerified = user.isVerified || false;
      // Still allow login but include verification status in token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          username: user.username,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified, // Include verification status
        },
        jwtSecret,
        {
          expiresIn: "3h",
        }
      );

      return res.json({
        token,
        isVerified,
        message: isVerified
          ? "Login successful"
          : "Login successful. Your account is pending verification by an administrator.",
      });
    }

    // For non-pharmacy users, proceed as normal
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      jwtSecret,
      {
        expiresIn: "3h",
      }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
}

export async function registerHandler(req: Request, res: Response) {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
    userType,
    phoneNumber,
    address,
    medicalHistory,
    allergies,
    licenseNumber,
    pharmacyName,
  } = req.body;

  try {
    // Prevent creation of admin users through public registration
    if (userType === UserType.ADMIN) {
      return res.status(403).json({
        message:
          "Not authorized to create this type of account. Admin accounts can only be created by other admins.",
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

    // If registering as a pharmacy
    if (userType === UserType.PHARMACY) {
      // Validate pharmacy-specific required fields
      if (!licenseNumber || !pharmacyName) {
        return res.status(400).json({
          message:
            "License number and pharmacy name are required for pharmacy registration.",
        });
      }

      // Create pharmacy account (unverified)
      const pharmacy = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        userType: UserType.PHARMACY,
        phoneNumber,
        address,
        licenseNumber,
        pharmacyName,
        isVerified: false, // Default to unverified
      });

      await pharmacy.save();
      return res.status(201).json({
        message:
          "Pharmacy registered successfully. Your account is pending verification by an administrator.",
      });
    }

    // For patient registration
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      userType: UserType.PATIENT,
      phoneNumber,
      address,
      medicalHistory,
      allergies,
      isVerified: true, // patient is verified by default
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error registering user", error: err });
  }
}

/**
 * Handler for changing user password
 */
export async function changePasswordHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Set and save new password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password", error: err });
  }
}
