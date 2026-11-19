from .health import router as health_router
from .model import router as model_router
from .predictions import router as predictions_router
from .charts import router as charts_router
from .datasets import router as datasets_router

__all__ = [
    "health_router",
    "model_router",
    "predictions_router",
    "charts_router",
    "datasets_router",
]
