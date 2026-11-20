import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, getApiBaseUrl, ApiClientError } from "@/lib/api";

describe("API Client Layer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the API base URL cleanly", () => {
    const url = getApiBaseUrl();
    expect(url).toContain("/api/v1");
  });

  it("fetches model metadata successfully", async () => {
    const mockMetadata = {
      name: "Formation Damage Simulator",
      service_version: "1.0.0",
      model_version: "1.0.0",
      citation: "Akinsete & Isehunwa (2013)",
      domain: {
        time_hr: { min: 36, max: 120, unit: "hr", description: "time" },
        deviation_angle_deg: { min: 30, max: 90, unit: "°", description: "angle" },
        mud_pressure_psi: { min: 650, max: 4650, unit: "psi", description: "pressure" },
      },
      calibrations: [
        { id: "experimental", name: "Experimental", description: "exp", p_ref_psi: 2410.16, b_parameters: [], parameter_names: [] },
      ],
      drilling_path: { formula: "theta_path", description: "path", separability_threshold_deg: 5 },
      governing_equations: { cake_thickness_cm: "h(t)", filtrate_volume_cc: "Q(t)", shared_parameter: "B3", note: "" },
      limitations: ["limitation 1"],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockMetadata,
    } as Response);

    const result = await api.getModelMetadata();
    expect(result.name).toBe("Formation Damage Simulator");
    expect(result.calibrations[0].p_ref_psi).toBe(2410.16);
  });

  it("computes point prediction with structured payload", async () => {
    const mockPrediction = {
      inputs: { time_hr: 96, deviation_angle_deg: 60, mud_pressure_psi: 2410.16 },
      calibration: "experimental",
      model_version: "1.0.0",
      results: { cake_thickness_cm: 0.340652, filtrate_volume_cc: 40.059122 },
      uncertainty: {
        level: 95,
        cake_thickness_cm: { lower: 0.301, median: 0.340, upper: 0.380 },
        filtrate_volume_cc: { lower: 35.1, median: 40.0, upper: 44.9 },
        ensemble_size: 300,
        notice: "Bootstrap uncertainty notice",
      },
      domain: {
        within_calibrated_ranges: true,
        on_source_path: true,
        source_path_angle_deg: 60,
        warnings: [],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockPrediction,
    } as Response);

    const result = await api.computePrediction({
      time_hr: 96,
      deviation_angle_deg: 60,
      mud_pressure_psi: 2410.16,
      calibration: "experimental",
      include_uncertainty: true,
    });

    expect(result.results.cake_thickness_cm).toBeCloseTo(0.340652);
    expect(result.results.filtrate_volume_cc).toBeCloseTo(40.059122);
    expect(result.uncertainty?.cake_thickness_cm.median).toBe(0.34);
    expect(result.domain.within_calibrated_ranges).toBe(true);
  });

  it("handles structured backend API error responses properly", async () => {
    const errorPayload = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed for time_hr: Input should be greater than 0",
        details: { field: "time_hr" },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => errorPayload,
    } as Response);

    await expect(
      api.computePrediction({
        time_hr: -5,
        deviation_angle_deg: 60,
        mud_pressure_psi: 2400,
        calibration: "experimental",
      })
    ).rejects.toThrowError(ApiClientError);
  });

  it("handles network connection failure gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(api.checkHealth()).rejects.toThrowError("Failed to fetch");
  });
});
