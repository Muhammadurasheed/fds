import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EstimatePage from "@/app/estimate/page";
import { api, ModelMetadataResponse, PredictionResponse, ApiClientError } from "@/lib/api";

const mockMetadata: ModelMetadataResponse = {
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
    {
      id: "experimental",
      name: "Experimental Data (Default)",
      description: "Direct empirical fit",
      p_ref_psi: 2410.16,
      b_parameters: [0.0025, 0.0716, -0.0058, 8.6379, -0.259],
      parameter_names: ["B1", "B2", "B3", "B4", "B5"],
    },
    {
      id: "model",
      name: "Present Model Curve",
      description: "Simulation fit",
      p_ref_psi: 3209.35,
      b_parameters: [0.0036, 0.1009, -0.009, 7.2318, -0.209],
      parameter_names: ["B1", "B2", "B3", "B4", "B5"],
    },
  ],
  drilling_path: {
    formula: "theta_path(t) = 20 + (10/24)*t",
    description: "Trajectory coupling",
    separability_threshold_deg: 5,
  },
  governing_equations: {
    cake_thickness_cm: "h(t) = sqrt(max(0, B1*t - B2*exp(-B3*t)))",
    filtrate_volume_cc: "Q(t) = B4*exp(-B3*t) - B5*t",
    shared_parameter: "B3",
    note: "Multiplicative separability",
  },
  limitations: ["Sandstone core flood only"],
};

const mockStandardPrediction: PredictionResponse = {
  inputs: { time_hr: 96, deviation_angle_deg: 60, mud_pressure_psi: 2410.16 },
  calibration: "experimental",
  model_version: "1.0.0",
  results: {
    cake_thickness_cm: 0.340652,
    filtrate_volume_cc: 40.059122,
  },
  uncertainty: {
    level: 95,
    cake_thickness_cm: { lower: 0.3012, median: 0.3401, upper: 0.3805 },
    filtrate_volume_cc: { lower: 35.12, median: 40.01, upper: 44.95 },
    ensemble_size: 300,
    notice: "Bootstrap intervals quantify empirical parameter uncertainty of B1-B5.",
  },
  domain: {
    within_calibrated_ranges: true,
    on_source_path: true,
    source_path_angle_deg: 60.0,
    warnings: [],
  },
};

describe("Estimation Workspace (/estimate)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getModelMetadata").mockResolvedValue(mockMetadata);
  });

  it("renders estimation form with default inputs and loads metadata reference pressure", async () => {
    render(<EstimatePage />);

    expect(screen.getByText("Formation Damage Estimator")).toBeDefined();
    expect(screen.getByLabelText(/Drilling Time/i)).toBeDefined();
    expect(screen.getByLabelText(/Deviation Angle/i)).toBeDefined();

    // Check that metadata loaded and updated pressure to 2410.16
    await waitFor(() => {
      const pressureInput = screen.getByDisplayValue("2410.16");
      expect(pressureInput).toBeDefined();
    });
  });

  it("switches calibration dataset and automatically updates reference pressure", async () => {
    render(<EstimatePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("2410.16")).toBeDefined();
    });

    const select = screen.getByLabelText(/Calibration Dataset/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "model" } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("3209.35")).toBeDefined();
    });
  });

  it("validates client-side physical constraints and prevents submission on negative time", async () => {
    render(<EstimatePage />);
    const computeSpy = vi.spyOn(api, "computePrediction");

    const timeInput = screen.getByLabelText(/Drilling Time/i);
    fireEvent.change(timeInput, { target: { value: "-10" } });

    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Exposure time must be strictly positive/i)).toBeDefined();
    });
    expect(computeSpy).not.toHaveBeenCalled();
  });

  it("validates wellbore deviation angle boundaries (0 to 90 degrees)", async () => {
    render(<EstimatePage />);
    const computeSpy = vi.spyOn(api, "computePrediction");

    const angleInput = screen.getByLabelText(/Deviation Angle/i);
    fireEvent.change(angleInput, { target: { value: "110" } });

    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Wellbore inclination must be between 0°/i)).toBeDefined();
    });
    expect(computeSpy).not.toHaveBeenCalled();
  });

  it("submits valid prediction and displays returned results with uncertainty bounds", async () => {
    vi.spyOn(api, "computePrediction").mockResolvedValue(mockStandardPrediction);
    render(<EstimatePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("2410.16")).toBeDefined();
    });

    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Cake thickness check
      expect(screen.getByText("0.3407")).toBeDefined();
      // Filtrate volume check
      expect(screen.getByText("40.06")).toBeDefined();
      // Uncertainty visual check
      expect(screen.getByText(/Bootstrap Parameter Uncertainty Analysis/i)).toBeDefined();
      // Distinguish median from point prediction
      expect(screen.getAllByText(/Median \(50%\)/i).length).toBeGreaterThan(0);
    });
  });

  it("displays extrapolation warning when inputs are outside calibrated domain", async () => {
    const mockExtrapolation: PredictionResponse = {
      ...mockStandardPrediction,
      inputs: { time_hr: 200, deviation_angle_deg: 60, mud_pressure_psi: 2410.16 },
      domain: {
        within_calibrated_ranges: false,
        on_source_path: true,
        source_path_angle_deg: 103.3,
        warnings: ["time outside calibrated range 36-120 hr (extrapolation)"],
      },
    };
    vi.spyOn(api, "computePrediction").mockResolvedValue(mockExtrapolation);

    render(<EstimatePage />);
    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Domain Extrapolation Active/i)).toBeDefined();
      expect(screen.getByText(/time outside calibrated range/i)).toBeDefined();
    });
  });

  it("displays separability warning when deviation angle differs from source trajectory", async () => {
    const mockSeparability: PredictionResponse = {
      ...mockStandardPrediction,
      inputs: { time_hr: 96, deviation_angle_deg: 85, mud_pressure_psi: 2410.16 },
      domain: {
        within_calibrated_ranges: true,
        on_source_path: false,
        source_path_angle_deg: 60.0,
        warnings: [
          "angle differs from the source drilling path: combined estimate rests on the separability assumption",
        ],
      },
    };
    vi.spyOn(api, "computePrediction").mockResolvedValue(mockSeparability);

    render(<EstimatePage />);
    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Separability Assumption Active/i)).toBeDefined();
      expect(screen.getByText(/combined estimate rests on the separability assumption/i)).toBeDefined();
    });
  });

  it("handles structured backend validation error (422) and shows error banner", async () => {
    vi.spyOn(api, "computePrediction").mockRejectedValue(
      new ApiClientError("Validation failed for time_hr: must be > 0", 422, "VALIDATION_ERROR", {
        field: "time_hr",
        issues: [{ loc: ["time_hr"], msg: "must be > 0" }],
      })
    );

    render(<EstimatePage />);
    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Calculation Failed \(VALIDATION_ERROR\)/i)).toBeDefined();
    });
  });

  it("handles backend unavailability and presents recovery instructions", async () => {
    vi.spyOn(api, "computePrediction").mockRejectedValue(
      new ApiClientError("Network or server connection failed", 0, "CONNECTION_ERROR")
    );

    render(<EstimatePage />);
    const submitBtn = screen.getByRole("button", { name: /Calculate Prediction/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Calculation Failed \(CONNECTION_ERROR\)/i)).toBeDefined();
      expect(screen.getAllByText(/python run\.py/i).length).toBeGreaterThan(0);
    });
  });

  it("resets form inputs to defaults when Reset button is clicked", async () => {
    render(<EstimatePage />);

    const timeInput = screen.getByLabelText(/Drilling Time/i) as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: "50" } });
    expect(timeInput.value).toBe("50");

    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(timeInput.value).toBe("96.0");
  });
});
