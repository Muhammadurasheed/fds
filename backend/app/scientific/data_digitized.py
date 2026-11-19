"""
Digitized data from Akinsete & Isehunwa (2013), Petroleum Science and Technology 31:2202-2210.
Extracted by pixel analysis of the published Figures 1-5 (300 dpi render of the PDF):
  - axes calibrated from the detected frame lines (x-axis, top frame, left axis, right frame)
  - marker centres located by morphological opening + column profiles
Estimated digitizing uncertainty: about +/-1.5 px  (Fig1 ~ +/-0.007 cm, Fig2 ~ +/-0.006 cm,
Fig3 ~ +/-0.5 cc, Fig4 ~ +/-0.6 cc, Fig5 ~ +/-0.007 cm).
Series:  'model' = Present Model (alpha = 2.0), triangles;  'exp' = Experimental, bars;
         'outmans' = Outmans (isotropic) model, diamonds.
"""
import numpy as np

# Fig. 1  cake thickness h (cm) vs time (hr)
T      = np.array([24., 48., 72., 96., 120.])
H_MODEL= np.array([0.000, 0.146, 0.263, 0.375, 0.349])
H_EXP  = np.array([0.000, 0.153, 0.275, 0.387, 0.356])
H_OUT  = np.array([0.050, 0.452, 1.041, 1.348, 1.117])

# Fig. 3  cumulative filtrate volume Q (cc) vs time (hr)
Q_MODEL= np.array([13.6, 21.6, 29.9, 37.5, 45.8])
Q_EXP  = np.array([15.8, 23.8, 32.8, 40.2, 48.0])
Q_OUT  = np.array([29.8, 55.5, 80.0, 106.1, 132.0])

# Fig. 4  filtrate volume Q (cc) vs deviation angle (deg)
THETA  = np.array([30., 40., 50., 60., 70., 80., 90.])
QA_MODEL=np.array([13.2, 20.8, 29.2, 36.8, 45.2, 52.8, 61.0])
QA_EXP = np.array([16.5, 24.3, 32.4, 40.9, 48.5, 56.6, 64.4])
QA_OUT = np.array([29.4, 55.6, 79.9, 105.8, 131.6, 158.2, 184.0])

# Fig. 5  cake thickness h (cm) vs deviation angle (deg)   (30 deg point lies on the axis: estimate)
HA_MODEL=np.array([0.040, 0.138, 0.258, 0.368, 0.345, 0.270, 0.160])
HA_EXP = np.array([0.040, 0.160, 0.278, 0.390, 0.362, 0.290, 0.186])
HA_OUT = np.array([0.050, 0.455, 1.046, 1.349, 1.121, 0.802, 0.450])

# Fig. 2  cake thickness h (cm) vs mud pressure (psi)   (650 psi model point partly hidden: estimate)
P      = np.array([650., 1650., 2650., 3650., 4650.])
HP_MODEL=np.array([0.105, 0.190, 0.291, 0.393, 0.340])
HP_EXP = np.array([0.150, 0.249, 0.399, 0.500, 0.449])
HP_OUT = np.array([0.300, 0.591, 1.200, 1.751, 1.401])
