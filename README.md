# Formation Damage Simulator

> Computational analysis of filtration-induced formation damage in deviated wells.

An engineering calculation and exploratory model interface based on the model and digitised experimental curves of **Akinsete & Isehunwa (2013)** (*Petroleum Science and Technology*, 31(21): 2202–2210).

---

## 1. Project Architecture

This monorepo contains:

| Directory | Purpose |
|---|---|
| `frontend/` | Next.js App Router (React, TypeScript, Tailwind CSS, Recharts) |
| `backend/` | FastAPI service wrapping the scientific Python engine (NumPy, SciPy, Pandas) |
| `backend/app/scientific/` | Preserved Python calculation core and digitised experimental datasets |
| `archive/legacy-streamlit/` | Preserved original Streamlit prototype for parity verification |

```text
FDS/
├── frontend/                  # Next.js web application
│   ├── app/                   # App Router pages and layouts
│   └── package.json
├── backend/                   # FastAPI backend service
│   ├── app/
│   │   ├── api/               # API routes and Pydantic schemas
│   │   ├── core/              # Configuration, structured errors, logging
│   │   ├── scientific/        # Preserved formation damage computational engine
│   │   └── main.py            # FastAPI application
│   ├── tests/                 # Pytest API and scientific regression suite
│   ├── environment.yml        # Conda environment definition
│   ├── requirements.txt       # pip requirements (used in CI)
│   ├── run.py                 # Development entry point
│   └── pyproject.toml         # pytest configuration
├── archive/
│   └── legacy-streamlit/      # Legacy Streamlit prototype
├── .github/workflows/         # GitHub Actions CI pipeline
├── BLUEPRINT.md               # Product and engineering blueprint contract
└── README.md
```

---

## 2. Quickstart & Local Setup

### Prerequisites

| Tool | Required Version |
|---|---|
| [Miniconda / Anaconda](https://docs.conda.io/en/latest/miniconda.html) | Any recent version |
| [Node.js](https://nodejs.org/) | 20+ (v24 supported) |
| [Git](https://git-scm.com/) | Any recent version |

> **Note:** The backend uses a Conda environment (`fds-api`) for Python dependency management. Node.js is only required for the frontend.

---

### Backend Setup (FastAPI + Conda)

Open a **PowerShell** terminal.

#### One-time environment setup

```powershell
# 1. Navigate to the backend directory
cd C:\Users\HP\Documents\FDS\backend

# 2. Create the Conda environment from the definition file
conda env create -f environment.yml

# 3. Verify the environment was created
conda env list
```

#### Start the backend server

```powershell
# Navigate to the backend directory
cd C:\Users\HP\Documents\FDS\backend

# Activate the Conda environment
conda activate fds-api

# Start the API server
python run.py
```

The server will start with hot-reload enabled.

| Endpoint | URL |
|---|---|
| Health check | http://localhost:8000/api/v1/health |
| Interactive Swagger docs | http://localhost:8000/docs |
| ReDoc documentation | http://localhost:8000/redoc |

#### Run the backend test suite

```powershell
cd C:\Users\HP\Documents\FDS\backend
conda activate fds-api
pytest -v
```

Expected: **8 passed**.

---

### Frontend Setup (Next.js)

Open a **second PowerShell** terminal, leaving the backend running in the first.

```powershell
# 1. Navigate to the frontend directory
cd C:\Users\HP\Documents\FDS\frontend

# 2. Install Node.js dependencies (first time only)
npm install

# 3. Start the development server
npm run dev
```

The application will be available at http://localhost:3000.

#### Frontend checks

```powershell
cd C:\Users\HP\Documents\FDS\frontend

# TypeScript type check
npm run typecheck

# Production build
npm run build
```

---

## 3. Running Both Services

Run the backend and frontend in **two separate PowerShell terminals**:

**Terminal 1 — Backend:**
```powershell
cd C:\Users\HP\Documents\FDS\backend
conda activate fds-api
python run.py
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Users\HP\Documents\FDS\frontend
npm run dev
```

---

## 4. Scientific Model & Domain

- **Cake Thickness**: $h(t) = \sqrt{B_1 t - B_2 e^{-B_3 t}}$ (cm)
- **Cumulative Filtrate Volume**: $Q(t) = B_4 e^{-B_3 t} - B_5 t$ (cc)
- **Calibrated Domain**:
  - Exposure Time: `36.0` to `120.0` hr
  - Deviation Angle: `30.0` to `90.0` deg
  - Mud Pressure: `650.0` to `4650.0` psi
- **Drilling Path Inferred Relation**: $\theta_{\text{path}}(t) = 20 + \frac{10}{24}t$ (deg). Away from this path, estimates rely on the separability assumption.

---

## 5. Verification & Testing

| Check | Command | Directory |
|---|---|---|
| Backend tests | `pytest -v` | `backend/` |
| Frontend typecheck | `npm run typecheck` | `frontend/` |
| Frontend production build | `npm run build` | `frontend/` |
| Legacy parity check | See below | `FDS/` root |

**Legacy numerical parity check:**

```powershell
cd C:\Users\HP\Documents\FDS
conda activate fds-api
python -c "import sys; sys.path.insert(0, 'archive/legacy-streamlit'); import formation_damage_model as fm; print(fm.predict(96, 60, fm.calibration('experimental').P_ref, 'experimental'))"
```

Expected output: `(0.3406523491981806, 40.05912203311685)`

---

## 6. Environment Variables

Copy `.env.example` to configure local overrides:

```powershell
# Backend (optional — defaults are sufficient for local development)
copy .env.example backend\.env

# Frontend
copy .env.example frontend\.env.local
```

The default configuration works out of the box for local development without any environment variable changes.
