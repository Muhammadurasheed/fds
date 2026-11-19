# Formation Damage in a Deviated Well - Computational Model

Core logic: Akinsete & Isehunwa (2013). B1-B5 recovered by curve fitting (see run_fits.py).

## Run
pip install -r requirements.txt
streamlit run app.py

## Files
- app.py                      Streamlit web interface (Estimate, Charts, Dataset generator, Method and validity)
- formation_damage_model.py   the computational model (prediction, uncertainty band, dataset generator, validation)
- data_digitized.py           digitized data from Figures 1-5 of the source paper
- run_fits.py                 five curve-fitting methods, bootstrap, cross-validation, model selection
- fit_results.json, bootstrap_and_best.json   outputs of run_fits.py used by the model
- figs/                       figures used in the report

## Valid range
36-120 hr, 30-90 deg, 650-4650 psi. Time and angle are confounded in the source data; see report section 4.2.
