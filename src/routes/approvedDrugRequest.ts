import express from "express";
import {
  createApprovedDrugRequest,
  getPatientApprovedDrugRequests,
  getPharmacyApprovedDrugRequests,
  cancelByPatient,
  cancelByPharmacy,
  markOutForDelivery,
  markDelivered,
} from "../controller/approvedDrugRequestController";

const router = express.Router();

// Create ApprovedDrugRequest
router.post("/", createApprovedDrugRequest);

// Get all ApprovedDrugRequests for a patient
router.get("/patient/:patientID", getPatientApprovedDrugRequests);

// Get all ApprovedDrugRequests for a pharmacy
router.get("/pharmacy/:pharmacyID", getPharmacyApprovedDrugRequests);

// Patient cancels request (only if status is 'preparing')
router.patch("/cancel/patient/:id", cancelByPatient);

// Pharmacy cancels request (if status is 'preparing' or 'out_for_delivery')
router.patch("/cancel/pharmacy/:id", cancelByPharmacy);

// Pharmacy updates status from 'preparing' to 'out_for_delivery'
router.patch("/out-for-delivery/:id", markOutForDelivery);

// Pharmacy updates status from 'out_for_delivery' to 'delivered'
router.patch("/delivered/:id", markDelivered);

export default router;
