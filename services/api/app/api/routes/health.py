from fastapi import APIRouter
from app.api.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> HealthResponse:
    """Lightweight health check endpoint proving service is running and model assets are present."""
    # Verify scientific engine calibration is accessible
    try:
        from app.scientific import formation_damage_model as fm
        # Quick check that calibrations load
        _ = fm.calibration("experimental")
        model_loaded = True
    except Exception:
        model_loaded = False

    return HealthResponse(
        status="ok" if model_loaded else "degraded",
        service=settings.service_name,
        model_loaded=model_loaded,
        model_version=settings.model_version,
    )
