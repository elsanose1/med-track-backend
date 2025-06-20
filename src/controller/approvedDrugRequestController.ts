import { Request, Response } from "express";
import ApprovedDrugRequest from "../models/ApprovedDrugRequest";
import mongoose from "mongoose";

// Create ApprovedDrugRequest
export const createApprovedDrugRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientID, pharmacyID, drugID, note, price } = req.body;
    const newRequest = await ApprovedDrugRequest.create({
      patientID,
      pharmacyID,
      drugID,
      note,
      price,
    });
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({
      error: "Failed to create approved drug request",
      details: error,
    });
  }
};

// Get all ApprovedDrugRequests for a patient
export const getPatientApprovedDrugRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientID } = req.params;
    const requests = await ApprovedDrugRequest.find({ patientID }).populate({
      path: "pharmacyID",
      select: "pharmacyName",
    });
    // Map to include pharmacyName at the top level
    const requestsWithPharmacyName = requests.map((req: any) => {
      const pharmacyName = req.pharmacyID?.pharmacyName || null;
      return {
        ...req.toObject(),
        pharmacyName,
      };
    });
    res.json(requestsWithPharmacyName);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch patient requests", details: error });
  }
};

// Get all ApprovedDrugRequests for a pharmacy
export const getPharmacyApprovedDrugRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const { pharmacyID } = req.params;
    const requests = await ApprovedDrugRequest.find({ pharmacyID }).populate({
      path: "patientID",
      select: "firstName lastName",
    });
    // Map to include patientName at the top level
    const requestsWithPatientName = requests.map((req: any) => {
      const patient = req.patientID;
      const patientName = patient
        ? `${patient.firstName} ${patient.lastName}`
        : null;
      return {
        ...req.toObject(),
        patientName,
      };
    });
    res.json(requestsWithPatientName);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch pharmacy requests", details: error });
  }
};

// Patient cancels request (only if status is 'preparing' and belongs to patient)
export const cancelByPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { patientID } = req.body;
    const request = await ApprovedDrugRequest.findOne({ _id: id, patientID });
    if (!request) {
      res.status(404).json({ error: "Request not found or not authorized" });
      return;
    }
    if (request.status !== "preparing") {
      res.status(400).json({ error: "Can only cancel if status is preparing" });
      return;
    }
    request.status = "canceled ";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel request", details: error });
  }
};

// Pharmacy cancels request (if status is 'preparing' or 'out_for_delivery' and belongs to pharmacy)
export const cancelByPharmacy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacyID } = req.body;
    const request = await ApprovedDrugRequest.findOne({ _id: id, pharmacyID });
    if (!request) {
      res.status(404).json({ error: "Request not found or not authorized" });
      return;
    }
    if (
      request.status !== "preparing" &&
      request.status !== "out_for_delivery"
    ) {
      res.status(400).json({
        error: "Can only cancel if status is preparing or out_for_delivery",
      });
      return;
    }
    request.status = "canceled ";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel request", details: error });
  }
};

// Pharmacy updates status from 'preparing' to 'out_for_delivery'
export const markOutForDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacyID } = req.body;
    const request = await ApprovedDrugRequest.findOne({ _id: id, pharmacyID });
    if (!request) {
      res.status(404).json({ error: "Request not found or not authorized" });
      return;
    }
    if (request.status !== "preparing") {
      res.status(400).json({
        error: "Can only mark as out_for_delivery if status is preparing",
      });
      return;
    }
    request.status = "out_for_delivery";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status", details: error });
  }
};

// Pharmacy updates status from 'out_for_delivery' to 'delivered'
export const markDelivered = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacyID } = req.body;
    const request = await ApprovedDrugRequest.findOne({ _id: id, pharmacyID });
    if (!request) {
      res.status(404).json({ error: "Request not found or not authorized" });
      return;
    }
    if (request.status !== "out_for_delivery") {
      res.status(400).json({
        error: "Can only mark as delivered if status is out_for_delivery",
      });
      return;
    }
    request.status = "delivered";
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status", details: error });
  }
};
