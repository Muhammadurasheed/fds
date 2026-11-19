"""Comprehensive integration tests for the Formation Damage Simulator API v1.

Covers:
1. Health endpoint
2. Model metadata endpoint
3. Point predictions numerical parity (experimental & model)
4. Domain extrapolation & separability warnings
5. Inadmissible and non-finite input validation (422)
6. Bootstrap uncertainty bounds ([lower <= median <= upper])
7. Chart sweeps (time, deviation_angle, mud_pressure)
8. Digitised source observation inclusion and absence
9. Pressure sweep Q(P) omission fidelity
10. Synthetic dataset preview generation
11. Dataset row safety cap (50,000 rows max -> 400)
12. CSV streaming export and headers
13. Model empirical validation metrics
14. Structured error responses
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.scientific.formation_damage_model import calibration

client = TestClient(app)

# ----------------------------------------------------------------------
# 1. Health & Root
# ----------------------------------------------------------------------
def test_root_ping():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Formation Damage Simulator" in data["message"]
    assert data["health"] == "/api/v1/health"

def test_api_v1_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "formation-damage-api"
    assert "model_version" in data

# ----------------------------------------------------------------------
# 2. Model Metadata
# ----------------------------------------------------------------------
def test_model_metadata():
    response = client.get("/api/v1/model/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Formation Damage Simulator"
    assert "Akinsete" in data["citation"]

    # Domain
    domain = data["domain"]
    assert domain["time_hr"]["min"] == 36.0
    assert domain["time_hr"]["max"] == 120.0
    assert domain["deviation_angle_deg"]["min"] == 30.0
    assert domain["deviation_angle_deg"]["max"] == 90.0
    assert domain["mud_pressure_psi"]["min"] == 650.0
    assert domain["mud_pressure_psi"]["max"] == 4650.0

    # Calibrations
    calibs = {c["id"]: c for c in data["calibrations"]}
    assert "experimental" in calibs
    assert "model" in calibs
    assert len(calibs["experimental"]["b_parameters"]) == 5
    assert len(calibs["model"]["b_parameters"]) == 5
    assert calibs["experimental"]["p_ref_psi"] == pytest.approx(2410.16, abs=1.0)
    assert calibs["model"]["p_ref_psi"] == pytest.approx(3209.35, abs=1.0)

    # Drilling path & Governing equations
    assert "theta_path" in data["drilling_path"]["formula"]
    assert "sqrt(max(0, B1*t - B2*exp(-B3*t)))" in data["governing_equations"]["cake_thickness_cm"]
    assert "B4*exp(-B3*t) - B5*t" in data["governing_equations"]["filtrate_volume_cc"]
    assert len(data["limitations"]) >= 4

# ----------------------------------------------------------------------
# 3. Model Empirical Validation
# ----------------------------------------------------------------------
def test_model_validation():
    response = client.get("/api/v1/model/validation")
    assert response.status_code == 200
    data = response.json()
    assert "experimental" in data
    assert "model" in data
    assert "notice" in data

    exp = data["experimental"]
    assert exp["Fig.1 h(t)"]["R2"] > 0.95
    assert exp["Fig.3 Q(t)"]["R2"] > 0.95
    assert exp["Fig.5 h(theta)"]["R2"] > 0.90
    assert exp["Fig.4 Q(theta)"]["R2"] > 0.95
    assert exp["Fig.2 h(P)"]["R2"] > 0.90
    assert exp["Fig.1 h(t)"]["n"] == 5

# ----------------------------------------------------------------------
# 4. Point Predictions & Numerical Parity
# ----------------------------------------------------------------------
def test_prediction_experimental_numerical_parity():
    c_exp = calibration("experimental")
    payload = {
        "time_hr": 96.0,
        "deviation_angle_deg": 60.0,
        "mud_pressure_psi": c_exp.P_ref,
        "calibration": "experimental",
        "include_uncertainty": True,
        "uncertainty_level": 95,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Exact parity check: h ~ 0.340652 cm, Q ~ 40.059122 cc
    results = data["results"]
    assert results["cake_thickness_cm"] == pytest.approx(0.3406523, rel=1e-4)
    assert results["filtrate_volume_cc"] == pytest.approx(40.059122, rel=1e-4)

    # Domain status
    assert data["domain"]["within_calibrated_ranges"] is True
    assert data["domain"]["on_source_path"] is True
    assert len(data["domain"]["warnings"]) == 0

    # Uncertainty
    unc = data["uncertainty"]
    assert unc is not None
    assert unc["level"] == 95
    assert unc["ensemble_size"] == 300
    h_ci = unc["cake_thickness_cm"]
    q_ci = unc["filtrate_volume_cc"]
    assert h_ci["lower"] <= h_ci["median"] <= h_ci["upper"]
    assert q_ci["lower"] <= q_ci["median"] <= q_ci["upper"]
    assert h_ci["median"] == pytest.approx(0.3401, abs=0.01)

def test_prediction_model_calibration():
    c_mod = calibration("model")
    payload = {
        "time_hr": 96.0,
        "deviation_angle_deg": 60.0,
        "mud_pressure_psi": c_mod.P_ref,
        "calibration": "model",
        "include_uncertainty": False,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["calibration"] == "model"
    assert data["results"]["cake_thickness_cm"] > 0
    assert data["results"]["filtrate_volume_cc"] > 0
    assert data["uncertainty"] is None

# ----------------------------------------------------------------------
# 5. Domain Extrapolation & Warnings
# ----------------------------------------------------------------------
def test_prediction_domain_extrapolation_warning():
    # Positive time > 120 hr is physically admissible for the formulas, but outside calibrated domain
    payload = {
        "time_hr": 200.0,
        "deviation_angle_deg": 60.0,
        "mud_pressure_psi": 2400.0,
        "calibration": "experimental",
        "include_uncertainty": False,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["domain"]["within_calibrated_ranges"] is False
    assert any("outside calibrated range" in w for w in data["domain"]["warnings"])

def test_prediction_separability_warning():
    # Deviation angle differing by > 5° from source path theta_path(96) = 60°
    payload = {
        "time_hr": 96.0,
        "deviation_angle_deg": 85.0,  # 85° is 25° away from 60°
        "mud_pressure_psi": 2400.0,
        "calibration": "experimental",
        "include_uncertainty": False,
    }
    response = client.post("/api/v1/predictions", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["domain"]["on_source_path"] is False
    assert any("separability assumption" in w for w in data["domain"]["warnings"])

# ----------------------------------------------------------------------
# 6. Inadmissible & Malformed Inputs Validation (422)
# ----------------------------------------------------------------------
def test_prediction_negative_time_rejected():
    response = client.post("/api/v1/predictions", json={
        "time_hr": -10.0,
        "deviation_angle_deg": 60.0,
        "mud_pressure_psi": 2400.0,
    })
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"

def test_prediction_out_of_bounds_angle_rejected():
    response = client.post("/api/v1/predictions", json={
        "time_hr": 50.0,
        "deviation_angle_deg": 120.0,  # Must be <= 90
        "mud_pressure_psi": 2400.0,
    })
    assert response.status_code == 422

def test_prediction_non_finite_input_rejected():
    # NaN and Infinity
    response = client.post("/api/v1/predictions", json={
        "time_hr": 50.0,
        "deviation_angle_deg": "NaN",
        "mud_pressure_psi": 2400.0,
    })
    assert response.status_code == 422

def test_prediction_invalid_calibration_rejected():
    response = client.post("/api/v1/predictions", json={
        "time_hr": 50.0,
        "deviation_angle_deg": 45.0,
        "mud_pressure_psi": 2000.0,
        "calibration": "invalid_calibration_name",
    })
    assert response.status_code == 422

# ----------------------------------------------------------------------
# 7. Chart Parametric Sweeps
# ----------------------------------------------------------------------
def test_chart_time_sweep_with_matching_observations():
    c_exp = calibration("experimental")
    payload = {
        "sweep_variable": "time",
        "calibration": "experimental",
        "fixed_inputs": {
            "deviation_angle_deg": 60.0,
            "mud_pressure_psi": c_exp.P_ref,
        },
        "points": 50,
        "include_source_observations": True,
    }
    response = client.post("/api/v1/charts/sweep", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["sweep_variable"] == "time"
    assert data["x_unit"] == "hr"
    assert len(data["x_values"]) == 50
    assert len(data["results"]["cake_thickness_cm"]) == 50
    assert len(data["results"]["filtrate_volume_cc"]) == 50

    # Matching observations (Figs. 1 & 3)
    obs = data["source_observations"]
    assert obs["has_matching_series"] is True
    assert len(obs["x_values"]) == 5
    assert len(obs["cake_thickness_cm"]) == 5
    assert len(obs["filtrate_volume_cc"]) == 5
    assert "Figs. 1 & 3" in obs["series_label"]

def test_chart_angle_sweep_with_matching_observations():
    c_exp = calibration("experimental")
    payload = {
        "sweep_variable": "deviation_angle",
        "calibration": "experimental",
        "fixed_inputs": {
            "time_hr": 96.0,
            "mud_pressure_psi": c_exp.P_ref,
        },
        "points": 40,
        "include_source_observations": True,
    }
    response = client.post("/api/v1/charts/sweep", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["sweep_variable"] == "deviation_angle"
    assert data["x_unit"] == "deg"
    obs = data["source_observations"]
    assert obs["has_matching_series"] is True
    assert len(obs["x_values"]) == 7
    assert len(obs["cake_thickness_cm"]) == 7
    assert len(obs["filtrate_volume_cc"]) == 7

def test_chart_pressure_sweep_observation_fidelity():
    payload = {
        "sweep_variable": "mud_pressure",
        "calibration": "experimental",
        "fixed_inputs": {
            "time_hr": 96.0,
            "deviation_angle_deg": 60.0,
        },
        "points": 30,
        "include_source_observations": True,
    }
    response = client.post("/api/v1/charts/sweep", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["sweep_variable"] == "mud_pressure"
    assert data["x_unit"] == "psi"
    obs = data["source_observations"]
    assert obs["has_matching_series"] is True
    # Crucial scientific check: Fig. 2 has h(P) but NO Q(P)
    assert obs["cake_thickness_cm"] is not None
    assert len(obs["cake_thickness_cm"]) == 5
    assert obs["filtrate_volume_cc"] is None
    assert "No cumulative filtrate volume Q(P) curve was published" in obs["note"]
    assert any("separability assumption" in w for w in data["metadata"]["warnings"])

def test_chart_off_reference_has_no_matching_series():
    # If sweeping time at an off-reference pressure, no matching published series exists
    payload = {
        "sweep_variable": "time",
        "calibration": "experimental",
        "fixed_inputs": {
            "deviation_angle_deg": 60.0,
            "mud_pressure_psi": 1000.0,  # 1000 psi is far from P_ref (2410 psi)
        },
        "points": 20,
        "include_source_observations": True,
    }
    response = client.post("/api/v1/charts/sweep", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["source_observations"]["has_matching_series"] is False

def test_chart_missing_fixed_inputs_rejected():
    # Sweeping time requires deviation_angle_deg and mud_pressure_psi
    payload = {
        "sweep_variable": "time",
        "calibration": "experimental",
        "fixed_inputs": {
            "deviation_angle_deg": 60.0,
            # mud_pressure_psi omitted
        },
    }
    response = client.post("/api/v1/charts/sweep", json=payload)
    assert response.status_code == 422

# ----------------------------------------------------------------------
# 8. Synthetic Dataset Generation
# ----------------------------------------------------------------------
def test_dataset_generation_preview():
    payload = {
        "time_steps": 10,
        "angle_steps": 5,
        "pressure_steps": 6,
        "calibration": "experimental",
        "preview_rows": 10,
    }
    response = client.post("/api/v1/datasets", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["row_count"] == 300  # 10 * 5 * 6
    assert data["off_source_path_count"] >= 0
    assert len(data["preview"]) == 10
    assert len(data["columns"]) == 7
    first_row = data["preview"][0]
    assert "time_hr" in first_row
    assert "cake_thickness_cm" in first_row
    assert "filtrate_volume_cc" in first_row
    assert "off_path" in first_row

def test_dataset_generation_safety_limit_enforced():
    # Requesting a grid exceeding 50,000 rows must be rejected with 400
    payload = {
        "time_steps": 100,
        "angle_steps": 50,
        "pressure_steps": 50,  # 100 * 50 * 50 = 250,000 rows > 50,000
        "calibration": "experimental",
    }
    response = client.post("/api/v1/datasets", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "DATASET_LIMIT_EXCEEDED"
    assert "50,000" in data["error"]["message"]

def test_dataset_export_csv_post():
    payload = {
        "time_steps": 5,
        "angle_steps": 4,
        "pressure_steps": 3,
        "calibration": "experimental",
    }
    response = client.post("/api/v1/datasets/export", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in response.headers["content-disposition"]
    text = response.text
    lines = text.strip().split("\n")
    assert len(lines) == 61  # 5 * 4 * 3 + header = 61
    assert "time_hr,deviation_angle_deg,mud_pressure_psi" in lines[0]

def test_dataset_export_csv_get():
    response = client.get("/api/v1/datasets/export?time_steps=4&angle_steps=3&pressure_steps=2&calibration=experimental")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    lines = response.text.strip().split("\n")
    assert len(lines) == 25  # 4 * 3 * 2 + 1 = 25
