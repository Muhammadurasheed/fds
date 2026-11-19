from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.errors import (
    AppError,
    app_error_handler,
    validation_error_handler,
    generic_error_handler,
)
from app.core.logging import setup_logging
from app.api.routes import health

setup_logging()

app = FastAPI(
    title="Formation Damage Simulator API",
    description="Computational analysis of filtration-induced formation damage in deviated wells.",
    version=settings.service_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# Include routers
app.include_router(health.router, prefix=settings.api_v1_prefix)

# Root convenience redirect or ping
@app.get("/", tags=["Root"])
def root_ping():
    return {
        "message": "Formation Damage Simulator API",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
