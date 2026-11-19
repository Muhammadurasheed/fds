from pydantic import BaseModel, Field, ConfigDict

class FitMetrics(BaseModel):
    RMSE: float = Field(..., description="Root Mean Squared Error")
    R2: float = Field(..., description="Coefficient of determination (R-squared)")
    MAE: float = Field(..., description="Mean Absolute Error")
    MAPE: float = Field(..., description="Mean Absolute Percentage Error (%)")
    n: int = Field(..., description="Number of digitised data points")

class CalibrationValidation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    fig1_cake_thickness_vs_time: FitMetrics = Field(..., alias="Fig.1 h(t)")
    fig3_filtrate_volume_vs_time: FitMetrics = Field(..., alias="Fig.3 Q(t)")
    fig5_cake_thickness_vs_angle: FitMetrics = Field(..., alias="Fig.5 h(theta)")
    fig4_filtrate_volume_vs_angle: FitMetrics = Field(..., alias="Fig.4 Q(theta)")
    fig2_cake_thickness_vs_pressure: FitMetrics = Field(..., alias="Fig.2 h(P)")

class ValidationResponse(BaseModel):
    experimental: CalibrationValidation
    model: CalibrationValidation
    notice: str = Field(
        "Validation against digitised published curves verifies numerical and mathematical implementation fidelity against Akinsete & Isehunwa (2013). It does not constitute independent external reservoir or field validation.",
        description="Scientific scope notice",
    )
