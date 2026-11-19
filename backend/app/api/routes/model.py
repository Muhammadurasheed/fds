"""Model metadata and scientific validation endpoints."""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.metadata import (
    ModelMetadataResponse,
    DomainMetadata,
    RangeMetadata,
    CalibrationMetadata,
    DrillingPathMetadata,
    GoverningEquationsMetadata,
)
from app.schemas.validation import (
    ValidationResponse,
    CalibrationValidation,
)
from app.scientific.formation_damage_model import (
    calibration,
    validate,
    DOMAIN,
)

router = APIRouter(prefix="/model", tags=["Model Information"])

@router.get("/metadata", response_model=ModelMetadataResponse)
def get_model_metadata() -> ModelMetadataResponse:
    """Return model domain definitions, calibrations, parameter names, and scientific constraints."""
    c_exp = calibration("experimental")
    c_mod = calibration("model")

    return ModelMetadataResponse(
        name="Formation Damage Simulator",
        service_version=settings.service_version,
        model_version=settings.model_version,
        citation="Akinsete, O. O., & Isehunwa, S. O. (2013). Petroleum Science and Technology, 31(21), 2202-2210.",
        domain=DomainMetadata(
            time_hr=RangeMetadata(
                min=DOMAIN["t"][0],
                max=DOMAIN["t"][1],
                unit="hr",
                description="Wellbore exposure time (experimental core exposure duration)",
            ),
            deviation_angle_deg=RangeMetadata(
                min=DOMAIN["theta"][0],
                max=DOMAIN["theta"][1],
                unit="deg",
                description="Wellbore inclination / deviation angle from vertical (0° = vertical, 90° = horizontal)",
            ),
            mud_pressure_psi=RangeMetadata(
                min=DOMAIN["P"][0],
                max=DOMAIN["P"][1],
                unit="psi",
                description="Drilling mud overbalance pressure",
            ),
        ),
        calibrations=[
            CalibrationMetadata(
                id="experimental",
                name="Experimental Core-Scale Calibration",
                description="Calibrated directly against laboratory physical core-flood filtration experiments",
                p_ref_psi=round(float(c_exp.P_ref), 2),
                b_parameters=[float(b) for b in c_exp.B],
                parameter_names=["B1", "B2", "B3", "B4", "B5"],
            ),
            CalibrationMetadata(
                id="model",
                name="Present Model Numerical Calibration",
                description="Calibrated against numerical simulation predictions (alpha = 2.0)",
                p_ref_psi=round(float(c_mod.P_ref), 2),
                b_parameters=[float(b) for b in c_mod.B],
                parameter_names=["B1", "B2", "B3", "B4", "B5"],
            ),
        ],
        drilling_path=DrillingPathMetadata(
            formula="theta_path(t) = 20.0 + (10.0 / 24.0) * t",
            description="Empirical wellbore trajectory coupling exposure time and deviation angle across source datasets",
            separability_threshold_deg=5.0,
        ),
        governing_equations=GoverningEquationsMetadata(
            cake_thickness_cm="h(t) = sqrt(max(0, B1*t - B2*exp(-B3*t)))",
            filtrate_volume_cc="Q(t) = B4*exp(-B3*t) - B5*t",
            shared_parameter="B3 couples both cake thickness and filtrate volume kinetics",
            note="Relative multiplicative correction factors for inclination and pressure are applied relative to the source trajectory and reference pressure.",
        ),
        limitations=[
            "Calibrated on consolidated sandstone core samples under steady filtration; caution in fractured, highly unconsolidated, or carbonate media.",
            "Multiplicative separability decouples inclination and hydrostatic pressure from transient filtration kinetics.",
            "Pre-cake deposition period (t < ~35 hr) exhibits radical clipping to 0 to represent pre-cake incubation.",
            "No experimental Q(P) series was published in the source study; cumulative filtrate volume under pressure sweeps scales proportionally to cake thickness (Eq. 10).",
        ],
    )

@router.get("/validation", response_model=ValidationResponse)
def get_model_validation() -> ValidationResponse:
    """Return empirical reproduction fidelity metrics (RMSE, R2, MAE, MAPE, n) against published curves."""
    exp_metrics = validate("experimental")["exp"]
    mod_metrics = validate("model")["model"]

    return ValidationResponse(
        experimental=CalibrationValidation(**exp_metrics),
        model=CalibrationValidation(**mod_metrics),
        notice=(
            "Validation against digitised published curves verifies numerical and mathematical implementation fidelity "
            "against Akinsete & Isehunwa (2013). It does not constitute independent external reservoir or field validation."
        ),
    )
