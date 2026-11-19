"""Synthetic dataset generation and CSV streaming endpoints."""
from typing import Literal, Optional
from fastapi import APIRouter, Response, Query
from app.core.config import settings
from app.core.errors import AppError
from app.schemas.dataset import (
    DatasetGenerateRequest,
    DatasetGenerateResponse,
    DatasetColumnMetadata,
)
from app.scientific.formation_damage_model import generate_dataset

router = APIRouter(prefix="/datasets", tags=["Datasets"])

DATASET_COLUMNS = [
    DatasetColumnMetadata(
        name="time_hr",
        unit="hr",
        data_type="float",
        description="Wellbore exposure time in hours",
    ),
    DatasetColumnMetadata(
        name="deviation_angle_deg",
        unit="deg",
        data_type="float",
        description="Wellbore inclination / deviation angle from vertical in degrees",
    ),
    DatasetColumnMetadata(
        name="mud_pressure_psi",
        unit="psi",
        data_type="float",
        description="Mud overbalance pressure in psi",
    ),
    DatasetColumnMetadata(
        name="cake_thickness_cm",
        unit="cm",
        data_type="float",
        description="Estimated mud-cake thickness in centimeters",
    ),
    DatasetColumnMetadata(
        name="filtrate_volume_cc",
        unit="cc",
        data_type="float",
        description="Estimated cumulative filtrate invasion volume in cubic centimeters",
    ),
    DatasetColumnMetadata(
        name="source_path_angle_deg",
        unit="deg",
        data_type="float",
        description="Inferred source drilling trajectory inclination at exposure time t",
    ),
    DatasetColumnMetadata(
        name="off_path",
        unit="boolean",
        data_type="bool",
        description="True if deviation angle differs from the source trajectory by > 5° (separability assumption)",
    ),
]

MAX_DATASET_ROWS = 50000

def _validate_and_generate(
    time_steps: int,
    angle_steps: int,
    pressure_steps: int,
    time_range: tuple[float, float],
    angle_range: tuple[float, float],
    pressure_range: tuple[float, float],
    calibration: str,
):
    total_rows = time_steps * angle_steps * pressure_steps
    if total_rows > MAX_DATASET_ROWS:
        raise AppError(
            code="DATASET_LIMIT_EXCEEDED",
            message=f"Requested grid ({total_rows:,} rows) exceeds the maximum safety limit of {MAX_DATASET_ROWS:,} rows.",
            status_code=400,
            details={"requested_rows": total_rows, "max_allowed_rows": MAX_DATASET_ROWS},
        )

    df = generate_dataset(
        n_t=time_steps,
        n_theta=angle_steps,
        n_P=pressure_steps,
        calib=calibration,
        t_range=time_range,
        theta_range=angle_range,
        P_range=pressure_range,
    )
    return df, total_rows

@router.post("", response_model=DatasetGenerateResponse)
def generate_dataset_preview(request: DatasetGenerateRequest) -> DatasetGenerateResponse:
    """Generate a structured synthetic dataset preview with full parameter metadata."""
    df, total_rows = _validate_and_generate(
        time_steps=request.time_steps,
        angle_steps=request.angle_steps,
        pressure_steps=request.pressure_steps,
        time_range=request.time_range_hr,
        angle_range=request.angle_range_deg,
        pressure_range=request.pressure_range_psi,
        calibration=request.calibration,
    )

    off_path_count = int(df["off_path"].sum())
    preview_slice = df.head(request.preview_rows).round({
        "time_hr": 2,
        "deviation_angle_deg": 2,
        "mud_pressure_psi": 1,
        "cake_thickness_cm": 5,
        "filtrate_volume_cc": 4,
        "source_path_angle_deg": 2,
    })

    records = preview_slice.to_dict(orient="records")
    # Clean booleans/floats for JSON serialisation
    cleaned_records = []
    for r in records:
        cleaned_records.append({
            k: (bool(v) if k == "off_path" else float(v))
            for k, v in r.items()
        })

    return DatasetGenerateResponse(
        row_count=total_rows,
        off_source_path_count=off_path_count,
        calibration=request.calibration,
        columns=DATASET_COLUMNS,
        preview=cleaned_records,
        download_url=f"{settings.api_v1_prefix}/datasets/export",
    )

@router.post("/export")
def export_dataset_csv_post(request: DatasetGenerateRequest) -> Response:
    """Stream full generated dataset as a downloadable CSV file attachment."""
    df, _ = _validate_and_generate(
        time_steps=request.time_steps,
        angle_steps=request.angle_steps,
        pressure_steps=request.pressure_steps,
        time_range=request.time_range_hr,
        angle_range=request.angle_range_deg,
        pressure_range=request.pressure_range_psi,
        calibration=request.calibration,
    )

    csv_data = df.to_csv(index=False)
    filename = f"formation_damage_dataset_{request.calibration}_{len(df)}rows.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )

@router.get("/export")
def export_dataset_csv_get(
    time_steps: int = Query(25, ge=2, le=100),
    angle_steps: int = Query(13, ge=2, le=50),
    pressure_steps: int = Query(15, ge=2, le=50),
    t_min: float = Query(36.0, gt=0),
    t_max: float = Query(120.0, gt=0),
    theta_min: float = Query(30.0, ge=0, le=90),
    theta_max: float = Query(90.0, ge=0, le=90),
    p_min: float = Query(650.0, gt=0),
    p_max: float = Query(4650.0, gt=0),
    calibration: Literal["experimental", "model"] = Query("experimental"),
) -> Response:
    """Convenience GET endpoint for direct browser link download of dataset CSV."""
    if t_min >= t_max:
        raise AppError("INVALID_RANGE", f"t_min ({t_min}) must be less than t_max ({t_max})")
    if theta_min >= theta_max:
        raise AppError("INVALID_RANGE", f"theta_min ({theta_min}) must be less than theta_max ({theta_max})")
    if p_min >= p_max:
        raise AppError("INVALID_RANGE", f"p_min ({p_min}) must be less than p_max ({p_max})")

    df, _ = _validate_and_generate(
        time_steps=time_steps,
        angle_steps=angle_steps,
        pressure_steps=pressure_steps,
        time_range=(t_min, t_max),
        angle_range=(theta_min, theta_max),
        pressure_range=(p_min, p_max),
        calibration=calibration,
    )

    csv_data = df.to_csv(index=False)
    filename = f"formation_damage_dataset_{calibration}_{len(df)}rows.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
