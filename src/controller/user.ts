import { Response } from "express";
import User from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";

/**
 * Get the current user's profile
 */
export async function getUserProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user profile", error: err });
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address,
      // Fields specific to different user types
      medicalHistory,
      allergies,
      licenseNumber,
      pharmacyName,
    } = req.body;

    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;

    // Update user type specific fields
    if (medicalHistory) user.medicalHistory = medicalHistory;
    if (allergies) user.allergies = allergies;
    if (licenseNumber) user.licenseNumber = licenseNumber;
    if (pharmacyName) user.pharmacyName = pharmacyName;

    // Save the updated user
    await user.save();

    // Return the updated user without the password
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user profile", error: err });
  }
}
