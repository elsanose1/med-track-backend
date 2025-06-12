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

    // Create new pharmacy user (verified since created by admin)
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
      isVerified: true, // Auto-verify pharmacy created by admin
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

/**
 * Get all pharmacy accounts pending verification
 */
export async function getPendingPharmacies(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    // Find all pharmacy users that are not verified
    const pendingPharmacies = await User.find({
      userType: UserType.PHARMACY,
      isVerified: false,
    }).select("-password");

    res.json(pendingPharmacies);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pending pharmacies",
      error: err,
    });
  }
}

/**
 * Verify or reject a pharmacy account
 */
export async function verifyPharmacy(req: AuthenticatedRequest, res: Response) {
  try {
    const { pharmacyId } = req.params;
    const { approve } = req.body;

    if (approve === undefined) {
      return res.status(400).json({
        message:
          "The 'approve' field is required (true to approve, false to reject)",
      });
    }

    // Find the pharmacy user
    const pharmacy = await User.findOne({
      _id: pharmacyId,
      userType: UserType.PHARMACY,
    });

    if (!pharmacy) {
      return res.status(404).json({
        message: "Pharmacy not found",
      });
    }

    if (approve) {
      // Approve the pharmacy
      pharmacy.isVerified = true;
      await pharmacy.save();

      res.json({
        message: "Pharmacy account verified successfully",
        pharmacy: {
          id: pharmacy._id,
          username: pharmacy.username,
          email: pharmacy.email,
          pharmacyName: pharmacy.pharmacyName,
          isVerified: pharmacy.isVerified,
        },
      });
    } else {
      // Reject the pharmacy - In a real-world scenario, you might want to:
      // 1. Send an email notification with rejection reason
      // 2. Mark as rejected rather than deleting
      // 3. Keep a log of rejections
      await User.deleteOne({ _id: pharmacyId });

      res.json({
        message: "Pharmacy account rejected and removed",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error processing pharmacy verification",
      error: err,
    });
  }
}

/**
 * Get all patients (admin only)
 */
export async function getAllPatients(req: AuthenticatedRequest, res: Response) {
  try {
    const patients = await User.find({ userType: UserType.PATIENT }).select(
      "-password"
    );
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: "Error fetching patients", error: err });
  }
}

/**
 * Get all pharmacies (admin only)
 */
export async function getAllPharmacies(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const pharmacies = await User.find({
      userType: UserType.PHARMACY,
      isVerified: true,
    }).select("-password");
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ message: "Error fetching pharmacies", error: err });
  }
}

/**
 * Get all admins (admin only)
 */
export async function getAllAdmins(req: AuthenticatedRequest, res: Response) {
  try {
    const admins = await User.find({ userType: UserType.ADMIN }).select(
      "-password"
    );
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admins", error: err });
  }
}

/**
 * Get all users count (admin only)
 */
export async function getAllUsersCount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const count = await User.countDocuments({ userType: { $exists: true } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users count", error: err });
  }
}

/**
 * Get all patients count (admin only)
 */
export async function getAllPatientsCount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const count = await User.countDocuments({ userType: UserType.PATIENT });
    res.json({ count });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching patients count", error: err });
  }
}

/**
 * Get all pharmacies count (admin only)
 */
export async function getAllPharmaciesCount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const count = await User.countDocuments({ userType: UserType.PHARMACY });
    res.json({ count });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching pharmacies count", error: err });
  }
}

/**
 * Get all admins count (admin only)
 */
export async function getAllAdminsCount(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const count = await User.countDocuments({ userType: UserType.ADMIN });
    res.json({ count });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching admins count", error: err });
  }
}
