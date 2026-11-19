# Formation Damage in a Deviated Well
## End-to-End Product & Engineering Blueprint
**Version 1.0 · 19 November 2026**  
**Purpose:** Single source of truth for rebuilding the existing Streamlit computational prototype as a polished, responsive engineering web application.

---

# 0. How to use this blueprint

This document is the product, design and engineering contract for the application. Read Sections 1–7 before writing application code. Implement phases in order. Do not let Antigravity silently change the mathematical model, units, scientific assumptions, API contracts or stated limitations.

Each phase contains:
1. User journey — what the user experiences.
2. Product and feature specification — what must be built.
3. UI/UX and interaction requirements.
4. Data/API contract — what the frontend and backend exchange.
5. Acceptance criteria — observable conditions for completion.
6. Antigravity prompt — copy directly into Antigravity.
7. Manual setup and verification — actions the engineer must perform outside the codebase.

**Agent discipline:** At the beginning of every phase, Antigravity must inspect the actual repository and report its understanding before editing. It must not assume that an earlier phase was implemented exactly as described. The codebase is authoritative for what exists; this blueprint is authoritative for intended product behaviour. If they conflict, stop and report the discrepancy.

**Working rule:** one phase, one review, one tested merge. Do not ask the agent to implement the entire product in one giant prompt.

# 1. Product definition

## 1.1 Product summary

Build a browser-based computational engineering tool for analysing filtration-induced formation damage in a deviated well. A petroleum engineering student or practitioner supplies drilling-condition inputs and receives estimated mud-cake thickness and filtrate volume, with interactive charts, uncertainty information, downloadable generated datasets and transparent explanations of the underlying model.

The tool is an engineering calculator and exploratory model interface. It is not a field-certified simulator, a substitute for laboratory measurements, or a general-purpose reservoir simulator.

## 1.2 Primary users

**Primary: Petroleum engineering students and researchers**
- Need to understand how time, deviation angle and mud pressure relate to cake thickness and filtrate volume.
- Need to explore trends and compare outputs without manually reading several paper figures.
- Need clear units, definitions, equations and warnings.
- May use the output in coursework, research or preliminary analysis.

**Secondary: Drilling and formation-damage practitioners**
- Need rapid exploratory estimates and sensitivity views.
- Need to understand the assumptions and domain before relying on outputs.
- Need exportable data for further analysis.

## 1.3 Product principles

1. **Scientific honesty over visual confidence.** Never make an empirical estimate look more certain than the source data supports.
2. **The Python model is the source of truth.** The frontend must not reimplement equations or fitted curves.
3. **Units are always visible.** Every input, result, axis, table and export column carries an unambiguous unit.
4. **Explain unfamiliar concepts at the point of use.** Tooltips and concise definitions should explain exposure time, deviation angle, mud pressure, cake thickness and filtrate volume.
5. **Progressive disclosure.** Keep the main calculator approachable; make detailed assumptions, coefficients and diagnostics available without overwhelming the first-time user.
6. **Reproducibility.** A user should be able to understand which calibration and model version generated a result.
7. **Responsive and accessible.** The application must work on desktop, tablet and low-end mobile browsers.

## 1.4 Explicit non-goals for version 1

- User accounts, login, roles or multi-tenant workspaces.
- Cloud database, saved projects or server-side calculation history.
- Payment processing or subscription billing.
- Real-time collaboration.
- A new physical formation-damage model.
- Field-scale validation claims.
- AI-generated engineering recommendations.
- Uploading arbitrary user datasets for automatic model fitting.

Do not add Firebase, Supabase, PostgreSQL, Redis or a separate NestJS service in v1. There is no current product requirement that justifies them.

# 2. Existing scientific application — preserve and expose

## 2.1 Existing files

The supplied `formation_damage_tool.zip` contains:
- `app.py`: current Streamlit interface with Estimate, Charts, Dataset generator, and Method and validity tabs.
- `formation_damage_model.py`: prediction functions, calibration, bootstrap prediction bands, domain checks, dataset generation and validation.
- `data_digitized.py`: digitised values from Figures 1–5 of Akinsete and Isehunwa (2013).
- `run_fits.py`: parameter fitting, five fitting methods, bootstrap, leave-one-out cross-validation and empirical curve selection.
- `fit_results.json` and `bootstrap_and_best.json`: fitted parameter results and bootstrap samples.
- `figs/`: generated plots supporting the analysis.
- `README.md` and `requirements.txt`.

The first implementation task is to inspect all these files and establish tests around the existing behaviour before moving code.

## 2.2 Core equations

The time-dependent cake thickness relationship is:

`h(t) = sqrt(B1*t - B2*exp(-B3*t))`

The time-dependent filtrate-volume relationship is:

`Q(t) = B4*exp(-B3*t) - B5*t`

Where:
- `h` = mud-cake thickness, cm.
- `Q` = cumulative filtrate volume, cc.
- `t` = exposure time, hr.
- `B1` through `B5` = fitted constants recovered from digitised source curves.

The same `B3` appears in both equations. Do not change the sign convention or parameter order. Do not silently clamp, transform or refit parameters in the frontend.

## 2.3 Current model construction

The existing implementation applies relative correction factors for deviation angle and pressure to the time-based equations. The angle path inferred from the source series is:

`theta_path(t) = 20 + (10/24)*t` degrees.

The implementation uses:
- a Gaussian empirical curve for cake thickness versus angle;
- a linear empirical curve for filtrate volume versus angle;
- a Gaussian empirical curve for cake thickness versus pressure;
- a pressure correction applied to filtrate volume in proportion to cake thickness, because a separate Q-versus-pressure series was not published.

On the source drilling path, at the reference pressure, the model returns the fitted time equations. Away from that path, the combined estimate depends on a separability assumption.

**This assumption must be visible in the UI and exports.** Do not describe every three-variable combination as an independently experimentally validated result.

## 2.4 Current calibration and domain

The current app exposes two calibrations:
- Experimental data (default).
- Akinsete's model curve.

The stated calibrated domain is:
- Exposure time: 36–120 hr.
- Deviation angle: 30–90 degrees.
- Mud pressure: 650–4650 psi.

The current application can display estimates outside the calibrated time interval in some places and warns about extrapolation. The redesigned app must make this distinction more explicit.

The model checks whether the selected angle differs from the inferred source drilling path by more than 5 degrees. When it does, it warns that the combined estimate relies on the separability assumption.

## 2.5 Scientific limitations that must not be hidden

1. The time and angle series in the source publication appear to represent the same drilling path, so their effects are confounded.
2. The constants B1–B5 were recovered by fitting digitised figures; they were not tabulated directly in the source paper.
3. The time-based cake-thickness equation cannot reproduce the observed post-peak decline after approximately 100 hours.
4. The filtrate-volume pressure correction is inferred by scaling with the cake-thickness pressure response; an independent Q-versus-pressure curve was not published.
5. The source dataset is limited. Parameter estimates are correlated and are not uniquely determined by a large independent experimental dataset.
6. Validation against digitised curves used to reconstruct or calibrate the model is a reproduction/implementation check, not independent external validation.
7. The model is not field validated.
8. Predictions away from the inferred source path depend on separability assumptions.

These limitations must be presented in plain language, not buried in legal-style disclaimers.

## 2.6 Behavioural preservation tests

Before replacing Streamlit, create regression tests using the existing Python functions. Record representative outputs for:
- experimental and model calibrations;
- one or more points on the source drilling path;
- angle sweeps;
- pressure sweeps;
- bootstrap bands;
- dataset generation;
- in-domain and out-of-domain inputs.

The new API must match the legacy implementation within documented numerical tolerances. Any intentional change requires a written explanation and explicit approval.

# 3. Architecture decisions

## 3.1 Selected stack

**Frontend**
- Next.js App Router.
- React and TypeScript.
- Tailwind CSS.
- shadcn/ui components where useful, with a restrained custom design system.
- Recharts for interactive charts.
- Zod for client-side form validation.
- React Hook Form only where forms become sufficiently complex.

**Backend**
- Python 3.12 (or the compatible version established by dependency testing).
- FastAPI.
- Pydantic request/response schemas.
- NumPy, SciPy and Pandas, reusing the existing scientific engine.
- Pytest for unit and API tests.

**Infrastructure**
- GitHub repository.
- GitHub Actions for lint, typecheck, tests and builds.
- Vercel for Next.js.
- Google Cloud Run for FastAPI.
- Docker for reproducible local and cloud execution.

**No database in v1.** No authentication. No Redis. No background queue. No ORM. The calculations are stateless and the source datasets are bundled with the application.

## 3.2 Why Next.js

This application has several distinct routes and a shared application shell. Next.js provides a structured routing and layout system, good TypeScript support, reusable server/client component boundaries and straightforward deployment to Vercel. Use client components for interactive controls and charts. Do not introduce unnecessary server actions or server-side data persistence.

## 3.3 Why FastAPI instead of NestJS

The scientific source of truth is already Python and depends on NumPy, SciPy and Pandas. FastAPI exposes these functions directly with typed request/response contracts. A NestJS layer would require another runtime and cross-language integration without a meaningful v1 benefit. Do not port the scientific calculations to TypeScript.

## 3.4 High-level architecture

```text
Browser
  |
  | HTTPS
  v
Next.js application (Vercel)
  |  - application shell and routes
  |  - input controls and client validation
  |  - charts and result presentation
  |  - CSV download interaction
  |
  | HTTPS JSON API
  v
FastAPI service (Cloud Run)
  |  - request validation
  |  - domain checks and warnings
  |  - prediction orchestration
  |  - uncertainty calculations
  |  - dataset generation
  |  - validation metadata
  |
  v
Existing Python scientific engine
  |  - formation_damage_model.py
  |  - data_digitized.py
  |  - bootstrap_and_best.json
  |  - fit results and calibration assets
```

The frontend may display a result, but only the Python backend calculates it. No browser-side duplicate equations.

## 3.5 Suggested repository structure

```text
formation-damage-web/
  apps/
    web/
      app/
        (product)/
          page.tsx
          estimate/page.tsx
          charts/page.tsx
          dataset/page.tsx
          methodology/page.tsx
        layout.tsx
        globals.css
        error.tsx
        not-found.tsx
      components/
        layout/
        navigation/
        forms/
        results/
        charts/
        methodology/
        ui/
      lib/
        api/
        schemas/
        formatters/
        constants/
      public/
      tests/
      package.json
      tsconfig.json
  services/
    api/
      app/
        main.py
        api/
          routes/
          schemas/
          dependencies.py
        core/
          config.py
          errors.py
          logging.py
        services/
          prediction_service.py
          dataset_service.py
          metadata_service.py
        scientific/
          formation_damage_model.py
          data_digitized.py
          bootstrap_and_best.json
          fit_results.json
      tests/
      Dockerfile
      pyproject.toml
  docs/
    architecture.md
    scientific-model.md
    api-contract.md
  .github/workflows/ci.yml
  .env.example
  .gitignore
  README.md
```

Adapt the exact paths if the existing archive suggests a better migration, but keep the separation between frontend, API and scientific engine.

## 3.6 API design principles

- Version the API under `/api/v1`.
- JSON requests and responses use snake_case consistently, or define a documented camelCase conversion layer. Do not mix conventions casually.
- Every numeric response includes explicit units in field names or documented schema.
- Every prediction response includes calibration name, model version, domain status and warnings.
- Return structured errors, never raw tracebacks.
- Do not silently accept malformed or non-finite numbers.
- Set reasonable request-size and dataset-row limits.
- Keep calculations stateless.
- Use CORS allowlisting for the deployed frontend origin; local development origins may be added explicitly.
- Add a lightweight `/health` endpoint.
- Do not claim that a health endpoint proves scientific correctness; it proves the service is alive.

# 4. Product experience and navigation

## 4.1 Application identity

Working product name: **Formation Damage Simulator**.

Descriptor: *Computational analysis of filtration-induced formation damage in deviated wells.*

Do not invent a commercial brand identity, institutional endorsement or claim of field certification. The footer should identify the academic model basis and the Department of Petroleum Engineering, University of Ibadan only if the project owner approves that attribution.

## 4.2 Global navigation

Desktop:
- Brand / product name on the left.
- Primary navigation: Overview, Estimate, Charts, Dataset, Methodology.
- Small status indicator: “Model available” based on API health.
- Optional “About this model” link.

Mobile:
- Compact header with product name.
- Accessible menu or bottom navigation.
- Main content in a single column.
- Controls must not require horizontal scrolling.

## 4.3 First visit journey

1. User opens the root URL.
2. The landing page explains what the tool estimates in one concise paragraph.
3. A clear primary action takes the user to Estimate.
4. Three short capability summaries introduce Estimate, Explore charts and Generate dataset.
5. A visible model-scope note communicates the calibrated ranges and that the tool is based on digitised published curves.
6. The user can open Methodology before calculating if they want to understand the model.

Do not force a sign-up, onboarding wizard or modal.

## 4.4 Estimate journey

1. User opens Estimate.
2. They see a short explanation and three input controls:
   - Exposure time (hr).
   - Deviation angle (degrees).
   - Mud pressure (psi).
3. Each input has a visible unit, sensible default, valid-range hint and contextual help.
4. The calibration selector is visible but not dominant; Experimental is the default.
5. The uncertainty-band option defaults to enabled if the API can calculate it within acceptable latency.
6. User selects Calculate.
7. The interface displays a clear loading state and prevents duplicate submissions.
8. The results panel displays cake thickness and filtrate volume.
9. The page displays domain and assumption warnings where applicable.
10. A chart shows the selected point in context.
11. The user can copy or export the calculation inputs and outputs, including model metadata.

## 4.5 Charts journey

1. User opens Charts.
2. Selects the sweep variable: Time, Deviation angle or Mud pressure.
3. Chooses calibration and any fixed values required by the selected sweep.
4. The app shows two aligned charts: cake thickness and filtrate volume where source/model support exists.
5. Legends identify fixed values and series.
6. Source digitised observations are visually distinguishable from model curves.
7. A visible note explains when a sweep includes separability assumptions or lacks a matching published source series.
8. User can download the chart data as CSV.

## 4.6 Dataset journey

1. User opens Dataset.
2. Sets the number of time, angle and pressure steps.
3. Sets the range for each variable, within the supported domain by default.
4. The UI displays the projected row count before generation.
5. If the row count exceeds the configured maximum, generation is blocked with an actionable explanation.
6. User selects Generate.
7. The API returns labelled rows and metadata.
8. The UI shows row count, calibration, domain and off-source-path count.
9. User previews a small, representative sample.
10. User downloads the full CSV.

## 4.7 Methodology journey

The page explains, in progressive sections:
- Physical meaning of cake thickness and filtrate volume.
- Source paper and equations.
- Meaning and units of all variables.
- How B1–B5 were recovered.
- Experimental versus model calibration.
- How angle and pressure corrections are applied.
- Bootstrap uncertainty.
- Validation approach.
- Calibrated domain.
- Limitations and interpretation guidance.

Avoid presenting a dense wall of equations without explanation. Each equation should be followed by a plain-language interpretation and a units table.

# 5. Design system and interaction rules

## 5.1 Visual direction

Use a clean technical-scientific aesthetic. It should feel like a modern engineering instrument, not a generic admin dashboard or a flashy startup landing page.

- Neutral background and restrained accent colour.
- Strong typography hierarchy.
- Generous but efficient spacing.
- Clear numerical typography for outputs.
- Subtle borders and surfaces.
- Minimal gradients and decorative animation.
- Charts receive adequate space and legible labels.
- No glassmorphism or excessive shadows.

The agent may propose a palette, but it must define design tokens before building individual pages and apply them consistently.

## 5.2 Core components

Build reusable components:
- `AppShell`
- `PrimaryNavigation`
- `PageHeader`
- `InputField`
- `UnitLabel`
- `RangeHint`
- `HelpTooltip`
- `CalibrationSelector`
- `UncertaintyToggle`
- `PrimaryAction`
- `MetricCard`
- `WarningPanel`
- `ChartPanel`
- `ChartLegend`
- `DataPreviewTable`
- `DownloadAction`
- `MethodologyCallout`
- `EmptyState`
- `ErrorState`
- `LoadingState`

## 5.3 States every interactive screen must support

- Initial/default.
- Editing inputs.
- Valid input.
- Invalid input.
- Submitting/loading.
- Successful result.
- Successful result with scientific warning.
- API unavailable.
- API timeout.
- Empty chart/data state.
- Export in progress.
- Export failure.
- Mobile layout.

Never leave a blank panel or an indefinite spinner.

## 5.4 Accessibility

- Semantic HTML and correctly associated labels.
- Full keyboard operation.
- Visible focus indicators.
- Sufficient colour contrast.
- Do not communicate warning severity through colour alone.
- Chart summaries or accessible data tables for important chart information.
- Respect reduced-motion preferences.
- Tooltips must also be reachable by keyboard and touch.

# 6. API contracts

These are the initial contracts. Antigravity may refine implementation details, but it must not change semantics without documenting the change.

## 6.1 Health

`GET /api/v1/health`

Response:
```json
{
  "status": "ok",
  "service": "formation-damage-api",
  "model_loaded": true,
  "model_version": "1.0.0"
}
```

## 6.2 Model metadata

`GET /api/v1/model/metadata`

Response should include:
- Model name and source citation.
- Model version.
- Available calibration names.
- Supported variable ranges and units.
- Equation strings or structured equation metadata.
- Known limitations.
- Whether uncertainty bands are available.
- A short explanation of the source-path/separability warning.

## 6.3 Prediction

`POST /api/v1/predictions`

Request:
```json
{
  "time_hr": 96,
  "deviation_angle_deg": 60,
  "mud_pressure_psi": 2650,
  "calibration": "experimental",
  "include_uncertainty": true,
  "uncertainty_level": 95
}
```

Response:
```json
{
  "inputs": {
    "time_hr": 96,
    "deviation_angle_deg": 60,
    "mud_pressure_psi": 2650
  },
  "calibration": "experimental",
  "model_version": "1.0.0",
  "results": {
    "cake_thickness_cm": 0.0,
    "filtrate_volume_cc": 0.0
  },
  "uncertainty": {
    "level": 95,
    "cake_thickness_cm": {
      "lower": 0.0,
      "median": 0.0,
      "upper": 0.0
    },
    "filtrate_volume_cc": {
      "lower": 0.0,
      "median": 0.0,
      "upper": 0.0
    }
  },
  "domain": {
    "within_calibrated_ranges": true,
    "on_source_path": true,
    "warnings": []
  }
}
```

The zero values above are schema examples, not expected engineering results. The implementation must return actual model outputs and must not hardcode the example values.

Important: inspect the existing `prediction_band` function before finalising the uncertainty response. Confirm whether its median is the central bootstrap percentile and whether the point estimate is exactly the same quantity. Document the distinction if needed.

## 6.4 Chart data

`POST /api/v1/charts/sweep`

Request:
```json
{
  "sweep_variable": "time",
  "calibration": "experimental",
  "fixed_inputs": {
    "deviation_angle_deg": 60,
    "mud_pressure_psi": 2650
  },
  "points": 100,
  "include_source_observations": true
}
```

The backend returns:
- x-axis values and unit;
- cake-thickness series;
- filtrate-volume series where applicable;
- source observations where a matching series exists;
- calibration and model metadata;
- warnings and assumptions.

The API must validate which fixed inputs are required for each sweep. It must not pretend that a source observation series exists for a figure that was not published.

## 6.5 Dataset generation

`POST /api/v1/datasets`

Request:
```json
{
  "time_steps": 25,
  "angle_steps": 13,
  "pressure_steps": 15,
  "time_range_hr": [36, 120],
  "angle_range_deg": [30, 90],
  "pressure_range_psi": [650, 4650],
  "calibration": "experimental"
}
```

Response:
- generated rows;
- row count;
- off-source-path count;
- model/calibration metadata;
- column definitions and units.

Set a documented maximum row count. The initial UI should prevent excessive requests before they reach the API. The backend must independently enforce the same limit.

For v1, JSON response plus browser-generated CSV is acceptable if payload size is reasonable. If a streaming CSV endpoint is implemented, document and test it. Do not create a database or background queue for this feature.

## 6.6 Validation summary

`GET /api/v1/model/validation`

Returns the existing validation metrics for both calibrations and the digitised series. Clearly label the reference series and state that comparison to calibration/reconstruction data is not independent external validation.

## 6.7 Error format

Use a consistent error body:
```json
{
  "error": {
    "code": "INPUT_OUT_OF_RANGE",
    "message": "Exposure time must be between 36 and 120 hours for an in-domain estimate.",
    "details": {
      "field": "time_hr",
      "minimum": 36,
      "maximum": 120
    }
  }
}
```

Do not expose Python tracebacks, file paths, secrets or raw internal exceptions.

# 7. Phased implementation plan

# PHASE 0 — Repository audit and foundation

**Owner:** Primary engineer / Antigravity  
**Depends on:** Supplied ZIP and this blueprint.

### User journey

There is no end user yet. The engineer clones the repository, installs dependencies, starts the frontend and API, and sees a working health check. A second developer should be able to do the same using only the README.

### Build specification

1. Inspect every file in the supplied ZIP, including JSON structures and plot assets.
2. Record the current Python version and dependency compatibility.
3. Create a Git repository and monorepo structure.
4. Move the existing Python engine into `services/api/app/scientific/` without changing scientific behaviour.
5. Keep the legacy Streamlit app temporarily in an `archive/legacy-streamlit/` folder or a clearly marked migration branch. Do not delete it until parity tests pass.
6. Create a minimal Next.js TypeScript application.
7. Create a minimal FastAPI application with `/api/v1/health`.
8. Add `.env.example` with variable names only. v1 should need very few secrets; local API URL and allowed frontend origins are sufficient.
9. Add linting, formatting, type checking and tests.
10. Add CI that runs on pull requests and pushes.
11. Write exact setup and run commands in README.

### Acceptance criteria

- Frontend starts locally.
- API starts locally.
- Health check returns 200.
- Python scientific imports work from the API package.
- CI passes on a clean checkout.
- Legacy Streamlit source remains recoverable.
- No scientific calculation has been rewritten in TypeScript.

### Antigravity prompt — Phase 0

```text
Act as a principal full-stack engineer, Python scientific-computing engineer, product-minded frontend architect and pragmatic SRE.

PROJECT: Formation Damage Simulator — a browser-based engineering tool for computational analysis of filtration-induced formation damage in deviated wells.

MANDATORY FIRST STEP:
Before editing anything, inspect the entire supplied repository and archive contents. Read app.py, formation_damage_model.py, data_digitized.py, run_fits.py, requirements.txt, README.md, fit_results.json and bootstrap_and_best.json. Inspect the structure and representative contents of all generated figures. Report:
1. Existing application behaviour.
2. Scientific engine functions and dependencies.
3. Data files and their relationships.
4. Current input ranges and warnings.
5. Existing limitations and any inconsistencies.
6. A proposed migration plan that preserves numerical behaviour.

Do not start implementation until you have produced this audit.

ARCHITECTURE:
- Next.js App Router + React + TypeScript frontend.
- FastAPI Python backend.
- Existing NumPy/SciPy/Pandas model remains the scientific source of truth.
- Vercel frontend; Google Cloud Run API.
- No database, authentication, Redis, queue or NestJS in v1.

TASK:
1. Create the monorepo structure specified in the blueprint.
2. Preserve the existing scientific source files and JSON assets under the API package.
3. Keep the original Streamlit app recoverable in an archive/migration location.
4. Scaffold the Next.js application.
5. Scaffold FastAPI with /api/v1/health.
6. Add Python and frontend dependency manifests with pinned or bounded versions appropriate to reproducible deployment.
7. Add lint, format, typecheck and test commands.
8. Add GitHub Actions CI for frontend and backend.
9. Add .env.example and a useful README with exact setup commands.

ENGINEERING RULES:
- Do not alter equations, constants, fitted data, calibration logic or model assumptions.
- Do not port equations to JavaScript.
- Do not add a database or authentication.
- Do not create fake endpoints that return fabricated scientific values.
- No secrets in source control.
- Keep modules small and explicit.
- Add tests before moving or refactoring scientific functions.

At completion, report exact files created/changed, commands run, tests and their results, unresolved issues, and numbered manual setup steps. Do not claim a command or test succeeded unless you actually ran it.
```

### Manual steps

1. Create the GitHub repository.
2. Extract the ZIP into the project working directory.
3. Open the root directory in Antigravity.
4. Paste the Phase 0 prompt.
5. Review the audit before approving implementation.
6. Run the README commands yourself.
7. Push the foundation branch and confirm CI is green.

# PHASE 1 — Product design system and application shell

**Depends on:** Phase 0 merged and locally runnable.

### User journey

A first-time user opens the application and immediately understands what it does, what it estimates and where to begin. Navigation is predictable. The app works on desktop and mobile before the calculator is wired to the API.

### Build specification

1. Define design tokens: typography, spacing, surfaces, borders, focus, status and chart colours.
2. Build the global responsive application shell.
3. Build routes: `/`, `/estimate`, `/charts`, `/dataset`, `/methodology`.
4. Build reusable components listed in Section 5.2.
5. Build a landing page with product summary, three core workflows, scope note and CTA.
6. Add loading, error, empty and not-found states.
7. Add accessible navigation and mobile menu.
8. Add a small API availability indicator, but do not block the landing page if the API is offline.
9. Use mock data only in isolated component previews/tests. Never present mock outputs as real calculations in the live application.

### Acceptance criteria

- All routes render.
- Navigation works with keyboard and touch.
- Layout works at mobile, tablet and desktop breakpoints.
- No horizontal overflow at common mobile widths.
- Design components are reusable.
- API-down state is clear and does not crash the shell.

### Antigravity prompt — Phase 1

```text
MANDATORY FIRST STEP:
Read the entire current frontend codebase, design tokens, package scripts and Phase 0 summary. Inspect the backend health contract. Do not assume the folder structure or component conventions. Summarise the existing architecture before editing.

TASK — PHASE 1: PRODUCT DESIGN SYSTEM AND APP SHELL

Build the visual foundation for Formation Damage Simulator.

USER:
A petroleum engineering student or practitioner who wants to estimate mud-cake thickness and filtrate volume in a deviated well. The user may be unfamiliar with some technical terms and may be using a phone.

ROUTES:
- /
- /estimate
- /charts
- /dataset
- /methodology

DESIGN DIRECTION:
A refined technical/scientific instrument. Restrained palette, strong typography, clear numerical hierarchy, generous but efficient spacing, subtle borders, highly legible charts. Avoid generic admin-dashboard styling, excessive gradients, glassmorphism and decorative animation.

IMPLEMENT:
1. Responsive AppShell and navigation.
2. Design tokens and typography system.
3. Reusable input, metric, tooltip, warning, chart, table, loading, empty and error components.
4. Landing page that explains the tool and links to the four workflows.
5. Responsive mobile navigation.
6. Accessible focus, labels, contrast and reduced-motion behaviour.
7. Error and not-found routes.
8. API availability indicator using the actual health endpoint if available.

IMPORTANT:
- Do not invent scientific outputs.
- If a screen is not yet integrated, use a clearly marked development placeholder, not fake engineering results.
- Every screen must have mobile, tablet and desktop behaviour.
- Keep UI components separate from API logic.
- Do not install a large component library if a small set of accessible primitives is sufficient.

At completion, provide a screen-by-screen summary, component inventory, responsive test results, accessibility checks and manual verification steps.
```

### Manual steps

1. Review the landing page and each route at desktop and mobile widths.
2. Confirm the navigation labels match the intended user journeys.
3. Check keyboard navigation and visible focus.
4. Approve the design tokens before building detailed calculator screens.

# PHASE 2 — Scientific engine integration and FastAPI contracts

**Depends on:** Phase 0 and API shell.

### User journey

The user does not see this phase directly. It ensures every number shown by the application is produced by the existing Python scientific engine and returned through stable, documented contracts.

### Build specification

1. Move/import the existing model with minimal changes.
2. Add regression tests comparing legacy function outputs to migrated outputs.
3. Implement `/health`, `/model/metadata`, `/predictions`, `/charts/sweep`, `/datasets` and `/model/validation`.
4. Validate finite numeric values, calibration names, ranges, point counts and dataset row limits.
5. Implement structured errors.
6. Configure CORS for local and production frontend origins.
7. Add structured logging without logging sensitive or unnecessary user data.
8. Add API schema documentation through FastAPI OpenAPI.
9. Benchmark prediction and dataset endpoints at representative sizes.
10. Ensure bootstrap calculations do not block requests for an unreasonable period. If needed, optimise or cache immutable bootstrap samples in process memory; do not add Redis.

### Acceptance criteria

- Regression tests pass within documented tolerances.
- All endpoints return documented schemas.
- Invalid inputs return structured 4xx responses.
- API never returns NaN or Infinity as valid JSON.
- Dataset row limits are enforced server-side.
- CORS is restrictive in production.
- Swagger/OpenAPI docs accurately describe contracts.

### Antigravity prompt — Phase 2

```text
MANDATORY FIRST STEP:
Read the complete backend and scientific package. Read the original Streamlit app and compare every call to the scientific engine. Read the Phase 0 migration audit and tests. Do not modify model mathematics until you have explained how calibration, prediction, uncertainty, domain checks, validation and dataset generation work.

TASK — PHASE 2: FASTAPI SCIENTIFIC API

The Python engine is the only scientific source of truth.

Implement the API contracts in Section 6 of the blueprint:
- GET /api/v1/health
- GET /api/v1/model/metadata
- POST /api/v1/predictions
- POST /api/v1/charts/sweep
- POST /api/v1/datasets
- GET /api/v1/model/validation

REQUIREMENTS:
1. Reuse the existing Python functions.
2. Do not rewrite formulas in Python or TypeScript.
3. Preserve both experimental and model calibrations.
4. Preserve bootstrap uncertainty functionality.
5. Return explicit units and model metadata.
6. Return domain warnings and source-path/separability warnings.
7. Distinguish an out-of-range input from an in-range input that is off the source drilling path.
8. Validate all inputs with Pydantic.
9. Reject NaN, Infinity, unsupported calibration names and malformed ranges.
10. Enforce a maximum dataset row count in the backend.
11. Return structured errors; never leak stack traces.
12. Add regression tests against the legacy app's outputs.
13. Add endpoint tests for success, invalid inputs, warnings and API errors.
14. Document any response-schema adjustment before making it.

SCIENTIFIC CARE:
The current source data has confounding between time and angle. Q pressure correction is inferred from cake-thickness pressure response. The time-based cake equation does not reproduce the observed post-peak decline. Validation against digitised calibration curves is not independent external validation. Preserve these caveats in metadata and warnings.

UNCERTAINTY:
Inspect the actual prediction_band implementation. Establish whether displayed bounds and central value correspond to the point estimate or bootstrap median. Do not assume. Document the exact semantics in the API schema.

At completion, give me endpoint examples, test results, regression comparison results, benchmark timings and exact local commands to run the API.
```

### Manual steps

1. Install the backend dependencies using the README instructions.
2. Run the API locally.
3. Open `/docs` and inspect each endpoint schema.
4. Run the backend test suite.
5. Compare several API results against the original Streamlit app.
6. Do not proceed if numerical parity has unexplained differences.

# PHASE 3 — Estimate experience

**Depends on:** Phase 1 and Phase 2.

### User journey

The user opens Estimate, enters three drilling conditions, chooses a calibration and calculates. The app presents two primary outputs with units, uncertainty information and any scientific warnings. The user can understand what the result means without reading the source code.

### Screen layout

Desktop:
- Page title and short explanatory subtitle.
- Input panel on the left.
- Results and chart area on the right.
- Warnings immediately below the result summary.
- Detailed model context lower on the page.

Mobile:
- Inputs first.
- Calculate action.
- Results.
- Warnings and chart.
- No two-column layout that compresses controls.

### Input specification

**Exposure time**
- Numeric input, hours.
- In-domain range: 36–120 hr.
- Default: 96 hr.
- Explain that it represents exposure time used by the model.

**Deviation angle**
- Numeric input, degrees.
- In-domain range: 30–90°.
- Default: 60°.
- Explain the convention used by the source model; confirm whether 0° is vertical and 90° is horizontal before publishing this explanatory copy.

**Mud pressure**
- Numeric input, psi.
- In-domain range: 650–4650 psi.
- Default: a documented representative value from the model metadata, not an invented universal operating condition.

**Calibration**
- Experimental data (default).
- Akinsete model curve.

**Uncertainty**
- Show 95% bootstrap band by default if performance is acceptable.
- Explain that the interval reflects fitted-parameter uncertainty under the bootstrap procedure, not total field uncertainty.

### Result specification

Two primary metrics:
- Cake thickness (cm).
- Filtrate volume (cc).

Show:
- Selected input values.
- Calibration.
- Model version.
- Uncertainty interval if requested.
- Domain status.
- Warnings.

A selected-point chart may show the output against exposure time with the selected point highlighted. Ensure the chart does not imply that the other two variables are changing when they are held fixed.

### Acceptance criteria

- Results come only from `/predictions`.
- Input validation is consistent with the API.
- Out-of-range values cannot be mistaken for in-domain estimates.
- Off-source-path warnings are visible.
- Loading, error and success states work.
- Copy/export includes inputs, outputs, units, calibration and warnings.
- Mobile controls are usable without zooming.

### Antigravity prompt — Phase 3

```text
MANDATORY FIRST STEP:
Read the complete frontend and backend. Read the actual /predictions contract and its tests. Inspect the scientific metadata returned by the API. Do not invent defaults, ranges, warning logic or uncertainty semantics.

TASK — PHASE 3: ESTIMATION EXPERIENCE

Build the complete /estimate user journey.

INPUTS:
- exposure time in hr;
- deviation angle in degrees;
- mud pressure in psi;
- calibration: experimental or model;
- optional 95% bootstrap uncertainty.

Use the supported domain from API metadata:
- 36–120 hr;
- 30–90 degrees;
- 650–4650 psi.

Do not hardcode these values in multiple components. Read them from model metadata or a single typed configuration derived from the API.

INTERACTION:
1. User edits inputs.
2. Validate values and show inline errors.
3. Explain units and technical terms at point of use.
4. On Calculate, call POST /api/v1/predictions.
5. Show a meaningful loading state.
6. Present cake thickness and filtrate volume as the primary results.
7. Present uncertainty intervals with a clear explanation.
8. Present domain and off-source-path warnings prominently.
9. Show a chart that contextualises the result without misrepresenting held variables.
10. Allow copying/exporting a compact calculation summary.

DESIGN:
- Desktop input/result split.
- Mobile single-column flow.
- Strong numeric hierarchy.
- No clutter or excessive technical prose above the results.
- Progressive disclosure for detailed model information.

SCIENTIFIC RULES:
- Never calculate h or Q in the browser.
- Never hide warnings.
- Do not call bootstrap intervals total predictive or field uncertainty.
- Do not imply external field validation.
- Do not label extrapolated estimates as validated.

TEST:
- valid in-domain estimate;
- each boundary value;
- below/above each domain;
- off-source-path estimate;
- both calibrations;
- uncertainty enabled/disabled;
- API unavailable;
- malformed input;
- mobile layout.

At completion, report every tested scenario and provide numbered manual steps to verify one calculation against the legacy Streamlit app.
```

### Manual steps

1. Start API and frontend locally.
2. Test the default calculation.
3. Test each boundary and out-of-range condition.
4. Compare results with the legacy Streamlit app.
5. Confirm warnings are visible and understandable.
6. Review the mobile experience.

# PHASE 4 — Interactive charts and sensitivity exploration

**Depends on:** Phase 2 API and Phase 3 shared components.

### User journey

The user wants to understand trends rather than calculate one point. They select a variable to sweep, hold the other conditions fixed and inspect how cake thickness and filtrate volume respond.

### Build specification

1. Add sweep selector: Time, Deviation angle, Mud pressure.
2. Show only the fixed inputs relevant to the selected sweep.
3. Use API-returned chart data.
4. Plot cake thickness and filtrate volume in separate, aligned charts with independent units.
5. Use consistent colours for outputs and distinct markers for digitised source observations.
6. Include legends, tooltips, axis labels and units.
7. Make the selected calibration visible.
8. Add annotations for calibrated limits and warnings.
9. Add an accessible table view of chart values.
10. Add CSV export of the plotted series.
11. Do not draw a source-observation series where no matching source observations exist.
12. Explain when a sweep depends on the separability assumption.

### Acceptance criteria

- All three sweep modes work.
- Fixed inputs update the returned chart series.
- Units and legends are correct.
- Source observations are visually distinguishable.
- No chart suggests a stronger validation basis than exists.
- Exported CSV matches displayed chart data.
- Charts remain legible on mobile.

### Antigravity prompt — Phase 4

```text
MANDATORY FIRST STEP:
Inspect the actual chart sweep endpoint, response schemas, model metadata and current chart components. Read the source digitised series and verify which published figure supports each series. Do not invent observations.

TASK — PHASE 4: CHART EXPLORER

Build /charts for three sweep modes:
1. Time.
2. Deviation angle.
3. Mud pressure.

For each mode:
- Show the sweep variable and unit.
- Show only the required fixed inputs.
- Call POST /api/v1/charts/sweep.
- Render cake thickness and filtrate volume as separate charts.
- Display source digitised observations only when a matching series exists.
- Clearly distinguish calculated model curves from source observations.
- Add tooltips, legends, axis labels and responsive behaviour.
- Provide a table alternative and CSV export.
- Display model calibration and warnings.

SCIENTIFIC RULES:
- Do not manufacture source data.
- Do not use a shared y-axis for cm and cc.
- Do not suggest all angle/time combinations are independently experimentally validated.
- Do not hide pressure-sweep limitations.
- Use the backend response as the only source of plotted values.

Test each sweep, each calibration, empty/error states, mobile rendering and CSV consistency. At completion, explain exactly which source series appears on each chart and why.
```

### Manual steps

1. Compare each chart with the corresponding source figure and existing Streamlit output.
2. Check axis units and labels.
3. Check source markers are not confused with model curves.
4. Download CSV and inspect several rows.
5. Test the chart layout on a phone.

# PHASE 5 — Dataset generator

**Depends on:** Dataset endpoint and shared UI components.

### User journey

A researcher needs a structured dataset across selected time, angle and pressure values. They choose grid sizes and ranges, see the resulting row count, generate the dataset, preview it and download it.

### Build specification

1. Add three step-count inputs.
2. Add three range controls with visible units.
3. Default to the calibrated domain.
4. Show row-count calculation before generation.
5. Enforce the configured maximum in both frontend and backend.
6. Show generation progress or a clear busy state.
7. Display row count, calibration, off-source-path count and model metadata.
8. Preview a limited sample; do not render thousands of rows in the browser.
9. Generate CSV with stable column names and units in documentation or metadata.
10. Include source-path angle and off-path indicator if returned by the engine.
11. Include a methodology note in the export or accompanying metadata.
12. Handle large outputs without freezing the browser.

### Acceptance criteria

- Grid dimensions produce the expected number of rows.
- Backend and frontend row-count calculations agree.
- Maximum row count is enforced server-side.
- CSV headers and values are correct.
- Preview is performant.
- Off-source-path count is correct.
- Export includes enough metadata to identify the calibration and model version.

### Antigravity prompt — Phase 5

```text
MANDATORY FIRST STEP:
Read the existing generate_dataset function and the current /datasets endpoint. Verify the exact row structure, field names, units and off_path calculation. Do not assume.

TASK — PHASE 5: DATASET GENERATOR

Build /dataset.

USER CONTROLS:
- time_steps;
- angle_steps;
- pressure_steps;
- time range in hr;
- deviation-angle range in degrees;
- pressure range in psi;
- calibration.

Default ranges must match the calibrated domain.

BEHAVIOUR:
1. Calculate projected row count before submission.
2. Explain how the grid size is produced.
3. Enforce a maximum row count on frontend and backend.
4. Submit to POST /api/v1/datasets.
5. Show clear loading state.
6. Show generated row count, off-source-path count, calibration and model version.
7. Preview a limited sample with pagination or a compact table.
8. Download the full CSV.
9. Include units and clear column names.
10. Explain the meaning of off_source_path in plain language.

Do not add persistence, database tables, background queues or user accounts. This is a stateless v1 workflow.

Test small and maximum allowed datasets, invalid ranges, reversed ranges, row-count overflow, export consistency and mobile layout. At completion, report actual tested row counts and provide manual verification steps.
```

### Manual steps

1. Generate a small dataset first.
2. Confirm row count equals the product of the three step counts.
3. Compare several rows with direct API predictions.
4. Download and open the CSV.
5. Test a request above the maximum and confirm it is blocked.

# PHASE 6 — Methodology, uncertainty and scientific transparency

**Depends on:** Scientific metadata and all product screens.

### User journey

A user wants to understand where the numbers came from and what they can safely conclude. They open Methodology, explore the equations and fitted constants, inspect validation and uncertainty, and understand limitations before using results in an academic or engineering context.

### Build specification

1. Explain the physical meaning of cake thickness and filtrate volume.
2. Present equations with properly formatted mathematical notation.
3. Define every symbol and unit.
4. Explain how B1–B5 were recovered from digitised figures.
5. Explain the two calibration choices.
6. Explain angle and pressure correction functions.
7. Explain the source drilling path and separability assumption.
8. Explain bootstrap uncertainty and parameter correlation.
9. Present validation statistics with the correct interpretation.
10. Present domain and limitations in a prominent, readable section.
11. Link warnings from Estimate and Charts to relevant methodology explanations.
12. Add a model version and source citation.

### Acceptance criteria

- Every symbol and unit is defined.
- Methodology text matches actual implementation.
- Validation is not described as independent external validation.
- Bootstrap uncertainty is not described as total field uncertainty.
- Limitations are visible without hunting through footnotes.
- Model coefficients and metadata are sourced from the backend where practical.

### Antigravity prompt — Phase 6

```text
MANDATORY FIRST STEP:
Read the entire scientific engine, fit outputs, metadata endpoint, validation endpoint and report-derived limitations supplied in this blueprint. Verify every equation and every displayed scientific statement against the implementation. Do not create new scientific claims.

TASK — PHASE 6: METHODOLOGY AND TRANSPARENCY

Build /methodology as a clear educational explanation, not a dense academic paper pasted into a webpage.

SECTIONS:
1. What the tool estimates.
2. Physical meaning of cake thickness and filtrate volume.
3. Governing equations and symbol definitions.
4. Recovery of B1–B5 from digitised source figures.
5. Experimental and model calibrations.
6. Deviation-angle correction.
7. Mud-pressure correction.
8. Bootstrap uncertainty.
9. Validation approach and metrics.
10. Calibrated domain.
11. Assumptions and limitations.
12. Source reference and model version.

Use proper equation rendering. Use concise explanations before technical detail. Include tables for variables, units and parameter definitions.

CRITICAL:
- Do not claim field validation.
- Do not call reproduction against calibration points independent external validation.
- Do not imply bootstrap intervals cover all experimental, operational or field uncertainty.
- Explain time/angle confounding.
- Explain that Q pressure dependence is inferred by scaling with cake thickness.
- Explain the inability of the time cake equation to reproduce the observed post-peak decline.
- Explain that off-source-path predictions depend on separability.

Cross-link warnings in Estimate and Charts to the relevant section. At completion, produce a claim-by-claim verification list showing where each displayed scientific statement is supported by the actual code/data.
```

### Manual steps

1. Compare every equation and definition against the project report and source paper.
2. Verify the calibration names and coefficient display.
3. Confirm validation wording is academically defensible.
4. Review the limitations page with the project supervisor if required.

# PHASE 7 — Integration, quality assurance and deployment

**Depends on:** Phases 0–6.

### User journey

A first-time user opens the deployed application on a normal internet connection, completes a calculation, explores charts, generates a dataset and reads the methodology. The experience remains reliable when the API is slow or unavailable and on a mobile device.

### Build specification

**Functional testing**
- Landing and navigation.
- Prediction for both calibrations.
- Uncertainty enabled and disabled.
- Domain boundary and out-of-domain warnings.
- Off-source-path warning.
- All chart sweep modes.
- Dataset generation and CSV export.
- Methodology and validation content.
- API-down and timeout states.

**Scientific regression**
- Compare representative points against the legacy Streamlit implementation.
- Compare chart series and dataset rows.
- Record tolerances and any accepted differences.
- Confirm no equation or parameter has changed silently.

**Frontend quality**
- Responsive checks at mobile, tablet and desktop sizes.
- Keyboard navigation.
- Contrast and focus.
- Accessible chart summaries.
- No console errors.
- No horizontal overflow.

**Backend quality**
- API validation.
- CORS.
- Structured errors.
- Dataset maximum.
- Finite outputs.
- Logging.
- Health endpoint.
- Docker build and local container run.

**Deployment**
- Deploy frontend to Vercel.
- Deploy FastAPI to Cloud Run.
- Configure frontend API base URL.
- Configure CORS for the production frontend origin.
- Configure health check and basic logs.
- Verify a real production calculation.
- Document rollback steps.

### Acceptance criteria

- CI passes.
- Production frontend loads.
- Production API health returns 200.
- A production estimate matches local output within the documented tolerance.
- All core workflows complete.
- No secrets are committed.
- Deployment and rollback instructions are documented.
- All unresolved risks are listed.

### Antigravity prompt — Phase 7

```text
MANDATORY FIRST STEP:
Read the entire codebase end to end: frontend routes and components, API routes and services, scientific engine, tests, CI, Dockerfile and deployment configuration. Review all phase summaries. Identify convention drift, duplicate logic, unhandled errors and scientific inconsistencies before editing.

TASK — PHASE 7: INTEGRATION, HARDENING AND DEPLOYMENT

1. Run all frontend and backend tests.
2. Run lint, formatting checks, typecheck and production builds.
3. Run Playwright end-to-end tests for all primary journeys.
4. Run scientific regression tests against the legacy Streamlit implementation.
5. Verify both calibrations and uncertainty outputs.
6. Verify domain and off-source-path warnings.
7. Verify chart data and CSV exports.
8. Verify dataset row limits and export consistency.
9. Verify API error handling and frontend offline states.
10. Verify mobile, tablet and desktop layouts.
11. Build and run the API Docker image locally.
12. Prepare Vercel deployment for the frontend.
13. Prepare Cloud Run deployment for FastAPI.
14. Configure production API URL and CORS allowlist.
15. Deploy and perform a real production smoke test.
16. Document rollback and troubleshooting steps.

SECURITY AND RELIABILITY:
- No secrets in Git.
- No permissive production CORS.
- No raw tracebacks exposed to browser.
- No unbounded dataset requests.
- No fabricated outputs in error or loading states.
- No hidden scientific warnings.
- No claim of independent validation unless independently established.

At completion, produce:
A. Verified checklist.
B. Tests run and actual outcomes.
C. Scientific parity report.
D. Production URLs.
E. Exact manual setup and deployment steps.
F. Rollback procedure.
G. Known limitations and unresolved risks.
H. A short demo script covering Estimate, Charts, Dataset and Methodology.

Never claim a deployment or test succeeded unless it was actually executed and verified.
```

### Manual deployment steps

1. Create a GitHub repository and push the tested main branch.
2. Import the frontend project into Vercel.
3. Create a Google Cloud project and enable Cloud Run and Artifact Registry.
4. Build and deploy the API container to Cloud Run.
5. Set the production frontend API base URL in Vercel.
6. Set the production frontend origin in the API CORS configuration.
7. Redeploy both services.
8. Open the deployed frontend and perform a real estimate.
9. Verify API logs and health.
10. Record deployment URLs and rollback instructions.

# 8. Cross-phase engineering standards

These standards apply to every phase.

## 8.1 Antigravity must understand before editing

At the beginning of every phase:
1. Read the repository.
2. Read the relevant tests.
3. Read the prior phase summary.
4. Explain the existing implementation and dependencies.
5. Identify conflicts with this blueprint.
6. Propose a small implementation plan.
7. Only then edit.

## 8.2 No silent scientific changes

Any change to:
- equations;
- parameter order or values;
- digitised data;
- calibration;
- fitting method;
- bootstrap procedure;
- empirical correction functions;
- domain;
- warning thresholds;
- validation interpretation

must be explicitly reported with a reason, tests and impact. Do not make such changes as incidental refactoring.

## 8.3 No invented completion

The agent must distinguish:
- implemented;
- tested locally;
- tested in CI;
- deployed;
- verified in production;
- requires manual action.

A component that renders is not necessarily integrated. An endpoint that returns 200 is not necessarily scientifically correct.

## 8.4 Code quality

- TypeScript strict mode.
- Python type hints for public functions.
- Pydantic schemas at API boundaries.
- Unit tests for scientific functions and services.
- Integration tests for API endpoints.
- Playwright for critical user journeys.
- Consistent naming.
- Small modules and clear responsibilities.
- No dead code or placeholder TODOs silently left behind.
- Avoid unnecessary abstractions and dependencies.

## 8.5 Performance

- Avoid recalculating bootstrap samples unnecessarily.
- Avoid sending large datasets to the browser unless requested.
- Limit dataset preview rows.
- Keep charts responsive.
- Use loading states for API operations.
- Cache immutable model metadata and static assets where safe.
- Measure rather than assume performance.

# 9. Definition of done

The v1 product is complete when a user can:

1. Open the application and understand its purpose.
2. Enter time, deviation angle and mud pressure.
3. Select experimental or model calibration.
4. Calculate cake thickness and filtrate volume.
5. See uncertainty and scientific warnings with correct interpretation.
6. Explore time, angle and pressure charts.
7. Generate a structured dataset.
8. Download a CSV.
9. Understand the equations, fitted constants, assumptions, validation and limitations.
10. Use the application on desktop and mobile.

The engineering work is complete only when:
- the existing scientific implementation is preserved and regression-tested;
- API contracts are documented and validated;
- CI passes;
- production deployment is verified;
- known scientific limitations remain visible;
- manual setup and rollback steps are documented.

# 10. First execution checklist

Do these in order:

1. Create the GitHub repository.
2. Extract the supplied `formation_damage_tool.zip` into the working directory.
3. Save this blueprint at the repository root as `BLUEPRINT.md`.
4. Open the repository in Antigravity.
5. Paste the Phase 0 prompt only.
6. Review the codebase audit before allowing implementation.
7. Require Antigravity to run the tests and report actual results.
8. Review the Phase 0 diff.
9. Commit and push the foundation.
10. Proceed to Phase 1 only after Phase 0 is stable.

**Final product principle:** this is not merely a prettier interface around equations. It is a transparent computational engineering tool. The quality of the product depends as much on communicating the assumptions and limits of the model as it does on calculating and displaying the outputs.
