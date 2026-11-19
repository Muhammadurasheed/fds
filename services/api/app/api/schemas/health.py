from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "formation-damage-api"
    model_loaded: bool = True
    model_version: str = "1.0.0"
