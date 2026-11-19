"""Streamlit web interface -- Formation Damage in a Deviated Well: Computational Model
Run:  streamlit run app.py
Core logic: Akinsete & Isehunwa (2013) Eq. 22 & 26 with B1-B5 recovered by curve fitting."""
import numpy as np, pandas as pd, streamlit as st
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import formation_damage_model as fm
from data_digitized import *

st.set_page_config(page_title='Formation Damage - Deviated Well', page_icon=None, layout='wide')
st.title('Formation Damage in a Deviated Well - Computational Model')
st.caption('Core logic: Akinsete & Isehunwa (2013), Petroleum Science and Technology 31(21): 2202-2210. '
           'Department of Petroleum Engineering, University of Ibadan.')
st.info('Think of this as a digital chart (like the Standing-Katz chart for z-factor): enter the drilling condition, read cake thickness h and filtrate volume Q. '
        'Values are anchored to the published experimental curves and are valid only inside the calibrated range.', icon=None)

with st.sidebar:
    st.header('Settings')
    cal_label = st.radio('Calibration of B1-B5', ['Experimental data (default)', "Akinsete's model curve"])
    calib = 'experimental' if cal_label.startswith('Exp') else 'model'
    band = st.checkbox('Show 95 % uncertainty band (bootstrap)', value=True)
    c = fm.calibration(calib)
    st.markdown('**B1-B5 in use**')
    st.code('\n'.join(f'B{i+1} = {v:+.6g}' for i, v in enumerate(c.B)))
    st.markdown(f'Implied reference pressure: **{c.P_ref:,.0f} psi**')

tab1, tab2, tab3, tab4 = st.tabs(['Estimate', 'Charts', 'Dataset generator', 'Method and validity'])

# ---------------------------------------------------------------- 1. Estimate
with tab1:
    a, b = st.columns([1, 2])
    with a:
        st.subheader('Drilling condition')
        t = st.slider('Exposure time t (hr)', 24.0, 144.0, 96.0, 1.0)
        theta = st.slider('Deviation angle (deg)', 30.0, 90.0, float(round(float(fm.theta_path(96.0)))), 1.0)
        Pm = st.slider('Mud pressure (psi)', 650.0, 4650.0, float(round(c.P_ref, -1)), 10.0)
        r = fm.predict(t, theta, Pm, calib)
        st.metric('Cake thickness h', f'{float(r["h"]):.3f} cm')
        st.metric('Filtrate volume Q', f'{float(r["Q"]):.1f} cc')
        for m in fm.check_domain(t, theta, Pm): st.warning(m)
        if float(r['h']) == 0.0: st.caption('h = 0: before the cake-onset time implied by Eq. 22 (about 35 hr).')
    with b:
        tt = np.linspace(24, 144, 200); rr = fm.predict(tt, theta, Pm, calib)
        fig, axs = plt.subplots(1, 2, figsize=(9, 3.4))
        for ax, key, yl in ((axs[0], 'h', 'cake thickness h (cm)'), (axs[1], 'Q', 'filtrate volume Q (cc)')):
            ax.plot(tt, rr[key], color='#0B3954', lw=2)
            if band:
                bd = fm.prediction_band(tt, theta, Pm, calib); ax.fill_between(tt, bd[key][0], bd[key][2], color='#1F77B4', alpha=0.15)
            ax.scatter([t], [float(r[key])], color='#E8871E', zorder=5, s=55); ax.axvspan(120, 144, color='#EEEEEE', zorder=0)
            ax.set_xlabel('time t (hr)'); ax.set_ylabel(yl); ax.grid(alpha=0.25)
        fig.tight_layout(); st.pyplot(fig); plt.close(fig)
        st.caption('Grey zone: beyond the last published data point (120 hr).')

# ---------------------------------------------------------------- 2. Charts
with tab2:
    st.subheader('Chart mode: one variable sweeps, the others are held')
    var = st.selectbox('Sweep variable', ['Time', 'Deviation angle', 'Mud pressure'])
    fig, axs = plt.subplots(1, 2, figsize=(10, 3.8))
    if var == 'Time':
        tt = np.linspace(36, 120, 100)
        for th in (30, 45, 60, 75, 90):
            r = fm.predict(tt, th, c.P_ref, calib); axs[0].plot(tt, r['h'], label=f'{th} deg'); axs[1].plot(tt, r['Q'], label=f'{th} deg')
        axs[0].scatter(T, H_EXP, marker='s', color='k', s=25, zorder=5); axs[1].scatter(T, Q_EXP, marker='s', color='k', s=25, zorder=5); xl = 'time t (hr)'
    elif var == 'Deviation angle':
        th = np.linspace(30, 90, 100)
        for tv in (48, 72, 96, 120):
            r = fm.predict(tv, th, c.P_ref, calib); axs[0].plot(th, r['h'], label=f'{tv} hr'); axs[1].plot(th, r['Q'], label=f'{tv} hr')
        axs[0].scatter(THETA, HA_EXP, marker='s', color='k', s=25, zorder=5); axs[1].scatter(THETA, QA_EXP, marker='s', color='k', s=25, zorder=5); xl = 'deviation angle (deg)'
    else:
        pp = np.linspace(650, 4650, 100)
        for tv in (48, 72, 96, 120):
            r = fm.predict(tv, fm.theta_path(tv), pp, calib); axs[0].plot(pp, r['h'], label=f'{tv} hr'); axs[1].plot(pp, r['Q'], label=f'{tv} hr')
        axs[0].scatter(P, HP_EXP, marker='s', color='k', s=25, zorder=5); xl = 'mud pressure (psi)'
    for ax, yl in zip(axs, ('cake thickness h (cm)', 'filtrate volume Q (cc)')):
        ax.set_xlabel(xl); ax.set_ylabel(yl); ax.grid(alpha=0.25); ax.legend(fontsize=8)
    fig.tight_layout(); st.pyplot(fig); plt.close(fig)
    st.caption('Black squares: digitized experimental points of the source paper (shown where a matching published figure exists).')

# ---------------------------------------------------------------- 3. Dataset generator
with tab3:
    st.subheader('Generate a labelled dataset')
    c1, c2, c3 = st.columns(3)
    nt = c1.number_input('time steps', 5, 100, 25); nth = c2.number_input('angle steps', 3, 100, 13); npr = c3.number_input('pressure steps', 3, 100, 15)
    d1, d2, d3 = st.columns(3)
    tr = d1.slider('time range (hr)', 36.0, 120.0, (36.0, 120.0)); thr = d2.slider('angle range (deg)', 30.0, 90.0, (30.0, 90.0)); pr = d3.slider('pressure range (psi)', 650.0, 4650.0, (650.0, 4650.0))
    st.write(f'Rows to be generated: **{int(nt)*int(nth)*int(npr):,}**')
    if st.button('Generate', type='primary'):
        df = fm.generate_dataset(int(nt), int(nth), int(npr), calib, tr, thr, pr)
        st.success(f'{len(df):,} rows generated ({int(df.off_path.sum()):,} rows lie off the source drilling path and rest on the separability assumption).')
        st.dataframe(df.sample(min(15, len(df)), random_state=1), width='stretch')
        st.download_button('Download CSV', df.to_csv(index=False).encode(), 'formation_damage_dataset.csv', 'text/csv')

# ---------------------------------------------------------------- 4. Method and validity
with tab4:
    st.subheader('How the numbers are produced')
    st.markdown('''
1. **Equations** (Akinsete & Isehunwa, 2013): `h = sqrt(B1 t - B2 exp(-B3 t))`, `Q = B4 exp(-B3 t) - B5 t`.
2. **B1-B5** were not published; they were recovered by fitting the equations to the digitized Figs. 1 and 3 with five methods
   (variable projection, Levenberg-Marquardt, trust-region reflective, Nelder-Mead, differential evolution).
3. **Angle and pressure** enter as relative correction curves fitted to Figs. 4, 5 and 2 (model selection by AICc and leave-one-out error).
4. On the source drilling path the tool returns the fitted Eq. 22 and 26 exactly; elsewhere it is a separable estimate.
''')
    rows = []
    for cal in ('experimental', 'model'):
        v = fm.validate(cal)['exp' if cal == 'experimental' else 'model']
        for k, m in v.items(): rows.append({'calibration': cal, 'figure': k, 'RMSE': round(m['RMSE'], 4), 'R2': round(m['R2'], 4), 'MAPE %': round(m['MAPE'], 1)})
    st.markdown('**Validation against the digitized published points** (each calibration vs. the series it was fitted to)')
    st.dataframe(pd.DataFrame(rows), width='stretch', hide_index=True)
    ci = c.B_ci
    st.markdown('**95 % bootstrap intervals of the constants (selected calibration)**')
    st.dataframe(pd.DataFrame({'constant': [f'B{i+1}' for i in range(5)], 'best fit': c.B, 'lower': ci[0], 'median': ci[1], 'upper': ci[2]}), width='stretch', hide_index=True)
    st.markdown('''**Limitations.** (i) Digitized from a printed figure: about +/-1.5 px. (ii) Only five time points constrain five constants, so B1-B5 are correlated and not unique.
(iii) Eq. 22 cannot reproduce the decline of h after about 100 hr seen in the source figure. (iv) Time and angle are confounded in the source data.
(v) Q versus pressure was not published; Q is scaled like h (Eq. 10). Valid range: 36-120 hr, 30-90 deg, 650-4650 psi.''')
