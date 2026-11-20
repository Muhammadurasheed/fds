"""Point prediction endpoint exposing the core formation damage scientific model."""
from fastapi import APIRouter
import math
from app.core.config import settings
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    PredictionInputs,
    PredictionResults,
    PercentileInterval,
    UncertaintyData,
    DomainStatus,
    CalculationTrace,
)
from app.scientific.formation_damage_model import (
    predict,
    prediction_band,
    check_domain,
    theta_path,
    DOMAIN,
    calibration as get_calibration,
)

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("", response_model=PredictionResponse)
def compute_prediction(request: PredictionRequest) -> PredictionResponse:
    """Compute point predictions for mud-cake thickness and filtrate volume with optional bootstrap uncertainty."""
    t = float(request.time_hr)
    theta = float(request.deviation_angle_deg)
    p = float(request.mud_pressure_psi)
    calib = request.calibration

    # Compute best-fit point prediction
    pred = predict(t, theta, p, calib=calib)
    h_best = float(pred["h"])
    q_best = float(pred["Q"])

    # Uncertainty calculation (if requested)
    uncertainty_data = None
    if request.include_uncertainty:
        bands = prediction_band(t, theta, p, calib=calib, level=request.uncertainty_level)
        h_pct = bands["h"]
        q_pct = bands["Q"]
        uncertainty_data = UncertaintyData(
            level=request.uncertainty_level,
            cake_thickness_cm=PercentileInterval(
                lower=float(h_pct[0]),
                median=float(h_pct[1]),
                upper=float(h_pct[2]),
            ),
            filtrate_volume_cc=PercentileInterval(
                lower=float(q_pct[0]),
                median=float(q_pct[1]),
                upper=float(q_pct[2]),
            ),
            ensemble_size=300,
            notice=(
                "Bootstrap intervals quantify empirical parameter uncertainty of B1-B5. "
                "They do not represent independent field prediction intervals."
            ),
        )

    # Domain checking and warnings
    warnings = check_domain(t, theta, p)
    th_path_val = float(theta_path(t))
    within_domain = (
        DOMAIN["t"][0] <= t <= DOMAIN["t"][1]
        and DOMAIN["theta"][0] <= theta <= DOMAIN["theta"][1]
        and DOMAIN["P"][0] <= p <= DOMAIN["P"][1]
    )
    on_path = abs(theta - th_path_val) <= 5.0

    # Build detailed mathematical calculation trace for transparency
    calib_obj = get_calibration(calib)
    B = calib_obj.B
    b1, b2, b3, b4, b5 = float(B[0]), float(B[1]), float(B[2]), float(B[3]), float(B[4])
    b1_t = b1 * t
    b2_exp_term = b2 * math.exp(-b3 * t)
    radical_diff = b1_t - b2_exp_term
    onset_clipped = radical_diff < 0.0
    h_time_cm = math.sqrt(max(0.0, radical_diff))
    b4_exp_term = b4 * math.exp(-b3 * t)
    b5_t_term = -b5 * t
    q_time_cc = b4_exp_term + b5_t_term
    m_theta_h = float(pred["m_theta_h"])
    m_theta_q = float(pred["m_theta_Q"])
    m_p = float(pred["m_P"])

    calc_trace = CalculationTrace(
        b_parameters=[b1, b2, b3, b4, b5],
        parameter_names=["B1", "B2", "B3", "B4", "B5"],
        p_ref_psi=round(float(calib_obj.P_ref), 2),
        theta_path_deg=round(th_path_val, 4),
        b1_t=round(b1_t, 6),
        b2_exp_term=round(b2_exp_term, 6),
        radical_diff=round(radical_diff, 6),
        onset_clipped=onset_clipped,
        h_time_cm=round(h_time_cm, 6),
        m_theta_h=round(m_theta_h, 6),
        m_p=round(m_p, 6),
        h_final_cm=round(h_best, 6),
        b4_exp_term=round(b4_exp_term, 6),
        b5_t_term=round(b5_t_term, 6),
        q_time_cc=round(q_time_cc, 6),
        m_theta_q=round(m_theta_q, 6),
        q_final_cc=round(q_best, 6),
    )

    return PredictionResponse(
        inputs=PredictionInputs(
            time_hr=t,
            deviation_angle_deg=theta,
            mud_pressure_psi=p,
        ),
        calibration=calib,
        model_version=settings.model_version,
        results=PredictionResults(
            cake_thickness_cm=h_best,
            filtrate_volume_cc=q_best,
        ),
        uncertainty=uncertainty_data,
        domain=DomainStatus(
            within_calibrated_ranges=within_domain,
            on_source_path=on_path,
            source_path_angle_deg=round(th_path_val, 4),
            warnings=warnings,
        ),
        calculation_trace=calc_trace,
    )
