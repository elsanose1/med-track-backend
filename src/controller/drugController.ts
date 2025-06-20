import { Request, Response } from "express";
import axios from "axios";
import { FDALabelResponse, PatientDrugInfo } from "../types/FDALabel";

export const FDA_API_BASE_URL = "https://api.fda.gov/drug/label.json";
export const API_KEY = "ORfbqYoAbiSRfbwElWDdtsSOQMtIKsYIAm3XEDmv";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const FDA_REQUEST_CONFIG = {
  headers: {
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  maxRedirects: 5,
  timeout: 15000, // 15 seconds
};

// Create custom axios instance for FDA API requests
const fdaAxios = axios.create(FDA_REQUEST_CONFIG);

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

// Helper function to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function for API calls
const retryApiCall = async (
  apiCall: () => any,
  retriesLeft = MAX_RETRIES
): Promise<any> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (retriesLeft <= 0) {
      throw error;
    }

    // Only retry on network errors and timeout errors
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.response?.status >= 500
    ) {
      console.log(`Retrying API call. Attempts remaining: ${retriesLeft}`);
      await sleep(RETRY_DELAY);
      return retryApiCall(apiCall, retriesLeft - 1);
    }

    throw error;
  }
};

// Error handler function
const handleApiError = (error: any) => {
  console.error("FDA API Error:", error.code || "Unknown error");

  // Format human-readable error
  let errorMessage = "An error occurred while connecting to the FDA API";
  let errorCode = error.code || "UNKNOWN_ERROR";

  if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
    errorMessage =
      "The connection to the FDA API timed out. Please try again later.";
  } else if (error.response?.status === 429) {
    errorMessage = "Too many requests to the FDA API. Please try again later.";
  } else if (error.response?.status >= 500) {
    errorMessage =
      "The FDA API is currently experiencing issues. Please try again later.";
  }

  return {
    error: errorMessage,
    code: errorCode,
    status: error.response?.status,
  };
};

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

    const response = await retryApiCall(() =>
      fdaAxios.get<FDALabelResponse>(FDA_API_BASE_URL, {
        params: {
          search: `openfda.brand_name:${brandName}`,
          limit: 10,
          api_key: API_KEY,
        },
      })
    );

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
      const errorResponse = handleApiError(error);
      res.status(500).json(errorResponse);
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

    const response = await retryApiCall(() =>
      fdaAxios.get<FDALabelResponse>(FDA_API_BASE_URL, {
        params: {
          search: `id:"${id}"`,
          api_key: API_KEY,
        },
      })
    );

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
      const errorResponse = handleApiError(error);
      res.status(500).json(errorResponse);
    }
  }
};

export const getAllDrugs: AsyncRequestHandler = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const response = await retryApiCall(() =>
      fdaAxios.get<FDALabelResponse>(FDA_API_BASE_URL, {
        params: {
          limit,
          skip,
          api_key: API_KEY,
        },
      })
    );

    const patientFriendlyResults = response.data.results.map(
      filterDrugDataForPatient
    );
    res.json({
      meta: response.data.meta,
      results: patientFriendlyResults,
    });
  } catch (error: any) {
    const errorResponse = handleApiError(error);
    res.status(500).json(errorResponse);
  }
};
