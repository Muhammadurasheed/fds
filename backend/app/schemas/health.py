from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = Field("ok", description="Service operational status")
    service: str = Field("formation-damage-api", description="Service identifier")
    model_loaded: bool = Field(True, description="Whether scientific models are in memory")
    model_version: str = Field("1.0.0", description="Scientific computational model version")
