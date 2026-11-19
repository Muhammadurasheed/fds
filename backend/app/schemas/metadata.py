from typing import Literal
from pydantic import BaseModel, Field

class RangeMetadata(BaseModel):
    min: float
    max: float
    unit: str
    description: str

class DomainMetadata(BaseModel):
    time_hr: RangeMetadata
    deviation_angle_deg: RangeMetadata
    mud_pressure_psi: RangeMetadata

class CalibrationMetadata(BaseModel):
    id: Literal["experimental", "model"]
    name: str
    description: str
    p_ref_psi: float
    b_parameters: list[float]
    parameter_names: list[str] = ["B1", "B2", "B3", "B4", "B5"]

class DrillingPathMetadata(BaseModel):
    formula: str
    description: str
    separability_threshold_deg: float

class GoverningEquationsMetadata(BaseModel):
    cake_thickness_cm: str
    filtrate_volume_cc: str
    shared_parameter: str
    note: str

class ModelMetadataResponse(BaseModel):
    name: str = "Formation Damage Simulator"
    service_version: str
    model_version: str
    citation: str
    domain: DomainMetadata
    calibrations: list[CalibrationMetadata]
    drilling_path: DrillingPathMetadata
    governing_equations: GoverningEquationsMetadata
    limitations: list[str]
