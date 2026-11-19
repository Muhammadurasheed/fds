import math
from typing import Literal, Any
from pydantic import BaseModel, Field, model_validator, field_validator

class DatasetGenerateRequest(BaseModel):
    time_steps: int = Field(25, ge=2, le=100, description="Number of steps in time dimension")
    angle_steps: int = Field(13, ge=2, le=50, description="Number of steps in angle dimension")
    pressure_steps: int = Field(15, ge=2, le=50, description="Number of steps in pressure dimension")
    time_range_hr: tuple[float, float] = Field((36.0, 120.0), description="Min and max exposure time in hours")
    angle_range_deg: tuple[float, float] = Field((30.0, 90.0), description="Min and max deviation angle in degrees")
    pressure_range_psi: tuple[float, float] = Field((650.0, 4650.0), description="Min and max mud pressure in psi")
    calibration: Literal["experimental", "model"] = Field("experimental", description="Model calibration dataset")
    preview_rows: int = Field(15, ge=1, le=100, description="Number of sample rows to return in the JSON preview")

    @field_validator("time_range_hr", "angle_range_deg", "pressure_range_psi")
    @classmethod
    def validate_range_tuple(cls, v: tuple[float, float]) -> tuple[float, float]:
        if len(v) != 2:
            raise ValueError("Range must be a tuple of two numbers (min, max)")
        low, high = v
        if not (math.isfinite(low) and math.isfinite(high)):
            raise ValueError("Range bounds must be finite numbers")
        if low >= high:
            raise ValueError(f"Range minimum ({low}) must be strictly less than maximum ({high})")
        return v

    @model_validator(mode="after")
    def validate_bounds(self) -> "DatasetGenerateRequest":
        if self.time_range_hr[0] <= 0:
            raise ValueError("Time range minimum must be > 0")
        if self.angle_range_deg[0] < 0 or self.angle_range_deg[1] > 90:
            raise ValueError("Angle range must be within [0, 90] degrees")
        if self.pressure_range_psi[0] <= 0:
            raise ValueError("Pressure range minimum must be > 0")
        return self

class DatasetColumnMetadata(BaseModel):
    name: str
    unit: str
    data_type: str
    description: str

class DatasetGenerateResponse(BaseModel):
    row_count: int = Field(..., description="Total number of regular grid points generated")
    off_source_path_count: int = Field(..., description="Number of rows that deviate from source drilling trajectory")
    calibration: str
    columns: list[DatasetColumnMetadata]
    preview: list[dict[str, Any]] = Field(..., description="Sample preview rows formatted as dictionaries")
    download_url: str = Field("/api/v1/datasets/export", description="Endpoint to stream the full dataset as CSV")
