import { NextResponse } from "next/server";

export interface AIInterpretationPayload {
  cake_thickness_cm: number;
  filtrate_volume_cc: number;
  time_hr: number;
  deviation_angle_deg: number;
  mud_pressure_psi: number;
  calibration: string;
  within_domain?: boolean;
  on_source_path?: boolean;
}

export interface AIInterpretationResponse {
  flag: "green" | "yellow" | "red";
  flag_label: string;
  headline: string;
  cake_analysis: string;
  filtrate_analysis: string;
  operational_risks: string[];
  recommendations: string[];
  source: "gemini" | "rule-engine";
}

/**
 * Deterministic fallback rule-based engineering analysis in case Gemini API is unreachable.
 */
function getRuleBasedAssessment(payload: AIInterpretationPayload): AIInterpretationResponse {
  const { cake_thickness_cm: h, filtrate_volume_cc: Q, deviation_angle_deg: angle } = payload;

  let flag: "green" | "yellow" | "red" = "green";
  let flag_label = "Green Flag (Acceptable Damage & Stable Gauge)";

  if (h > 0.45 || Q > 45 || !payload.within_domain) {
    flag = "red";
    flag_label = "Red Flag (High Formation Damage & Sticking Risk)";
  } else if (h > 0.3 || Q > 28) {
    flag = "yellow";
    flag_label = "Yellow Flag (Moderate Impairment - Monitoring Advised)";
  }

  let cakeText = "";
  if (h < 0.25) {
    cakeText = `Cake thickness of ${h.toFixed(3)} cm is thin and tight. It provides an effective low-permeability seal across the permeable borehole wall with minimal drillstring contact area.`;
  } else if (h <= 0.45) {
    cakeText = `Cake thickness of ${h.toFixed(3)} cm is moderately thick. In a deviated well (${angle.toFixed(1)}°), this increases drill collar contact area, warranting monitoring of differential sticking tendencies.`;
  } else {
    cakeText = `Cake thickness of ${h.toFixed(3)} cm is excessively thick. This significantly restricts wellbore clearance, creates severe differential sticking hazards across permeable sandstones, and elevates swab/surge pressures during tripping.`;
  }

  let filtrateText = "";
  if (Q < 25) {
    filtrateText = `Cumulative filtrate volume of ${Q.toFixed(1)} cc reflects low fluid loss. Invasion radius into the pay zone is shallow, minimizing water-blocking and relative permeability reduction.`;
  } else if (Q <= 45) {
    filtrateText = `Cumulative filtrate volume of ${Q.toFixed(1)} cc indicates moderate fluid invasion into the near-wellbore matrix. Potential for clay hydration/swelling exists if water-sensitive minerals are present.`;
  } else {
    filtrateText = `Cumulative filtrate volume of ${Q.toFixed(1)} cc indicates extensive invasion. Fluid loss of this magnitude creates a deep invasion radius (r_i), risking permanent relative permeability impairment, fines migration, and an elevated positive skin factor (S > 0).`;
  }

  const risks: string[] = [];
  if (h > 0.35) {
    risks.push("Elevated differential sticking probability when drillstring is stationary in overbalanced deviated section.");
  }
  if (Q > 30) {
    risks.push("Potential aqueous phase trapping / water block in low-permeability sandstone pay zone.");
  }
  if (angle > 50 && h > 0.3) {
    risks.push("Gravity settling of drill cuttings on low-side bed aggravated by thick filter cake layer.");
  }
  if (risks.length === 0) {
    risks.push("Borehole gauge and mud-cake characteristics remain within standard drilling operating margins.");
  }

  const recs: string[] = [];
  if (h > 0.35 || Q > 35) {
    recs.push("Introduce low-viscosity polyanionic cellulose (PAC-LV) or modified starch to reduce API fluid loss.");
    recs.push("Optimize bridging particle size distribution (PSD) using sized calcium carbonate (CaCO₃) matching formation pore throat diameters.");
  }
  if (h > 0.4) {
    recs.push("Minimize stationary drillstring time across the permeable interval; apply rotation during connections.");
  }
  if (recs.length === 0) {
    recs.push("Maintain current mud filtration control additives and continue standard drilling fluid maintenance.");
  }

  return {
    flag,
    flag_label,
    headline:
      flag === "green"
        ? "Controlled filtration performance with minimal formation damage risk."
        : flag === "yellow"
        ? "Marginal cake thickness and filtrate invasion requiring active filtration control."
        : "Critical formation damage risk: excessive cake buildup and deep filtrate invasion.",
    cake_analysis: cakeText,
    filtrate_analysis: filtrateText,
    operational_risks: risks,
    recommendations: recs,
    source: "rule-engine",
  };
}

export async function POST(req: Request) {
  try {
    const payload: AIInterpretationPayload = await req.json();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(getRuleBasedAssessment(payload));
    }

    const prompt = `You are an expert Petroleum Drilling & Reservoir Engineer reviewing simulation results for filtration-induced formation damage in a deviated wellbore.

SIMULATION DATA:
- Exposure Time: ${payload.time_hr} hours
- Deviation Angle: ${payload.deviation_angle_deg}° (from vertical)
- Mud Pressure: ${payload.mud_pressure_psi} psi
- Calibration: ${payload.calibration} dataset
- Predicted Mud-Cake Thickness (h): ${payload.cake_thickness_cm.toFixed(4)} cm
- Predicted Cumulative Filtrate Invasion Volume (Q): ${payload.filtrate_volume_cc.toFixed(2)} cc
- Within Calibrated Domain: ${payload.within_domain ?? true}
- Aligned with Source Drilling Path: ${payload.on_source_path ?? true}

YOUR TASK:
Provide an executive, highly credible engineering assessment of what these numerical values mean practically.
1. Determine whether this outcome is a "green" (acceptable/low risk), "yellow" (caution/moderate damage), or "red" (critical risk/severe damage) flag for drilling and reservoir productivity.
2. Clearly explain what the mud-cake thickness (h in cm) means practically: is it thin and impermeable (desirable) or thick and spongy (risks differential sticking and tight hole)?
3. Clearly explain what the cumulative filtrate invasion volume (Q in cc) means practically: depth of invasion, relative permeability impairment (water block), clay swelling/fines migration, and skin factor impact.
4. List 2-3 specific operational drilling risks (e.g., differential sticking in deviated section, swab/surge pressure spikes, torque & drag).
5. List 2-3 actionable drilling fluid engineering recommendations (e.g., fluid loss additives like PAC-LV/starch, bridging solid sizing with calcium carbonate CaCO3, overbalance adjustment).

CRITICAL REQUIREMENT: Return ONLY a valid JSON object matching this schema without any markdown formatting or backticks:
{
  "flag": "green" | "yellow" | "red",
  "flag_label": "Short label (e.g. Green Flag: Low Damage Risk | Red Flag: High Sticking Risk)",
  "headline": "A single concise punchy sentence summarizing the engineering verdict",
  "cake_analysis": "2-3 sentences explaining physical meaning of cake thickness h",
  "filtrate_analysis": "2-3 sentences explaining physical meaning of filtrate volume Q and skin damage",
  "operational_risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!geminiResponse.ok) {
      console.warn("Gemini API returned error status:", geminiResponse.status);
      return NextResponse.json(getRuleBasedAssessment(payload));
    }

    const data = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(getRuleBasedAssessment(payload));
    }

    // Parse JSON from output
    const cleanJsonText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanJsonText);
      const flag = ["green", "yellow", "red"].includes(parsed.flag) ? parsed.flag : "yellow";
      return NextResponse.json({
        flag,
        flag_label: parsed.flag_label || (flag === "green" ? "Green Flag" : flag === "yellow" ? "Yellow Flag" : "Red Flag"),
        headline: parsed.headline || "Drilling fluid filtration evaluation complete.",
        cake_analysis: parsed.cake_analysis || "",
        filtrate_analysis: parsed.filtrate_analysis || "",
        operational_risks: Array.isArray(parsed.operational_risks) ? parsed.operational_risks : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        source: "gemini",
      });
    } catch {
      return NextResponse.json(getRuleBasedAssessment(payload));
    }
  } catch (err) {
    console.error("AI interpretation route error:", err);
    return NextResponse.json(getRuleBasedAssessment({
      cake_thickness_cm: 0.34,
      filtrate_volume_cc: 40.0,
      time_hr: 96,
      deviation_angle_deg: 60,
      mud_pressure_psi: 2410,
      calibration: "experimental",
    }));
  }
}
