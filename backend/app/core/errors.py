"""Structured error handling adhering to Section 6.7 of the Blueprint."""
from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None

class ErrorResponse(BaseModel):
    error: ErrorDetails

class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    payload = {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": exc.details or {},
        }
    }
    return JSONResponse(status_code=exc.status_code, content=payload)

async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    loc = ".".join(str(l) for l in first_error.get("loc", []) if l != "body")
    msg = first_error.get("msg", "Invalid request parameter")
    payload = {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": f"Validation failed for {loc}: {msg}" if loc else msg,
            "details": {
                "field": loc,
                "issues": [
                    {"loc": [str(l) for l in e.get("loc", [])], "msg": e.get("msg"), "type": e.get("type")}
                    for e in errors
                ],
            },
        }
    }
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload)

async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # Do not leak internal stack traces in production
    payload = {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred while processing the request.",
            "details": {},
        }
    }
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload)
