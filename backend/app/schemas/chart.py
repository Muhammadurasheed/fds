import math
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator, field_validator

class FixedInputs(BaseModel):
    time_hr: Optional[float] = Field(None, gt=0, description="Fixed exposure time in hours")
    deviation_angle_deg: Optional[float] = Field(None, ge=0.0, le=90.0, description="Fixed deviation angle in degrees")
    mud_pressure_psi: Optional[float] = Field(None, gt=0, description="Fixed mud pressure in psi")

    @field_validator("time_hr", "deviation_angle_deg", "mud_pressure_psi")
    @classmethod
    def check_finite(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not math.isfinite(v):
            raise ValueError("Numeric fixed inputs must be finite")
        return v

class SweepRequest(BaseModel):
    sweep_variable: Literal["time", "deviation_angle", "mud_pressure"]
    calibration: Literal["experimental", "model"] = "experimental"
    fixed_inputs: FixedInputs
    points: int = Field(100, ge=10, le=500, description="Number of evaluation points along the sweep axis")
    include_source_observations: bool = Field(True, description="Whether to include digitised experimental observations if a matching series exists")

    @model_validator(mode="after")
    def validate_complementary_inputs(self) -> "SweepRequest":
        fixed = self.fixed_inputs
        if self.sweep_variable == "time":
            if fixed.deviation_angle_deg is None or fixed.mud_pressure_psi is None:
                raise ValueError("When sweeping 'time', fixed_inputs must provide 'deviation_angle_deg' and 'mud_pressure_psi'")
        elif self.sweep_variable == "deviation_angle":
            if fixed.time_hr is None or fixed.mud_pressure_psi is None:
                raise ValueError("When sweeping 'deviation_angle', fixed_inputs must provide 'time_hr' and 'mud_pressure_psi'")
        elif self.sweep_variable == "mud_pressure":
            if fixed.time_hr is None or fixed.deviation_angle_deg is None:
                raise ValueError("When sweeping 'mud_pressure', fixed_inputs must provide 'time_hr' and 'deviation_angle_deg'")
        return self

class SweepResults(BaseModel):
    cake_thickness_cm: list[float]
    filtrate_volume_cc: list[float]

class SourceObservations(BaseModel):
    has_matching_series: bool
    series_label: Optional[str] = None
    x_values: Optional[list[float]] = None
    cake_thickness_cm: Optional[list[float]] = None
    filtrate_volume_cc: Optional[list[float]] = None
    note: Optional[str] = None

class SweepMetadata(BaseModel):
    calibration: str
    sweep_variable: str
    points: int
    on_source_path: bool
    warnings: list[str]

class SweepResponse(BaseModel):
    sweep_variable: str
    x_values: list[float]
    x_unit: str
    results: SweepResults
    source_observations: SourceObservations
    metadata: SweepMetadata
