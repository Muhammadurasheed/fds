# Formation Damage Simulator

> Computational analysis of filtration-induced formation damage in deviated wells.

An engineering calculation and exploratory model interface based on the model and digitised experimental curves of **Akinsete & Isehunwa (2013)** (*Petroleum Science and Technology*, 31(21): 2202–2210).

---

## 1. Project Architecture

This monorepo contains:
- `apps/web/`: Next.js App Router (React, TypeScript, Tailwind CSS, Recharts) frontend.
- `services/api/`: FastAPI backend wrapping the scientific Python calculation engine (NumPy, SciPy, Pandas).
- `services/api/app/scientific/`: Preserved Python scientific calculation core and digitised datasets.
- `archive/legacy-streamlit/`: Preserved original Streamlit prototype for parity verification.

```text
├── apps/
│   └── web/                   # Next.js web application
├── services/
│   └── api/                   # FastAPI backend service
│       ├── app/
│       │   ├── api/           # API routes and Pydantic schemas
│       │   ├── core/          # Configuration, structured errors, logging
│       │   ├── scientific/    # Preserved formation damage computational engine
│       │   └── main.py        # FastAPI entrypoint
│       ├── tests/             # Pytest API and scientific regression suite
│       └── requirements.txt   # Python dependencies
├── archive/
│   └── legacy-streamlit/      # Legacy Streamlit prototype
├── .github/workflows/         # GitHub Actions CI pipeline
├── BLUEPRINT.md               # Product and engineering blueprint contract
└── README.md
```

---

## 2. Quickstart & Local Setup

### Prerequisites
- **Python**: 3.11+ (Python 3.12 or 3.13 recommended)
- **Node.js**: 20+ (v24 supported)
- **Git**

### Backend Setup (FastAPI)

1. Navigate to the API service directory:
   ```bash
   cd services/api
   ```

2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the test suite:
   ```bash
   pytest
   ```

5. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup (Next.js)

1. Navigate to the web application directory:
   ```bash
   cd apps/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run typecheck and build:
   ```bash
   npm run typecheck
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   - Web Application: [http://localhost:3000](http://localhost:3000)

---

## 3. Scientific Model & Domain

- **Cake Thickness**: $h(t) = \sqrt{B_1 t - B_2 e^{-B_3 t}}$ (cm)
- **Cumulative Filtrate Volume**: $Q(t) = B_4 e^{-B_3 t} - B_5 t$ (cc)
- **Calibrated Domain**:
  - Exposure Time: `36.0` to `120.0` hr
  - Deviation Angle: `30.0` to `90.0` deg
  - Mud Pressure: `650.0` to `4650.0` psi
- **Drilling Path Inferred Relation**: $\theta_{\text{path}}(t) = 20 + \frac{10}{24}t$ (deg). Away from this path, estimates rely on the separability assumption.

---

## 4. Verification & Testing

- **Backend Tests**: Run `pytest` inside `services/api`.
- **Frontend Typecheck**: Run `npm run typecheck` inside `apps/web`.
- **Legacy Parity Check**: Run `python -c "import sys; sys.path.insert(0, 'archive/legacy-streamlit'); import formation_damage_model as fm; print(fm.predict(96, 60, fm.calibration('experimental').P_ref, 'experimental'))"` to verify bit-level parity against the original Streamlit code.
