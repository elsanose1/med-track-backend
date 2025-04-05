import { Request, Response } from "express";
import axios from "axios";
import { FDALabelResponse, PatientDrugInfo } from "../types/FDALabel";

const FDA_API_BASE_URL = "https://api.fda.gov/drug/label.json";
const API_KEY = "ORfbqYoAbiSRfbwElWDdtsSOQMtIKsYIAm3XEDmv";

const FDA_REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  maxRedirects: 5,
};

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

const filterDrugDataForPatient = (
  data: FDALabelResponse["results"][0]
): PatientDrugInfo => {
  const openfda = data.openfda;

  return {
    id: data.id,
    brandName: openfda.brand_name?.[0] || "Not available",
    genericName: openfda.generic_name?.[0] || "Not available",
    purpose: data.purpose || [],
    activeIngredients: data.active_ingredient || [],
    warnings: data.warnings || [],
    usage: data.indications_and_usage || [],
    dosage: data.dosage_and_administration || [],
    sideEffects: data.warnings?.filter(
      (warning) =>
        warning.toLowerCase().includes("side effect") ||
        warning.toLowerCase().includes("adverse")
    ),
    whenToStop: data.warnings?.filter(
      (warning) =>
        warning.toLowerCase().includes("stop") ||
        warning.toLowerCase().includes("discontinue")
    ),
    manufacturer: openfda.manufacturer_name?.[0] || "Not available",
    substanceNames: openfda.substance_name || [],
    route: openfda.route || [],
  };
};

export const getDrugsByBrandName: AsyncRequestHandler = async (req, res) => {
  try {
    const { brandName } = req.query;

    if (!brandName) {
      res.status(400).json({ error: "Brand name is required" });
      return;
    }

    const response = await axios.get<FDALabelResponse>(FDA_API_BASE_URL, {
      ...FDA_REQUEST_CONFIG,
      params: {
        search: `openfda.brand_name:${brandName}`,
        limit: 10,
        api_key: API_KEY,
      },
    });

    const patientFriendlyResults = response.data.results.map(
      filterDrugDataForPatient
    );
    res.json({
      meta: response.data.meta,
      results: patientFriendlyResults,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      res
        .status(404)
        .json({ error: "No drugs found with the specified brand name" });
    } else {
      res.status(500).json({ error: "Error fetching drug information" });
    }
  }
};

export const getDrugById: AsyncRequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Drug ID is required" });
      return;
    }

    const response = await axios.get<FDALabelResponse>(FDA_API_BASE_URL, {
      ...FDA_REQUEST_CONFIG,
      params: {
        search: `id:"${id}"`,
        api_key: API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      res.status(404).json({ error: "Drug not found" });
      return;
    }

    const patientFriendlyData = filterDrugDataForPatient(
      response.data.results[0]
    );
    res.json(patientFriendlyData);
  } catch (error: any) {
    if (error.response?.status === 404) {
      res.status(404).json({ error: "Drug not found" });
    } else {
      res.status(500).json({ error: "Error fetching drug information" });
    }
  }
};

export const getAllDrugs: AsyncRequestHandler = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const response = await axios.get<FDALabelResponse>(FDA_API_BASE_URL, {
      ...FDA_REQUEST_CONFIG,
      params: {
        limit,
        skip,
        api_key: API_KEY,
      },
    });

    const patientFriendlyResults = response.data.results.map(
      filterDrugDataForPatient
    );
    res.json({
      meta: response.data.meta,
      results: patientFriendlyResults,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching drugs list" });
  }
};
