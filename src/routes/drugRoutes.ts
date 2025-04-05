import { Router } from "express";
import {
  getDrugsByBrandName,
  getDrugById,
  getAllDrugs,
} from "../controller/drugController";

const router = Router();

// Get all drugs with pagination
router.get("/", getAllDrugs);

// Get drugs by brand name
router.get("/search", getDrugsByBrandName);

// Get specific drug by ID
router.get("/:id", getDrugById);

export default router;
