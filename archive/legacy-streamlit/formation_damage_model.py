"""
formation_damage_model.py  --  computational model of formation damage in a deviated well
Core logic: Akinsete & Isehunwa (2013), Petroleum Science and Technology 31(21):2202-2210
    h(t) = sqrt(B1 t - B2 exp(-B3 t))      cake thickness  [cm]      (Eq. 22/23)
    Q(t) = B4 exp(-B3 t) - B5 t            filtrate volume [cc]      (Eq. 26)
B1..B5 were recovered by curve fitting (see run_fits.py / report Chapter 4).

Angle and pressure effects are applied as RELATIVE correction factors, because the source figures show that
Fig.1/3 (time) and Fig.4/5 (angle) are the same data series (inclination builds along the drilling time):
    theta_path(t) = 20 + (10/24) t      [deg]   (inferred from the data, see report section 4.2)
    h(t,theta,P) = h_t(t) * [h_th(theta)/h_th(theta_path(t))] * [h_P(P)/h_P(P_ref)]
    Q(t,theta,P) = Q_t(t) * [Q_th(theta)/Q_th(theta_path(t))] * [h_P(P)/h_P(P_ref)]   (Q ~ h in P by Eq. 10)
On the source drilling path (theta = theta_path(t), P = P_ref) the model returns exactly Eq. 22 and 26.
"""
import json, os
import numpy as np
from scipy.optimize import least_squares, brentq
from data_digitized import *

HERE = os.path.dirname(os.path.abspath(__file__))
_BS = json.load(open(os.path.join(HERE, 'bootstrap_and_best.json')))
CALIBRATIONS = {'experimental': 'exp', 'model': 'model'}      # label -> key
DOMAIN = dict(t=(36.0, 120.0), theta=(30.0, 90.0), P=(650.0, 4650.0))

def theta_path(t):  return 20.0 + (10.0/24.0)*np.asarray(t, float)
def t_path(theta):  return (np.asarray(theta, float) - 20.0)*24.0/10.0

# ------------------------------------------------------------ time law (Eq. 22 & 26)
def h_time(B, t):
    B1,B2,B3,_,_ = B; t=np.asarray(t,float)
    return np.sqrt(np.clip(B1*t - B2*np.exp(-B3*t), 0.0, None))
def Q_time(B, t):
    _,_,B3,B4,B5 = B; t=np.asarray(t,float)
    return B4*np.exp(-B3*t) - B5*t

# ------------------------------------------------------------ empirical sweep curves (selected by AICc / LOOCV)
def _gauss_fit(x, y):
    best = None
    for mu0 in np.linspace(x.min(), x.max(), 9):
        for s0 in (np.ptp(x)/6, np.ptp(x)/4, np.ptp(x)/2):
            try:
                r = least_squares(lambda q: q[0]*np.exp(-(x-q[1])**2/(2*q[2]**2)) - y, [y.max(), mu0, s0],
                                  bounds=([0, x.min()-np.ptp(x), np.ptp(x)/20], [10*y.max(), x.max()+np.ptp(x), 5*np.ptp(x)]))
            except Exception:
                continue
            if best is None or r.cost < best.cost: best = r
    return best.x
def _gauss(c, x): x=np.asarray(x,float); return c[0]*np.exp(-(x-c[1])**2/(2*c[2]**2))

class Calibration:
    def __init__(self, key):
        self.key = key
        bs = _BS[key]; self.B = np.array(bs['best']); self.B_samples = np.array(bs['samples']); self.B_ci = np.array(bs['ci'])
        hA, qA, hP = (HA_EXP, QA_EXP, HP_EXP) if key == 'exp' else (HA_MODEL, QA_MODEL, HP_MODEL)
        self.g_h_theta = _gauss_fit(THETA, hA)                         # Gaussian: A, mu, sigma
        self.q_theta = np.polyfit(THETA, qA, 1)                        # straight line
        self.g_h_P = _gauss_fit(P, hP)                                 # Gaussian in pressure
        h_base = float(_gauss(self.g_h_theta, 60.0))                   # damage at the base angle 60 deg
        grid = np.linspace(P.min(), P.max(), 4001); v = _gauss(self.g_h_P, grid) - h_base
        idx = np.where(np.diff(np.sign(v)) != 0)[0]
        self.P_ref = float(brentq(lambda x: float(_gauss(self.g_h_P, x)) - h_base, grid[idx[0]], grid[idx[0]+1])) if len(idx) else float(grid[np.argmax(_gauss(self.g_h_P, grid))])
        self.h_base = h_base
    def h_th(self, th):  return _gauss(self.g_h_theta, th)
    def Q_th(self, th):  return np.polyval(self.q_theta, np.asarray(th, float))
    def h_P(self, p):    return _gauss(self.g_h_P, p)

_CAL = {k: Calibration(v) for k, v in CALIBRATIONS.items()}
def calibration(name='experimental'): return _CAL[name]

# ------------------------------------------------------------ public prediction functions
def predict(t, theta, P, calib='experimental', B=None):
    """vectorised. returns dict with h [cm], Q [cc] (numpy arrays broadcast to a common shape)"""
    c = calibration(calib); Bv = c.B if B is None else np.asarray(B)
    t, theta, P = np.broadcast_arrays(np.asarray(t, float), np.asarray(theta, float), np.asarray(P, float))
    th_p = np.clip(theta_path(t), 30.0, 90.0)
    m_h = c.h_th(theta) / np.maximum(c.h_th(th_p), 1e-3)
    m_q = c.Q_th(theta) / c.Q_th(th_p)
    m_p = c.h_P(P) / c.h_P(c.P_ref)
    h = h_time(Bv, t) * m_h * m_p
    Q = np.clip(Q_time(Bv, t) * m_q * m_p, 0, None)
    return dict(h=h, Q=Q, theta_path=theta_path(t), m_theta_h=m_h, m_theta_Q=m_q, m_P=m_p)

def prediction_band(t, theta, P, calib='experimental', level=95):
    """percentile band of h and Q from the bootstrap ensemble of B1..B5"""
    c = calibration(calib); hs=[]; qs=[]
    for B in c.B_samples:
        r = predict(t, theta, P, calib, B=B); hs.append(r['h']); qs.append(r['Q'])
    lo, hi = (100-level)/2, 100-(100-level)/2
    return dict(h=np.percentile(hs, [lo, 50, hi], axis=0), Q=np.percentile(qs, [lo, 50, hi], axis=0))

def check_domain(t, theta, P):
    msgs = []
    if not (DOMAIN['t'][0] <= t <= DOMAIN['t'][1]): msgs.append('time outside calibrated range 36-120 hr (extrapolation)')
    if not (DOMAIN['theta'][0] <= theta <= DOMAIN['theta'][1]): msgs.append('angle outside 30-90 deg (extrapolation)')
    if not (DOMAIN['P'][0] <= P <= DOMAIN['P'][1]): msgs.append('pressure outside 650-4650 psi (extrapolation)')
    if abs(theta - float(theta_path(t))) > 5.0: msgs.append('angle differs from the source drilling path: combined estimate rests on the separability assumption')
    return msgs

def generate_dataset(n_t=25, n_theta=13, n_P=15, calib='experimental', t_range=None, theta_range=None, P_range=None):
    import pandas as pd
    t_range = t_range or DOMAIN['t']; theta_range = theta_range or DOMAIN['theta']; P_range = P_range or DOMAIN['P']
    t = np.linspace(*t_range, n_t); th = np.linspace(*theta_range, n_theta); p = np.linspace(*P_range, n_P)
    T3, TH3, P3 = np.meshgrid(t, th, p, indexing='ij'); r = predict(T3, TH3, P3, calib)
    return pd.DataFrame(dict(time_hr=T3.ravel(), deviation_angle_deg=TH3.ravel(), mud_pressure_psi=P3.ravel(),
                             cake_thickness_cm=r['h'].ravel(), filtrate_volume_cc=r['Q'].ravel(),
                             source_path_angle_deg=r['theta_path'].ravel(),
                             off_path=(np.abs(TH3.ravel()-r['theta_path'].ravel()) > 5.0)))

# ------------------------------------------------------------ validation against the digitized published curves
def _m(y, yh):
    y=np.asarray(y,float); yh=np.asarray(yh,float); res=y-yh; sse=np.sum(res**2); sst=np.sum((y-y.mean())**2)
    mask = y > 0.05*y.max()
    return dict(RMSE=float(np.sqrt(np.mean(res**2))), R2=float(1-sse/sst), MAE=float(np.mean(np.abs(res))),
                MAPE=float(100*np.mean(np.abs(res[mask]/y[mask]))), n=int(len(y)))

def validate(calib='experimental'):
    c = calibration(calib); out = {}
    ref = dict(exp=(H_EXP,Q_EXP,HA_EXP,QA_EXP,HP_EXP), model=(H_MODEL,Q_MODEL,HA_MODEL,QA_MODEL,HP_MODEL))
    for against in ('exp','model'):
        h1,q3,h5,q4,h2 = ref[against]; rows={}
        # Fig 1/3 : source drilling path (theta = theta_path(t), P = P_ref)
        r = predict(T, theta_path(T), c.P_ref, calib); rows['Fig.1 h(t)'] = _m(h1, r['h']); rows['Fig.3 Q(t)'] = _m(q3, r['Q'])
        # Fig 4/5 : angle sweep at t = 96 hr (theta_path = 60 deg), P = P_ref
        r = predict(96.0, THETA, c.P_ref, calib); rows['Fig.5 h(theta)'] = _m(h5, r['h']); rows['Fig.4 Q(theta)'] = _m(q4, r['Q'])
        # Fig 2 : pressure sweep at t = 96 hr, theta = 60 deg
        r = predict(96.0, 60.0, P, calib); rows['Fig.2 h(P)'] = _m(h2, r['h'])
        out[against] = rows
    return out

if __name__ == '__main__':
    for cal in ('experimental','model'):
        c = calibration(cal); print('\n=== calibration:', cal, ' B =', np.array2string(c.B, precision=6), ' P_ref = %.0f psi' % c.P_ref)
        v = validate(cal)
        for against, rows in v.items():
            print('  validated against', against)
            for k, m in rows.items(): print('     %-16s RMSE=%.4f R2=%.4f MAPE=%.1f%%' % (k, m['RMSE'], m['R2'], m['MAPE']))
        print('  example: t=96,theta=60,P=P_ref ->', {k: float(np.squeeze(x)) for k, x in predict(96,60,c.P_ref,cal).items() if k in ('h','Q')})
