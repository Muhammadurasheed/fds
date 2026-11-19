import numpy as np
import pytest
from app.scientific import formation_damage_model as fm
from app.scientific import data_digitized as dd

def test_calibrations_load():
    exp_c = fm.calibration("experimental")
    model_c = fm.calibration("model")
    assert exp_c is not None
    assert model_c is not None
    assert len(exp_c.B) == 5
    assert len(model_c.B) == 5

def test_theta_path():
    # theta_path(t) = 20 + (10/24)*t
    assert float(fm.theta_path(24.0)) == pytest.approx(30.0)
    assert float(fm.theta_path(96.0)) == pytest.approx(60.0)
    assert float(fm.theta_path(120.0)) == pytest.approx(70.0)

def test_domain_checks():
    # Inside domain
    assert fm.check_domain(96.0, 60.0, 2650.0) == []
    
    # Outside time
    msgs = fm.check_domain(20.0, 60.0, 2650.0)
    assert any("time outside calibrated range" in m for m in msgs)
    
    # Off source path (> 5 deg)
    msgs_off = fm.check_domain(96.0, 80.0, 2650.0)
    assert any("separability assumption" in m for m in msgs_off)

def test_prediction_numerical_consistency():
    c_exp = fm.calibration("experimental")
    res = fm.predict(96.0, 60.0, c_exp.P_ref, "experimental")
    h = float(np.squeeze(res["h"]))
    q = float(np.squeeze(res["Q"]))
    
    # Exact parity with legacy model output
    assert h == pytest.approx(0.3406523491981806, rel=1e-6)
    assert q == pytest.approx(40.05912203311685, rel=1e-6)

def test_bootstrap_prediction_band():
    band = fm.prediction_band(96.0, 60.0, 2650.0, "experimental", level=95)
    assert "h" in band and "Q" in band
    # band['h'] shape is (3,) -> lo, median, hi
    assert band["h"][0] <= band["h"][1] <= band["h"][2]
    assert band["Q"][0] <= band["Q"][1] <= band["Q"][2]

def test_validate_output_structure():
    val = fm.validate("experimental")
    assert "exp" in val and "model" in val
    assert "Fig.1 h(t)" in val["exp"]
    assert "RMSE" in val["exp"]["Fig.1 h(t)"]
    assert "R2" in val["exp"]["Fig.1 h(t)"]
