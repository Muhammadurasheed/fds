import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DatasetPage from "@/app/dataset/page";
import { api, ModelMetadataResponse, DatasetGenerateResponse, ApiClientError } from "@/lib/api";

// ─── shared mock data ─────────────────────────────────────────────────────────

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
      name: "Experimental Calibration",
      description: "Direct empirical fit",
      p_ref_psi: 2410.16,
      b_parameters: [0.0025, 0.0716, -0.0058, 8.6379, -0.259],
      parameter_names: ["B1", "B2", "B3", "B4", "B5"],
    },
    {
      id: "model",
      name: "Model Calibration",
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

function makePreviewRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    time_hr: 36 + i * 3,
    deviation_angle_deg: 30 + i * 2,
    mud_pressure_psi: 650 + i * 100,
    cake_thickness_cm: 0.1 + i * 0.01,
    filtrate_volume_cc: 10 + i * 0.5,
    source_path_angle_deg: 55.0,
    off_path: i % 3 === 0,
  }));
}

const mockDatasetResponse: DatasetGenerateResponse = {
  row_count: 300,
  off_source_path_count: 12,
  calibration: "experimental",
  columns: [
    { name: "time_hr", unit: "hr", data_type: "float", description: "Exposure time" },
    { name: "deviation_angle_deg", unit: "°", data_type: "float", description: "Inclination" },
    { name: "mud_pressure_psi", unit: "psi", data_type: "float", description: "Mud pressure" },
    { name: "cake_thickness_cm", unit: "cm", data_type: "float", description: "Mud-cake thickness" },
    { name: "filtrate_volume_cc", unit: "cc", data_type: "float", description: "Filtrate volume" },
    { name: "source_path_angle_deg", unit: "°", data_type: "float", description: "Source path angle" },
    { name: "off_path", unit: "", data_type: "bool", description: "Off source path flag" },
  ],
  preview: makePreviewRows(20),
  download_url: "/api/v1/datasets/export",
};

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
  // Default: metadata loads successfully, no dataset yet
  vi.spyOn(api, "getModelMetadata").mockResolvedValue(mockMetadata);
  vi.spyOn(api, "generateDataset").mockResolvedValue(mockDatasetResponse);
  vi.spyOn(api, "exportDatasetCsv").mockResolvedValue(
    new Response("col1,col2\n1,2\n", {
      headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=test.csv" },
    })
  );
});

// ─── rendering ───────────────────────────────────────────────────────────────

describe("DatasetPage rendering", () => {
  it("renders the page header", async () => {
    render(<DatasetPage />);
    expect(screen.getByText(/Structured Grid Dataset Generator/i)).toBeTruthy();
  });

  it("shows the empty state before generation", () => {
    render(<DatasetPage />);
    expect(screen.getByText(/Awaiting Grid Configuration/i)).toBeTruthy();
  });

  it("renders step count inputs", () => {
    render(<DatasetPage />);
    expect(screen.getByLabelText(/Time Steps/i)).toBeTruthy();
    expect(screen.getByLabelText(/Angle Steps/i)).toBeTruthy();
    expect(screen.getByLabelText(/Pressure Steps/i)).toBeTruthy();
  });

  it("renders range boundary inputs", () => {
    render(<DatasetPage />);
    expect(screen.getByLabelText(/Min Time/i)).toBeTruthy();
    expect(screen.getByLabelText(/Max Time/i)).toBeTruthy();
    expect(screen.getByLabelText(/Min Angle/i)).toBeTruthy();
    expect(screen.getByLabelText(/Max Angle/i)).toBeTruthy();
    expect(screen.getByLabelText(/Min Pressure/i)).toBeTruthy();
    expect(screen.getByLabelText(/Max Pressure/i)).toBeTruthy();
  });

  it("renders calibration selector", () => {
    render(<DatasetPage />);
    expect(screen.getByLabelText(/Calibration Basis/i)).toBeTruthy();
  });

  it("shows the generate button", () => {
    render(<DatasetPage />);
    expect(screen.getByRole("button", { name: /Generate Dataset Preview/i })).toBeTruthy();
  });
});

// ─── row count calculation ────────────────────────────────────────────────────

describe("Row count calculation", () => {
  it("displays projected row count correctly (25 × 13 × 15 = 4875)", () => {
    render(<DatasetPage />);
    // Default values: 25 × 13 × 15 = 4875
    expect(screen.getByLabelText(/Projected grid volume/i)).toBeTruthy();
    expect(screen.getByText(/4,875 rows/i)).toBeTruthy();
  });

  it("shows error when projected rows exceed 50 000", async () => {
    render(<DatasetPage />);
    const timeInput = screen.getByLabelText(/Time Steps/i);
    const angleInput = screen.getByLabelText(/Angle Steps/i);
    const pressureInput = screen.getByLabelText(/Pressure Steps/i);

    fireEvent.change(timeInput, { target: { value: "100" } });
    fireEvent.change(angleInput, { target: { value: "50" } });
    fireEvent.change(pressureInput, { target: { value: "50" } });

    // 100 × 50 × 50 = 250 000 — over limit
    await waitFor(() => {
      expect(screen.getByText(/Grid exceeds/i)).toBeTruthy();
    });
  });

  it("disables generate button when over limit", async () => {
    render(<DatasetPage />);
    const timeInput = screen.getByLabelText(/Time Steps/i);
    fireEvent.change(timeInput, { target: { value: "100" } });
    const angleInput = screen.getByLabelText(/Angle Steps/i);
    fireEvent.change(angleInput, { target: { value: "50" } });
    const pressureInput = screen.getByLabelText(/Pressure Steps/i);
    fireEvent.change(pressureInput, { target: { value: "50" } });

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
      expect(btn).toHaveProperty("disabled", true);
    });
  });
});

// ─── validation ───────────────────────────────────────────────────────────────

describe("Input validation", () => {
  it("shows error when min time >= max time", async () => {
    render(<DatasetPage />);
    const minTime = screen.getByLabelText(/Min Time/i);
    const maxTime = screen.getByLabelText(/Max Time/i);
    fireEvent.change(minTime, { target: { value: "120" } });
    fireEvent.change(maxTime, { target: { value: "36" } });

    const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Min Time must be less than Max Time/i)).toBeTruthy();
    });
  });

  it("shows error when min angle >= max angle", async () => {
    render(<DatasetPage />);
    const minA = screen.getByLabelText(/Min Angle/i);
    const maxA = screen.getByLabelText(/Max Angle/i);
    fireEvent.change(minA, { target: { value: "80" } });
    fireEvent.change(maxA, { target: { value: "30" } });

    const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Min Angle must be less than Max Angle/i)).toBeTruthy();
    });
  });

  it("shows error when step count is below 2", async () => {
    render(<DatasetPage />);
    const timeInput = screen.getByLabelText(/Time Steps/i);
    fireEvent.change(timeInput, { target: { value: "1" } });

    const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Time Steps must be an integer between 2 and 100/i)).toBeTruthy();
    });
  });
});

// ─── domain warnings ─────────────────────────────────────────────────────────

describe("Domain extrapolation warnings", () => {
  it("shows out-of-domain warning when min time is below calibrated range", async () => {
    render(<DatasetPage />);
    // Wait for metadata to load
    await waitFor(() => expect(api.getModelMetadata).toHaveBeenCalled());

    const minTime = screen.getByLabelText(/Min Time/i);
    fireEvent.change(minTime, { target: { value: "10" } }); // below 36 hr

    await waitFor(() => {
      expect(screen.getByText(/below the calibrated range/i)).toBeTruthy();
    });
  });

  it("shows out-of-domain warning when max pressure exceeds calibrated range", async () => {
    render(<DatasetPage />);
    await waitFor(() => expect(api.getModelMetadata).toHaveBeenCalled());

    const maxP = screen.getByLabelText(/Max Pressure/i);
    fireEvent.change(maxP, { target: { value: "9000" } }); // above 4650 psi

    await waitFor(() => {
      expect(screen.getByText(/exceeds the calibrated range/i)).toBeTruthy();
    });
  });
});

// ─── generation ───────────────────────────────────────────────────────────────

describe("Dataset generation", () => {
  it("calls generateDataset with the correct payload on submit", async () => {
    render(<DatasetPage />);
    const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
    fireEvent.click(btn);

    await waitFor(() => expect(api.generateDataset).toHaveBeenCalledOnce());

    const [payload] = vi.mocked(api.generateDataset).mock.calls[0];
    expect(payload.time_steps).toBe(25);
    expect(payload.angle_steps).toBe(13);
    expect(payload.pressure_steps).toBe(15);
    expect(payload.time_range_hr).toEqual([36, 120]);
    expect(payload.angle_range_deg).toEqual([30, 90]);
    expect(payload.pressure_range_psi).toEqual([650, 4650]);
    expect(payload.calibration).toBe("experimental");
    expect(payload.preview_rows).toBe(20);
  });

  it("propagates calibration selection to the API request", async () => {
    render(<DatasetPage />);
    const select = screen.getByLabelText(/Calibration Basis/i);
    fireEvent.change(select, { target: { value: "model" } });

    const btn = screen.getByRole("button", { name: /Generate Dataset Preview/i });
    fireEvent.click(btn);

    await waitFor(() => expect(api.generateDataset).toHaveBeenCalledOnce());
    const [payload] = vi.mocked(api.generateDataset).mock.calls[0];
    expect(payload.calibration).toBe("model");
  });

  it("renders summary statistics after successful generation", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dataset Summary/i)).toBeTruthy();
    });

    expect(screen.getByText("300")).toBeTruthy(); // total rows
    expect(screen.getByText("12")).toBeTruthy();  // off-path rows
  });

  it("renders preview table rows after generation", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Grid Dataset Preview/i)).toBeTruthy();
    });

    // Check column headers are present
    expect(screen.getByText(/time_hr \[hr\]/i)).toBeTruthy();
    expect(screen.getByText(/cake_thickness \[cm\]/i)).toBeTruthy();
    expect(screen.getByText(/filtrate_vol \[cc\]/i)).toBeTruthy();
  });

  it("shows Off Path and On Path badges in the preview table", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      const offBadges = screen.getAllByText(/Off Path/i);
      const onBadges = screen.getAllByText(/On Path/i);
      expect(offBadges.length).toBeGreaterThan(0);
      expect(onBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays backend API errors", async () => {
    vi.mocked(api.generateDataset).mockRejectedValueOnce(
      new ApiClientError("DATASET_LIMIT_EXCEEDED: too many rows", 400, "DATASET_LIMIT_EXCEEDED")
    );

    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Generation Failed/i)).toBeTruthy();
      expect(screen.getByText(/DATASET_LIMIT_EXCEEDED/i)).toBeTruthy();
    });
  });

  it("displays network errors gracefully", async () => {
    vi.mocked(api.generateDataset).mockRejectedValueOnce(
      new ApiClientError("Network or server connection failed", 0, "CONNECTION_ERROR")
    );

    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Generation Failed/i)).toBeTruthy();
    });
  });
});

// ─── stale data detection ────────────────────────────────────────────────────

describe("Stale data detection", () => {
  it("shows stale warning when configuration changes after generation", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dataset Summary/i)).toBeTruthy();
    });

    // Modify a field
    const timeInput = screen.getByLabelText(/Time Steps/i);
    fireEvent.change(timeInput, { target: { value: "30" } });

    await waitFor(() => {
      expect(screen.getByText(/Configuration Changed/i)).toBeTruthy();
    });
  });

  it("clears stale warning after re-generation", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => expect(screen.getByText(/Dataset Summary/i)).toBeTruthy());

    // Change a field → stale
    const timeInput = screen.getByLabelText(/Time Steps/i);
    fireEvent.change(timeInput, { target: { value: "30" } });
    await waitFor(() => expect(screen.getByText(/Configuration Changed/i)).toBeTruthy());

    // Re-generate
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Configuration Changed/i)).toBeNull();
    });
  });
});

// ─── CSV export ───────────────────────────────────────────────────────────────

describe("CSV export", () => {
  it("calls exportDatasetCsv with matching config after generation", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => expect(screen.getByText(/Dataset Summary/i)).toBeTruthy());

    // aria-label is "Export full dataset as CSV"; button text is "Export Full CSV"
    const exportBtn = screen.getByRole("button", { name: /Export full dataset as CSV/i });
    fireEvent.click(exportBtn);

    await waitFor(() => expect(api.exportDatasetCsv).toHaveBeenCalledOnce());

    const [exportPayload] = vi.mocked(api.exportDatasetCsv).mock.calls[0];
    const [genPayload] = vi.mocked(api.generateDataset).mock.calls[0];

    // Config must match exactly
    expect(exportPayload.time_steps).toBe(genPayload.time_steps);
    expect(exportPayload.angle_steps).toBe(genPayload.angle_steps);
    expect(exportPayload.pressure_steps).toBe(genPayload.pressure_steps);
    expect(exportPayload.calibration).toBe(genPayload.calibration);
    expect(exportPayload.time_range_hr).toEqual(genPayload.time_range_hr);
  });

  it("export button is disabled before generation", () => {
    render(<DatasetPage />);
    // No generate yet — the export button should not exist or be disabled
    // (the preview panel isn't shown before generation)
    const exportBtn = screen.queryByRole("button", { name: /Export Full CSV/i });
    if (exportBtn) {
      expect(exportBtn).toHaveProperty("disabled", true);
    }
    // If not rendered at all, that's fine too
  });

  it("shows export error when exportDatasetCsv throws", async () => {
    render(<DatasetPage />);
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));
    await waitFor(() => expect(screen.getByText(/Dataset Summary/i)).toBeTruthy());

    vi.mocked(api.exportDatasetCsv).mockRejectedValueOnce(
      new ApiClientError("Export failed", 500, "API_ERROR")
    );

    const exportBtn = screen.getByRole("button", { name: /Export full dataset as CSV/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Export failed/i)).toBeTruthy();
    });
  });
});

// ─── scientific integrity ─────────────────────────────────────────────────────

describe("Scientific integrity constraints", () => {
  it("does not render any <formula> or equation text that implies frontend calculation", () => {
    render(<DatasetPage />);
    // No Math.sqrt, exp, or similar computation code should appear as rendered text
    const html = document.body.innerHTML;
    expect(html).not.toContain("Math.sqrt");
    expect(html).not.toContain("Math.exp");
    expect(html).not.toContain("B1 *");
    expect(html).not.toContain("B4 *");
  });

  it("propagates calibration correctly when switched to model", async () => {
    render(<DatasetPage />);
    const select = screen.getByLabelText(/Calibration Basis/i);
    fireEvent.change(select, { target: { value: "model" } });

    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));

    await waitFor(() => expect(api.generateDataset).toHaveBeenCalled());
    const [payload] = vi.mocked(api.generateDataset).mock.calls[0];
    expect(payload.calibration).toBe("model");
  });
});

// ─── reset ────────────────────────────────────────────────────────────────────

describe("Reset behaviour", () => {
  it("resets all fields and clears results on Reset click", async () => {
    render(<DatasetPage />);
    // Change a field
    const timeInput = screen.getByLabelText(/Time Steps/i);
    fireEvent.change(timeInput, { target: { value: "80" } });

    // Generate
    fireEvent.click(screen.getByRole("button", { name: /Generate Dataset Preview/i }));
    await waitFor(() => expect(screen.getByText(/Dataset Summary/i)).toBeTruthy());

    // Reset
    fireEvent.click(screen.getByRole("button", { name: /Reset form to defaults/i }));

    await waitFor(() => {
      expect((screen.getByLabelText(/Time Steps/i) as HTMLInputElement).value).toBe("25");
      expect(screen.queryByText(/Dataset Summary/i)).toBeNull();
    });
  });
});
