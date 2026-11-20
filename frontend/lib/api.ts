/**
 * Central API Client for Formation Damage Simulator.
 * Provides typed access to FastAPI scientific endpoints.
 */

export interface RangeMetadata {
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface DomainMetadata {
  time_hr: RangeMetadata;
  deviation_angle_deg: RangeMetadata;
  mud_pressure_psi: RangeMetadata;
}

export interface CalibrationMetadata {
  id: "experimental" | "model";
  name: string;
  description: string;
  p_ref_psi: number;
  b_parameters: number[];
  parameter_names: string[];
}

export interface DrillingPathMetadata {
  formula: string;
  description: string;
  separability_threshold_deg: number;
}

export interface GoverningEquationsMetadata {
  cake_thickness_cm: string;
  filtrate_volume_cc: string;
  shared_parameter: string;
  note: string;
}

export interface ModelMetadataResponse {
  name: string;
  service_version: string;
  model_version: string;
  citation: string;
  domain: DomainMetadata;
  calibrations: CalibrationMetadata[];
  drilling_path: DrillingPathMetadata;
  governing_equations: GoverningEquationsMetadata;
  limitations: string[];
}

export interface PredictionRequest {
  time_hr: number;
  deviation_angle_deg: number;
  mud_pressure_psi: number;
  calibration: "experimental" | "model";
  include_uncertainty?: boolean;
  uncertainty_level?: number;
}

export interface PredictionInputs {
  time_hr: number;
  deviation_angle_deg: number;
  mud_pressure_psi: number;
}

export interface PredictionResults {
  cake_thickness_cm: number;
  filtrate_volume_cc: number;
}

export interface PercentileInterval {
  lower: number;
  median: number;
  upper: number;
}

export interface UncertaintyData {
  level: number;
  cake_thickness_cm: PercentileInterval;
  filtrate_volume_cc: PercentileInterval;
  ensemble_size: number;
  notice: string;
}

export interface DomainStatus {
  within_calibrated_ranges: boolean;
  on_source_path: boolean;
  source_path_angle_deg: number;
  warnings: string[];
}

export interface DatasetColumnMetadata {
  name: string;
  unit: string;
  data_type: string;
  description: string;
}

export interface DatasetGenerateRequest {
  time_steps: number;
  angle_steps: number;
  pressure_steps: number;
  time_range_hr: [number, number];
  angle_range_deg: [number, number];
  pressure_range_psi: [number, number];
  calibration: "experimental" | "model";
  preview_rows?: number;
}

export interface DatasetRow {
  time_hr: number;
  deviation_angle_deg: number;
  mud_pressure_psi: number;
  cake_thickness_cm: number;
  filtrate_volume_cc: number;
  source_path_angle_deg: number;
  off_path: boolean;
  [key: string]: unknown;
}

export interface DatasetGenerateResponse {
  row_count: number;
  off_source_path_count: number;
  calibration: string;
  columns: DatasetColumnMetadata[];
  preview: DatasetRow[];
  download_url: string;
}

export interface FixedInputs {
  time_hr?: number;
  deviation_angle_deg?: number;
  mud_pressure_psi?: number;
}

export interface SweepRequest {
  sweep_variable: "time" | "deviation_angle" | "mud_pressure";
  calibration?: "experimental" | "model";
  fixed_inputs: FixedInputs;
  points?: number;
  include_source_observations?: boolean;
}

export interface SweepResults {
  cake_thickness_cm: number[];
  filtrate_volume_cc: number[];
}

export interface SourceObservations {
  has_matching_series: boolean;
  series_label?: string | null;
  x_values?: number[] | null;
  cake_thickness_cm?: number[] | null;
  filtrate_volume_cc?: number[] | null;
  note?: string | null;
}

export interface SweepMetadata {
  calibration: string;
  sweep_variable: string;
  points: number;
  on_source_path: boolean;
  warnings: string[];
}

export interface SweepResponse {
  sweep_variable: string;
  x_values: number[];
  x_unit: string;
  results: SweepResults;
  source_observations: SourceObservations;
  metadata: SweepMetadata;
}

export interface PredictionResponse {
  inputs: PredictionInputs;
  calibration: string;
  model_version: string;
  results: PredictionResults;
  uncertainty?: UncertaintyData | null;
  domain: DomainStatus;
}

export interface HealthResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  model_version: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number = 500, code: string = "API_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Resolves the API base URL prefix with normalization.
 * Strips any trailing slashes and ensures '/api/v1' path is present.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envUrl) {
    return "http://127.0.0.1:8000/api/v1";
  }
  const clean = envUrl.trim().replace(/\/+$/, "");
  if (clean.endsWith("/api/v1")) {
    return clean;
  }
  return `${clean}/api/v1`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const rawData = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (typeof rawData === "object" && rawData !== null && "error" in rawData) {
        const errObj = (rawData as { error: ApiErrorDetail }).error;
        throw new ApiClientError(
          errObj.message || "An error occurred while communicating with the backend.",
          response.status,
          errObj.code || "API_ERROR",
          errObj.details
        );
      }
      const fallbackMsg = typeof rawData === "string" ? rawData : response.statusText;
      throw new ApiClientError(
        fallbackMsg || `Request failed with status ${response.status}`,
        response.status,
        "HTTP_ERROR"
      );
    }

    return rawData as T;
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Failed to connect to the scientific calculation engine.";
    throw new ApiClientError(
      `Network or server connection failed: ${message}`,
      0,
      "CONNECTION_ERROR"
    );
  }
}

export const api = {
  checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health", { method: "GET", cache: "no-store" });
  },

  getModelMetadata(): Promise<ModelMetadataResponse> {
    return request<ModelMetadataResponse>("/model/metadata", { method: "GET" });
  },

  computePrediction(payload: PredictionRequest): Promise<PredictionResponse> {
    return request<PredictionResponse>("/predictions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  computeSweep(payload: SweepRequest): Promise<SweepResponse> {
    return request<SweepResponse>("/charts/sweep", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  generateDataset(payload: DatasetGenerateRequest): Promise<DatasetGenerateResponse> {
    return request<DatasetGenerateResponse>("/datasets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Export full dataset as CSV. Returns raw Response so caller can stream the blob.
   * Uses a direct fetch to avoid the JSON parsing in the shared `request()` helper.
   */
  async exportDatasetCsv(payload: DatasetGenerateRequest): Promise<Response> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/datasets/export`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/csv",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const isJson = response.headers.get("content-type")?.includes("application/json");
        const rawData = isJson ? await response.json() : await response.text();
        if (typeof rawData === "object" && rawData !== null && "error" in rawData) {
          const errObj = (rawData as { error: ApiErrorDetail }).error;
          throw new ApiClientError(
            errObj.message || "Export failed.",
            response.status,
            errObj.code || "API_ERROR",
            errObj.details
          );
        }
        const fallbackMsg = typeof rawData === "string" ? rawData : response.statusText;
        throw new ApiClientError(fallbackMsg || `Export failed with status ${response.status}`, response.status, "HTTP_ERROR");
      }
      return response;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) throw err;
      const message = err instanceof Error ? err.message : "Failed to connect to the scientific calculation engine.";
      throw new ApiClientError(`Network or server connection failed: ${message}`, 0, "CONNECTION_ERROR");
    }
  },
};
