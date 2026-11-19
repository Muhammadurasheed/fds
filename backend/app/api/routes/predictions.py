"""Point prediction endpoint exposing the core formation damage scientific model."""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    PredictionInputs,
    PredictionResults,
    PercentileInterval,
    UncertaintyData,
    DomainStatus,
)
from app.scientific.formation_damage_model import (
    predict,
    prediction_band,
    check_domain,
    theta_path,
    DOMAIN,
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
    )
