import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChartsPage from "@/app/charts/page";
import { api, ModelMetadataResponse, SweepResponse, ApiClientError } from "@/lib/api";

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
    cake_thickness_cm: "h(t)",
    filtrate_volume_cc: "Q(t)",
    shared_parameter: "B3",
    note: "",
  },
  limitations: ["Sandstone core only"],
};

const mockTimeSweepResponse: SweepResponse = {
  sweep_variable: "time",
  x_values: [36, 48, 72, 96, 120],
  x_unit: "hr",
  results: {
    cake_thickness_cm: [0.05, 0.15, 0.27, 0.34, 0.36],
    filtrate_volume_cc: [18.2, 23.9, 32.7, 40.1, 48.2],
  },
  source_observations: {
    has_matching_series: true,
    series_label: "Published Digitised Data (Experimental, Figs. 1 & 3)",
    x_values: [24, 48, 72, 96, 120],
    cake_thickness_cm: [0.0, 0.153, 0.275, 0.387, 0.356],
    filtrate_volume_cc: [15.8, 23.8, 32.8, 40.2, 48.0],
    note: "Source Figs. 1 & 3 data measured along time path at reference pressure.",
  },
  metadata: {
    calibration: "experimental",
    sweep_variable: "time",
    points: 100,
    on_source_path: true,
    warnings: [],
  },
};

const mockPressureSweepResponse: SweepResponse = {
  sweep_variable: "mud_pressure",
  x_values: [650, 1650, 2650, 3650, 4650],
  x_unit: "psi",
  results: {
    cake_thickness_cm: [0.12, 0.22, 0.35, 0.48, 0.43],
    filtrate_volume_cc: [15.0, 25.0, 40.0, 52.0, 49.0],
  },
  source_observations: {
    has_matching_series: true,
    series_label: "Published Digitised Data (Experimental, Fig. 2)",
    x_values: [650, 1650, 2650, 3650, 4650],
    cake_thickness_cm: [0.15, 0.249, 0.399, 0.5, 0.449],
    filtrate_volume_cc: null, // Crucial: no Q(P) series
    note: "Digitised points from Akinsete & Isehunwa (2013) Fig. 2. Note: No cumulative filtrate volume Q(P) curve was published in the source literature.",
  },
  metadata: {
    calibration: "experimental",
    sweep_variable: "mud_pressure",
    points: 100,
    on_source_path: true,
    warnings: [
      "Cumulative filtrate volume vs pressure is estimated via the separability assumption (Q ~ h with pressure, Eq. 10); no published Q(P) experimental dataset exists.",
    ],
  },
};

describe("Chart Explorer (/charts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getModelMetadata").mockResolvedValue(mockMetadata);
    vi.spyOn(api, "computeSweep").mockResolvedValue(mockTimeSweepResponse);
  });

  it("renders configuration controls and defaults to Time sweep", async () => {
    render(<ChartsPage />);

    expect(screen.getByText("Chart Explorer")).toBeDefined();
    expect(screen.getByLabelText(/Independent Sweep Variable/i)).toBeDefined();
    expect(screen.getByLabelText(/Calibration Dataset/i)).toBeDefined();
    expect(screen.getByLabelText(/Fixed Deviation Angle/i)).toBeDefined();

    // Default pressure loads from metadata
    await waitFor(() => {
      expect(screen.getByDisplayValue("2410.16")).toBeDefined();
    });
  });

  it("switches calibration dataset and automatically updates reference pressure", async () => {
    render(<ChartsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("2410.16")).toBeDefined();
    });

    const calibSelect = screen.getByLabelText(/Calibration Dataset/i);
    fireEvent.change(calibSelect, { target: { value: "model" } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("3209.35")).toBeDefined();
    });
  });

  it("switches sweep variable to Deviation Angle and updates complementary inputs", async () => {
    render(<ChartsPage />);

    const sweepSelect = screen.getByLabelText(/Independent Sweep Variable/i);
    fireEvent.change(sweepSelect, { target: { value: "deviation_angle" } });

    await waitFor(() => {
      // Exposure Time should now be a fixed input, while deviation angle is swept
      expect(screen.getByLabelText(/Fixed Exposure Time/i)).toBeDefined();
      expect(screen.getByLabelText(/Fixed Mud Pressure/i)).toBeDefined();
    });
  });

  it("switches sweep variable to Mud Pressure and updates complementary inputs", async () => {
    render(<ChartsPage />);

    const sweepSelect = screen.getByLabelText(/Independent Sweep Variable/i);
    fireEvent.change(sweepSelect, { target: { value: "mud_pressure" } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Fixed Exposure Time/i)).toBeDefined();
      expect(screen.getByLabelText(/Fixed Deviation Angle/i)).toBeDefined();
    });
  });

  it("submits sweep request and renders both cake thickness and filtrate volume viewports", async () => {
    render(<ChartsPage />);

    const submitBtn = screen.getByRole("button", { name: /Generate Charts/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Mud-Cake Thickness")).toBeDefined();
      expect(screen.getByText("Cumulative Filtrate Loss")).toBeDefined();
      expect(screen.getByText(/h \[cm\]/i)).toBeDefined();
      expect(screen.getByText(/Q \[cc\]/i)).toBeDefined();
    });
  });

  it("handles Pressure sweep with observation fidelity (Q(P) note present and no fake observations)", async () => {
    vi.spyOn(api, "computeSweep").mockResolvedValue(mockPressureSweepResponse);
    render(<ChartsPage />);

    const sweepSelect = screen.getByLabelText(/Independent Sweep Variable/i);
    fireEvent.change(sweepSelect, { target: { value: "mud_pressure" } });

    const submitBtn = screen.getByRole("button", { name: /Generate Charts/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Notice for pressure sweep filtrate volume
      expect(
        screen.getByText(/No cumulative filtrate volume Q\(P\) series was published/i)
      ).toBeDefined();
    });
  });

  it("displays extrapolation warning when fixed inputs are outside calibrated range", async () => {
    const mockExtrapSweep: SweepResponse = {
      ...mockTimeSweepResponse,
      metadata: {
        ...mockTimeSweepResponse.metadata,
        warnings: ["Fixed deviation angle is outside the calibrated domain (30-90°)."],
      },
    };
    vi.spyOn(api, "computeSweep").mockResolvedValue(mockExtrapSweep);

    render(<ChartsPage />);
    const submitBtn = screen.getByRole("button", { name: /Generate Charts/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Domain Extrapolation Notice/i)).toBeDefined();
    });
  });

  it("displays separability warning when returned by backend", async () => {
    const mockSeparabilitySweep: SweepResponse = {
      ...mockTimeSweepResponse,
      metadata: {
        ...mockTimeSweepResponse.metadata,
        warnings: [
          "Fixed inclination differs from reference path angle; calculation assumes separability.",
        ],
      },
    };
    vi.spyOn(api, "computeSweep").mockResolvedValue(mockSeparabilitySweep);

    render(<ChartsPage />);
    const submitBtn = screen.getByRole("button", { name: /Generate Charts/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Multiplicative Separability Active/i)).toBeDefined();
    });
  });

  it("handles backend API error gracefully", async () => {
    vi.spyOn(api, "computeSweep").mockRejectedValue(
      new ApiClientError("Invalid sweep variable parameter", 422, "VALIDATION_ERROR")
    );

    render(<ChartsPage />);
    const submitBtn = screen.getByRole("button", { name: /Generate Charts/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Chart Generation Failed/i)).toBeDefined();
      expect(screen.getByText(/Invalid sweep variable parameter/i)).toBeDefined();
    });
  });

  it("resets form inputs to defaults when Reset button is clicked", async () => {
    render(<ChartsPage />);

    const sweepSelect = screen.getByLabelText(/Independent Sweep Variable/i);
    fireEvent.change(sweepSelect, { target: { value: "deviation_angle" } });

    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Fixed Deviation Angle/i)).toBeDefined();
    });
  });
});
