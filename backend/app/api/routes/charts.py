"""Parametric chart sweep endpoint exposing 1D response curves and digitised observations."""
from fastapi import APIRouter
import numpy as np
from app.schemas.chart import (
    SweepRequest,
    SweepResponse,
    SweepResults,
    SourceObservations,
    SweepMetadata,
)
from app.scientific.formation_damage_model import (
    calibration,
    predict,
    theta_path,
    DOMAIN,
)
from app.scientific.data_digitized import (
    T, H_EXP, H_MODEL, Q_EXP, Q_MODEL,
    THETA, HA_EXP, HA_MODEL, QA_EXP, QA_MODEL,
    P, HP_EXP, HP_MODEL,
)

router = APIRouter(prefix="/charts", tags=["Charts"])

@router.post("/sweep", response_model=SweepResponse)
def compute_sweep(request: SweepRequest) -> SweepResponse:
    """Generate 1D parametric sweep data along time, deviation angle, or mud pressure."""
    cal = calibration(request.calibration)
    sweep_var = request.sweep_variable
    fixed = request.fixed_inputs
    n_pts = request.points
    calib_key = request.calibration

    warnings: list[str] = []
    has_match = False
    obs_label = None
    obs_x = None
    obs_h = None
    obs_q = None
    obs_note = None
    on_path = False

    if sweep_var == "time":
        x_unit = "hr"
        x_grid = np.linspace(DOMAIN["t"][0], DOMAIN["t"][1], n_pts)
        theta_val = float(fixed.deviation_angle_deg)
        p_val = float(fixed.mud_pressure_psi)

        # Vectorised prediction
        pred = predict(x_grid, theta_val, p_val, calib=calib_key)
        h_vals = [float(v) for v in np.atleast_1d(pred["h"])]
        q_vals = [float(v) for v in np.atleast_1d(pred["Q"])]

        # Check domain & path
        if not (DOMAIN["theta"][0] <= theta_val <= DOMAIN["theta"][1]):
            warnings.append(f"Fixed deviation angle ({theta_val}°) is outside the calibrated domain (30-90°).")
        if not (DOMAIN["P"][0] <= p_val <= DOMAIN["P"][1]):
            warnings.append(f"Fixed mud pressure ({p_val} psi) is outside the calibrated domain (650-4650 psi).")

        on_path = abs(theta_val - 60.0) <= 5.0 and abs(p_val - cal.P_ref) <= 200.0

        if request.include_source_observations:
            if on_path:
                has_match = True
                obs_label = f"Published Digitised Data ({calib_key.capitalize()}, Figs. 1 & 3)"
                obs_x = [float(v) for v in T]
                obs_h = [float(v) for v in (H_EXP if calib_key == "experimental" else H_MODEL)]
                obs_q = [float(v) for v in (Q_EXP if calib_key == "experimental" else Q_MODEL)]
                obs_note = (
                    "Published Figs. 1 & 3 data were acquired along the time-dependent drilling path theta_path(t) "
                    "at reference pressure. At fixed theta = 60°, the path condition matches at t = 96 hr."
                )
            else:
                has_match = False
                obs_note = "No matching published source series for time sweep at off-reference conditions."

        if abs(theta_val - 60.0) > 5.0:
            warnings.append("Fixed inclination differs from reference path angle (60° at 96 hr); calculation assumes separability.")

    elif sweep_var == "deviation_angle":
        x_unit = "deg"
        x_grid = np.linspace(DOMAIN["theta"][0], DOMAIN["theta"][1], n_pts)
        t_val = float(fixed.time_hr)
        p_val = float(fixed.mud_pressure_psi)

        pred = predict(t_val, x_grid, p_val, calib=calib_key)
        h_vals = [float(v) for v in np.atleast_1d(pred["h"])]
        q_vals = [float(v) for v in np.atleast_1d(pred["Q"])]

        if not (DOMAIN["t"][0] <= t_val <= DOMAIN["t"][1]):
            warnings.append(f"Fixed exposure time ({t_val} hr) is outside the calibrated domain (36-120 hr).")
        if not (DOMAIN["P"][0] <= p_val <= DOMAIN["P"][1]):
            warnings.append(f"Fixed mud pressure ({p_val} psi) is outside the calibrated domain (650-4650 psi).")

        ref_time_match = abs(t_val - 96.0) <= 2.0
        ref_press_match = abs(p_val - cal.P_ref) <= 200.0
        on_path = ref_time_match and ref_press_match

        if request.include_source_observations:
            if ref_time_match and ref_press_match:
                has_match = True
                obs_label = f"Published Digitised Data ({calib_key.capitalize()}, Figs. 4 & 5)"
                obs_x = [float(v) for v in THETA]
                obs_h = [float(v) for v in (HA_EXP if calib_key == "experimental" else HA_MODEL)]
                obs_q = [float(v) for v in (QA_EXP if calib_key == "experimental" else QA_MODEL)]
                obs_note = "Digitised points from Akinsete & Isehunwa (2013) Figs. 4 & 5 at t = 96 hr and reference pressure."
            else:
                has_match = False
                obs_note = "No matching published source series for deviation angle sweep at off-reference conditions (time != 96 hr or P != P_ref)."

        if abs(t_val - 96.0) > 5.0:
            warnings.append("Fixed exposure time differs from reference benchmark (96 hr); calculation assumes separability.")

    else:  # mud_pressure
        x_unit = "psi"
        x_grid = np.linspace(DOMAIN["P"][0], DOMAIN["P"][1], n_pts)
        t_val = float(fixed.time_hr)
        theta_val = float(fixed.deviation_angle_deg)

        pred = predict(t_val, theta_val, x_grid, calib=calib_key)
        h_vals = [float(v) for v in np.atleast_1d(pred["h"])]
        q_vals = [float(v) for v in np.atleast_1d(pred["Q"])]

        if not (DOMAIN["t"][0] <= t_val <= DOMAIN["t"][1]):
            warnings.append(f"Fixed exposure time ({t_val} hr) is outside the calibrated domain (36-120 hr).")
        if not (DOMAIN["theta"][0] <= theta_val <= DOMAIN["theta"][1]):
            warnings.append(f"Fixed deviation angle ({theta_val}°) is outside the calibrated domain (30-90°).")

        ref_time_match = abs(t_val - 96.0) <= 2.0
        ref_theta_match = abs(theta_val - 60.0) <= 2.0
        on_path = ref_time_match and ref_theta_match

        warnings.append(
            "Cumulative filtrate volume vs pressure is estimated via the separability assumption (Q ~ h with pressure, Eq. 10); "
            "no published Q(P) experimental dataset exists."
        )

        if request.include_source_observations:
            if ref_time_match and ref_theta_match:
                has_match = True
                obs_label = f"Published Digitised Data ({calib_key.capitalize()}, Fig. 2)"
                obs_x = [float(v) for v in P]
                obs_h = [float(v) for v in (HP_EXP if calib_key == "experimental" else HP_MODEL)]
                obs_q = None  # Crucial: No Q(P) series was published in Fig. 2!
                obs_note = (
                    "Digitised points from Akinsete & Isehunwa (2013) Fig. 2 at t = 96 hr and theta = 60°. "
                    "Note: No cumulative filtrate volume Q(P) curve was published in the source literature."
                )
            else:
                has_match = False
                obs_note = "No matching published source series for mud pressure sweep at off-reference conditions."

    return SweepResponse(
        sweep_variable=sweep_var,
        x_values=[round(float(x), 4) for x in x_grid],
        x_unit=x_unit,
        results=SweepResults(
            cake_thickness_cm=[round(float(h), 6) for h in h_vals],
            filtrate_volume_cc=[round(float(q), 6) for q in q_vals],
        ),
        source_observations=SourceObservations(
            has_matching_series=has_match,
            series_label=obs_label,
            x_values=obs_x,
            cake_thickness_cm=obs_h,
            filtrate_volume_cc=obs_q,
            note=obs_note,
        ),
        metadata=SweepMetadata(
            calibration=calib_key,
            sweep_variable=sweep_var,
            points=n_pts,
            on_source_path=on_path,
            warnings=warnings,
        ),
    )
