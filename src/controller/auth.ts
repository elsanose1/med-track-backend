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
    // Prevent creation of admin or pharmacy users through public registration
    if (userType === UserType.ADMIN || userType === UserType.PHARMACY) {
      return res.status(403).json({
        message:
          "Not authorized to create this type of account. Only patient accounts can be created through registration.",
      });
    }

    // Force userType to be patient for public registration
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      userType: UserType.PATIENT, // Force userType to PATIENT
      phoneNumber,
      address,
      medicalHistory,
      allergies,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "Error registering user", error: err });
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as AuthenticatedRequest).user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "Current and new password are required" });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating password", error: err });
  }
}
