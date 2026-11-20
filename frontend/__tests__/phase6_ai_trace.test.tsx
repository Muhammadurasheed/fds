import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CalculationTraceModal } from "@/components/estimate/calculation-trace-modal";
import { AIInterpretationCard } from "@/components/estimate/ai-interpretation-card";
import MethodologyPage from "@/app/methodology/page";
import { api } from "@/lib/api";

describe("CalculationTraceModal component", () => {
  const mockTrace = {
    b_parameters: [0.002522, 0.07167, -0.005879, 8.637927, -0.259065],
    parameter_names: ["B1", "B2", "B3", "B4", "B5"],
    p_ref_psi: 2410.16,
    theta_path_deg: 60.0,
    b1_t: 0.242112,
    b2_exp_term: 0.126042,
    radical_diff: 0.11607,
    onset_clipped: false,
    h_time_cm: 0.34069,
    m_theta_h: 1.0,
    m_p: 1.0,
    h_final_cm: 0.34069,
    b4_exp_term: 15.1873,
    b5_t_term: 24.8702,
    q_time_cc: 40.0575,
    m_theta_q: 1.0,
    q_final_cc: 40.0575,
  };

  it("renders the trigger button initially collapsed", () => {
    render(
      <CalculationTraceModal
        trace={mockTrace}
        timeHr={96.0}
        angleDeg={60.0}
        pressurePsi={2410.16}
        calibration="experimental"
        cakeThicknessCm={0.3407}
        filtrateVolumeCc={40.06}
      />
    );
    expect(screen.getByText(/View Step-by-Step Calculation Trace/i)).toBeTruthy();
    expect(screen.queryByText(/Derivation of Mud-Cake Thickness/i)).toBeNull();
  });

  it("expands trace on click and displays B1-B5 table and equations", () => {
    render(
      <CalculationTraceModal
        trace={mockTrace}
        timeHr={96.0}
        angleDeg={60.0}
        pressurePsi={2410.16}
        calibration="experimental"
        cakeThicknessCm={0.3407}
        filtrateVolumeCc={40.06}
      />
    );

    const btn = screen.getByText(/View Step-by-Step Calculation Trace/i);
    fireEvent.click(btn);

    expect(screen.getByText(/Step-by-Step Mathematical Trace & Parameter Breakdown/i)).toBeTruthy();
    expect(screen.getByText(/Derivation of Mud-Cake Thickness/i)).toBeTruthy();
    expect(screen.getByText(/Derivation of Cumulative Filtrate Volume/i)).toBeTruthy();
    expect(screen.getByText("0.002522")).toBeTruthy();
    expect(screen.getByText("-0.005879")).toBeTruthy();
  });
});

describe("AIInterpretationCard component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and renders operational flag and analysis", async () => {
    const mockAiResponse = {
      flag: "green",
      flag_label: "Green Flag (Low Damage Risk)",
      headline: "Controlled filtration performance with minimal sticking hazard.",
      cake_analysis: "Cake thickness of 0.3407 cm is tight and protective.",
      filtrate_analysis: "Filtrate volume of 40.06 cc indicates shallow invasion.",
      operational_risks: ["Low differential sticking risk"],
      recommendations: ["Maintain current fluid loss polymer concentration"],
      source: "gemini",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAiResponse,
    } as Response);

    render(
      <AIInterpretationCard
        timeHr={96.0}
        angleDeg={60.0}
        pressurePsi={2410.16}
        calibration="experimental"
        cakeThicknessCm={0.3407}
        filtrateVolumeCc={40.06}
        withinDomain={true}
        onSourcePath={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Green Flag \(Low Damage Risk\)/i)).toBeTruthy();
    });

    expect(screen.getByText(/Controlled filtration performance/i)).toBeTruthy();
    expect(screen.getByText(/Cake thickness of 0.3407 cm is tight and protective/i)).toBeTruthy();
    expect(screen.getByText(/Maintain current fluid loss polymer concentration/i)).toBeTruthy();
  });
});

describe("MethodologyPage component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getModelValidation").mockResolvedValue({
      experimental: { RMSE: 0.015, R2: 0.998, MAE: 0.012, MAPE: 1.5, n: 17 },
      model: { RMSE: 0.018, R2: 0.995, MAE: 0.014, MAPE: 2.1, n: 17 },
      notice: "Reproduction notice",
    });
  });

  it("renders all core methodology sections and validation table", async () => {
    render(<MethodologyPage />);

    expect(screen.getByText(/Scientific Methodology & Model Validity/i)).toBeTruthy();
    expect(screen.getByText(/Governing Equations & Physical Meaning/i)).toBeTruthy();
    expect(screen.getByText(/Input & Output Variables Specification/i)).toBeTruthy();
    expect(screen.getByText(/Empirical Parameter Recovery & Calibrations/i)).toBeTruthy();
    expect(screen.getByText(/Eight Documented Scientific Limitations/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("0.0150")).toBeTruthy();
      expect(screen.getByText("0.9980")).toBeTruthy();
    });
  });
});
