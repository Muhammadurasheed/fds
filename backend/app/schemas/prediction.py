import math
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

class PredictionRequest(BaseModel):
    time_hr: float = Field(..., gt=0, description="Exposure time in hours (positive finite number)")
    deviation_angle_deg: float = Field(..., ge=0.0, le=90.0, description="Deviation angle in degrees (0 to 90)")
    mud_pressure_psi: float = Field(..., gt=0, description="Mud pressure in psi (positive finite number)")
    calibration: Literal["experimental", "model"] = Field("experimental", description="Calibration dataset selection")
    include_uncertainty: bool = Field(True, description="Whether to compute bootstrap uncertainty bounds")
    uncertainty_level: int = Field(95, ge=50, le=99, description="Confidence interval level percentile (e.g. 95)")

    @field_validator("time_hr", "deviation_angle_deg", "mud_pressure_psi")
    @classmethod
    def check_finite(cls, v: float) -> float:
        if not math.isfinite(v):
            raise ValueError("Numeric values must be finite (NaN and Infinity are not permitted)")
        return v

class PredictionInputs(BaseModel):
    time_hr: float
    deviation_angle_deg: float
    mud_pressure_psi: float

class PredictionResults(BaseModel):
    cake_thickness_cm: float = Field(..., description="Best-fit estimate of mud-cake thickness in centimeters")
    filtrate_volume_cc: float = Field(..., description="Best-fit estimate of cumulative filtrate volume in cubic centimeters")

class PercentileInterval(BaseModel):
    lower: float = Field(..., description="Lower bootstrap confidence percentile")
    median: float = Field(..., description="Bootstrap median (50th percentile of ensemble)")
    upper: float = Field(..., description="Upper bootstrap confidence percentile")

class UncertaintyData(BaseModel):
    level: int = Field(..., description="Confidence level percentage (e.g. 95)")
    cake_thickness_cm: PercentileInterval
    filtrate_volume_cc: PercentileInterval
    ensemble_size: int = Field(300, description="Number of bootstrap parameter draws evaluated")
    notice: str = Field(
        "Bootstrap intervals quantify empirical parameter uncertainty of B1-B5. They do not represent independent field prediction intervals.",
        description="Methodological clarification of bootstrap uncertainty scope",
    )

class DomainStatus(BaseModel):
    within_calibrated_ranges: bool = Field(..., description="Whether all inputs lie within calibrated domain")
    on_source_path: bool = Field(..., description="Whether angle is within 5° of source drilling trajectory")
    source_path_angle_deg: float = Field(..., description="Inferred source drilling trajectory inclination at input time")
    warnings: list[str] = Field(default_factory=list, description="Scientific warnings and extrapolation notices")

class CalculationTrace(BaseModel):
    b_parameters: list[float] = Field(..., description="Active B1-B5 fitted constant array")
    parameter_names: list[str] = Field(default=["B1", "B2", "B3", "B4", "B5"], description="Names of B parameters")
    p_ref_psi: float = Field(..., description="Calibration reference mud pressure in psi")
    theta_path_deg: float = Field(..., description="Inferred baseline drilling inclination theta_path(t) in degrees")
    b1_t: float = Field(..., description="Linear cake growth term B1*t")
    b2_exp_term: float = Field(..., description="Exponential cake delay term B2*exp(-B3*t)")
    radical_diff: float = Field(..., description="Difference B1*t - B2*exp(-B3*t) before clipping")
    onset_clipped: bool = Field(..., description="Whether radical term was clipped to 0 (prior to cake onset)")
    h_time_cm: float = Field(..., description="Base time-dependent cake thickness sqrt(max(0, radical)) in cm")
    m_theta_h: float = Field(..., description="Gaussian deviation angle correction multiplier for cake thickness")
    m_p: float = Field(..., description="Gaussian mud pressure correction multiplier")
    h_final_cm: float = Field(..., description="Final combined cake thickness in cm")
    b4_exp_term: float = Field(..., description="Filtrate exponential term B4*exp(-B3*t)")
    b5_t_term: float = Field(..., description="Filtrate steady loss term -B5*t")
    q_time_cc: float = Field(..., description="Base time-dependent filtrate volume B4*exp(-B3*t) - B5*t in cc")
    m_theta_q: float = Field(..., description="Linear deviation angle correction multiplier for filtrate volume")
    q_final_cc: float = Field(..., description="Final combined cumulative filtrate volume in cc")

class PredictionResponse(BaseModel):
    inputs: PredictionInputs
    calibration: str
    model_version: str = "1.0.0"
    results: PredictionResults
    uncertainty: Optional[UncertaintyData] = None
    domain: DomainStatus
    calculation_trace: Optional[CalculationTrace] = None
