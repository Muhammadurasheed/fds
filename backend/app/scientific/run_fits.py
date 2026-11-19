"""
run_fits.py -- determine B1..B5 of Akinsete & Isehunwa (2013) Eqs. 22 & 26 by several curve-fitting methods,
quantify their uncertainty, and select empirical functions for the deviation-angle and mud-pressure sweeps.

    h(t) = sqrt( B1*t - B2*exp(-B3*t) )     (Eq. 22/23)       [cm]
    Q(t) = B4*exp(-B3*t) - B5*t             (Eq. 26)          [cc]       (B3 is SHARED by both equations)

Objective (weighted least squares, in the units that are reported):
    chi2 = sum_i ((h_i - h(t_i))/sig_h)^2 + sum_i ((Q_i - Q(t_i))/sig_Q)^2 ,   sig_h = 0.01 cm, sig_Q = 0.5 cc
(sig ~ digitizing uncertainty of +/-1.5 px of the published figures)
"""
import json, time, itertools
import numpy as np
from scipy.optimize import least_squares, minimize, differential_evolution, minimize_scalar
from data_digitized import *

SIG_H, SIG_Q = 0.01, 0.5
SC = np.array([1e-3, 1e-2, 1e-2, 1.0, 1e-1])         # parameter scales (so every optimiser sees O(1) variables)
NAMES = ['B1','B2','B3','B4','B5']

def h_of_t(p, t):
    B1,B2,B3,_,_ = p
    return np.sqrt(np.clip(B1*t - B2*np.exp(-B3*t), 0.0, None))
def Q_of_t(p, t):
    _,_,B3,B4,B5 = p
    return B4*np.exp(-B3*t) - B5*t
def resid(p, t, h, Q):
    return np.concatenate([(h_of_t(p,t)-h)/SIG_H, (Q_of_t(p,t)-Q)/SIG_Q])
def chi2(p, t, h, Q): return float(np.sum(resid(p,t,h,Q)**2))

def stats(p, t, h, Q):
    hh, qq = h_of_t(p,t), Q_of_t(p,t)
    def one(y, yh):
        res=y-yh; sse=np.sum(res**2); sst=np.sum((y-y.mean())**2)
        return dict(RMSE=float(np.sqrt(np.mean(res**2))), R2=float(1-sse/sst), MAE=float(np.mean(np.abs(res))),
                    MaxErr=float(np.max(np.abs(res))))
    c2=chi2(p,t,h,Q); n=len(t)*2; k=5
    aicc = n*np.log(c2/n)+2*k+2*k*(k+1)/(n-k-1)    # (weighted SSE) AICc
    return dict(h=one(h,hh), Q=one(Q,qq), chi2=c2, chi2_red=c2/(n-k), AICc=float(aicc))

# ---------------- the five methods -----------------------------------------------------------------
rng = np.random.default_rng(2026)
def random_starts(n):
    S=[]
    for _ in range(n):
        S.append(np.array([10**rng.uniform(-3.7,-2.2), rng.uniform(-0.15,0.15), rng.uniform(-0.03,0.03),
                           rng.uniform(0,14), rng.uniform(-0.6,0.1)]))
    return S

def method_varpro(t,h,Q):
    """M1  Separable / variable-projection least squares in h^2-space.
       For fixed B3 the model is LINEAR in (B1,B2) and (B4,B5): solve by ordinary linear regression,
       then scan the single non-linear parameter B3 and refine with Brent's method."""
    h2=h**2; sh2=2*0.37*SIG_H           # constant sigma of h^2 (h ~ 0.37 cm at the peak)
    def lin(B3):
        Ah=np.column_stack([t,-np.exp(-B3*t)]); c1,*_=np.linalg.lstsq(Ah/sh2,h2/sh2,rcond=None)
        Aq=np.column_stack([np.exp(-B3*t),-t]);  c2,*_=np.linalg.lstsq(Aq/SIG_Q,Q/SIG_Q,rcond=None)
        r=np.sum(((Ah@c1-h2)/sh2)**2)+np.sum(((Aq@c2-Q)/SIG_Q)**2)
        return r,np.array([c1[0],c1[1],B3,c2[0],c2[1]])
    grid=np.linspace(-0.05,0.05,2001); prof=np.array([lin(b)[0] for b in grid])
    i=int(np.argmin(prof)); r=minimize_scalar(lambda b:lin(b)[0],bracket=(grid[max(i-2,0)],grid[i],grid[min(i+2,len(grid)-1)]))
    return lin(r.x)[1], dict(nfev=len(grid)+int(r.nfev)), (grid,prof)

def method_multistart(kind,t,h,Q,nstart=60):
    """M2 LM, M3 TRF(bounded), M4 Nelder-Mead : each run from `nstart` random starts, best kept"""
    best=None; costs=[]; nfev=[]
    lb=np.array([0,-5,-0.2,-100,-5]); ub=np.array([1,5,0.2,100,5])
    for p0 in random_starts(nstart):
        try:
            if kind=='LM':
                r=least_squares(resid,p0,args=(t,h,Q),method='lm',x_scale=SC,max_nfev=4000); p=r.x; c=2*r.cost; nf=r.nfev
            elif kind=='TRF':
                p0c=np.clip(p0,lb+1e-9,ub-1e-9)
                r=least_squares(resid,p0c,args=(t,h,Q),bounds=(lb,ub),method='trf',x_scale=SC,max_nfev=4000); p=r.x; c=2*r.cost; nf=r.nfev
            else:
                f=lambda z: chi2(z*SC,t,h,Q)
                r=minimize(f,p0/SC,method='Nelder-Mead',options=dict(maxiter=40000,maxfev=40000,xatol=1e-9,fatol=1e-10,adaptive=True))
                p=r.x*SC; c=r.fun; nf=r.nfev
        except Exception:
            continue
        costs.append(c); nfev.append(nf)
        if best is None or c<best[0]: best=(c,p)
    costs=np.array(costs); frac=float(np.mean(costs<best[0]+0.05))
    return best[1], dict(nfev=int(np.median(nfev)), success_rate=frac, nstart=len(costs)), None

def method_de(t,h,Q,seeds=(0,1,2,3,4)):
    """M5 Differential evolution (global, population based). Run from 5 random seeds; the best run is kept
       and the fraction of seeds that reach it is reported."""
    f=lambda z: chi2(z*SC,t,h,Q); runs=[]; nf=0
    for sd in seeds:
        r=differential_evolution(f,[(0,10),(-30,30),(-10,10),(-30,30),(-30,30)],seed=sd,tol=1e-13,maxiter=5000,popsize=60,
                                 init='sobol',strategy='best1bin',mutation=(0.4,1.0),recombination=0.8,polish=False)
        runs.append((r.fun,r.x*SC)); nf+=r.nfev
    best=min(runs,key=lambda a:a[0]); frac=float(np.mean([abs(a[0]-best[0])<0.05 for a in runs]))
    return best[1], dict(nfev=int(nf/len(seeds)), success_rate=frac, nstart=len(seeds)), None

def all_methods(t,h,Q):
    out={}
    t0=time.time(); p,info,extra=method_varpro(t,h,Q);  out['M1 Variable projection (linear LS + 1-D scan)']=(p,info,extra,time.time()-t0)
    for key,lab in (('LM','M2 Levenberg-Marquardt'),('TRF','M3 Trust-region reflective (bounded)'),('NM','M4 Nelder-Mead simplex')):
        t0=time.time(); p,info,extra=method_multistart(key,t,h,Q); out[lab+' (60 starts)']=(p,info,extra,time.time()-t0)
    t0=time.time(); p,info,extra=method_de(t,h,Q); out['M5 Differential evolution (global)']=(p,info,extra,time.time()-t0)
    return out

# ---------------- uncertainty ----------------------------------------------------------------------
def jacobian_cov(p,t,h,Q):
    r=least_squares(resid,p,args=(t,h,Q),method='lm',x_scale=SC,max_nfev=2000)
    J=r.jac; s2=2*r.cost/(len(t)*2-5)
    try:
        cov=np.linalg.inv(J.T@J)*s2
    except np.linalg.LinAlgError:
        cov=np.full((5,5),np.nan)
    return cov

def bootstrap(p,t,h,Q,nb=400,seed=1):
    """parametric bootstrap: synthetic data = fitted curve + noise (sd = observed RMSE inflated by sqrt(n/(n-p)))"""
    rg=np.random.default_rng(seed)
    hh,qq=h_of_t(p,t),Q_of_t(p,t)
    sdh=np.sqrt(np.mean((h-hh)**2))*np.sqrt(10/5); sdq=np.sqrt(np.mean((Q-qq)**2))*np.sqrt(10/5)
    lb=np.array([0,-5,-0.2,-100,-5]); ub=np.array([1,5,0.2,100,5]); P=[]
    for _ in range(nb):
        hb=np.clip(hh+rg.normal(0,sdh,len(t)),0,None); qb=qq+rg.normal(0,sdq,len(t))
        best=None
        for jit in range(4):
            p0=p*(1+0.15*rg.normal(size=5)*(jit>0)); p0=np.clip(p0,lb+1e-9,ub-1e-9)
            r=least_squares(resid,p0,args=(t,hb,qb),bounds=(lb,ub),method='trf',x_scale=SC,max_nfev=500)
            if best is None or r.cost<best.cost: best=r
        P.append(best.x)
    return np.array(P), dict(sd_h=float(sdh), sd_Q=float(sdq))

def loocv(p,t,h,Q):
    """leave-one-time-point-out cross-validation (both h and Q at that time are removed)"""
    lb=np.array([0,-5,-0.2,-100,-5]); ub=np.array([1,5,0.2,100,5]); eh=[];eq=[]
    for i in range(len(t)):
        m=np.arange(len(t))!=i; best=None
        for jit in range(8):
            p0=np.clip(p*(1+0.2*rng.normal(size=5)*(jit>0)),lb+1e-9,ub-1e-9)
            r=least_squares(resid,p0,args=(t[m],h[m],Q[m]),bounds=(lb,ub),method='trf',x_scale=SC,max_nfev=1000)
            if best is None or r.cost<best.cost: best=r
        eh.append(float(h_of_t(best.x,t[i:i+1])[0]-h[i])); eq.append(float(Q_of_t(best.x,t[i:i+1])[0]-Q[i]))
    return np.array(eh),np.array(eq)

# ---------------- empirical curves for the angle and pressure sweeps -------------------------------
def fit_curve(x,y,kind):
    x=np.asarray(x,float); y=np.asarray(y,float); xm=x.mean(); xs=x.std()
    z=(x-xm)/xs
    if kind=='linear': c=np.polyfit(z,y,1); f=lambda xx: np.polyval(c,(xx-xm)/xs); k=2
    elif kind=='quadratic': c=np.polyfit(z,y,2); f=lambda xx: np.polyval(c,(xx-xm)/xs); k=3
    elif kind=='cubic': c=np.polyfit(z,y,3); f=lambda xx: np.polyval(c,(xx-xm)/xs); k=4
    elif kind=='power':
        r=least_squares(lambda q:q[0]*(x/x.mean())**q[1]-y,[y.mean(),1.0]); c=r.x; f=lambda xx: c[0]*(np.asarray(xx)/x.mean())**c[1]; k=2
    elif kind=='gaussian':
        best=None
        for mu0 in np.linspace(x.min(),x.max(),9):
            for s0 in (np.ptp(x)/6,np.ptp(x)/4,np.ptp(x)/2):
                try:
                    r=least_squares(lambda q:q[0]*np.exp(-(x-q[1])**2/(2*q[2]**2))-y,[y.max(),mu0,s0],bounds=([0,x.min()-np.ptp(x),np.ptp(x)/20],[10*y.max(),x.max()+np.ptp(x),5*np.ptp(x)]))
                except Exception: continue
                if best is None or r.cost<best.cost: best=r
        c=best.x; f=lambda xx: c[0]*np.exp(-(np.asarray(xx)-c[1])**2/(2*c[2]**2)); k=3
    return f,c,k

def select_curve(x,y,kinds):
    rows=[]
    n=len(x)
    for kind in kinds:
        f,c,k=fit_curve(x,y,kind); res=y-f(x); sse=float(np.sum(res**2)); rmse=float(np.sqrt(sse/n))
        r2=1-sse/np.sum((y-y.mean())**2)
        aicc=(n*np.log(max(sse,1e-12)/n)+2*k+2*k*(k+1)/(n-k-1)) if n-k-1>0 else float('nan')
        # LOOCV
        e=[]
        for i in range(n):
            m=np.arange(n)!=i
            try:
                fi,_,_=fit_curve(x[m],y[m],kind); e.append(float(fi(x[i])-y[i]))
            except Exception: e.append(np.nan)
        loo=float(np.sqrt(np.nanmean(np.array(e)**2)))
        rows.append(dict(kind=kind,k=k,RMSE=rmse,R2=float(r2),AICc=float(aicc),LOOCV_RMSE=loo,coef=[float(v) for v in np.atleast_1d(c)]))
    return rows

if __name__=='__main__':
    np.set_printoptions(precision=6,linewidth=170)
    RES={}
    for tag,h,Q in (('model',H_MODEL,Q_MODEL),('exp',H_EXP,Q_EXP)):
        print('\n########',tag)
        M=all_methods(T,h,Q); tab=[]
        for name,(p,info,extra,sec) in M.items():
            st=stats(p,T,h,Q)
            print(name,'\n    p=',p,'chi2=%.3f  RMSE_h=%.4f R2_h=%.4f  RMSE_Q=%.3f R2_Q=%.4f  %s  t=%.1fs'%(st['chi2'],st['h']['RMSE'],st['h']['R2'],st['Q']['RMSE'],st['Q']['R2'],info,sec))
            tab.append(dict(method=name,params=[float(v) for v in p],info=info,seconds=sec,**st))
        # best = lowest chi2 across methods
        i=int(np.argmin([r['chi2'] for r in tab])); pbest=np.array(tab[i]['params'])
        print('BEST:',tab[i]['method'],pbest)
        cov=jacobian_cov(pbest,T,h,Q); sd_jac=np.sqrt(np.clip(np.diag(cov),0,None))
        PB,binfo=bootstrap(pbest,T,h,Q); ci=np.percentile(PB,[2.5,50,97.5],axis=0)
        eh,eq=loocv(pbest,T,h,Q)
        print('Jacobian sd =',sd_jac); print('Bootstrap 2.5/50/97.5 pct:\n',ci); print('LOOCV RMSE_h=%.4f RMSE_Q=%.3f'%(np.sqrt(np.mean(eh**2)),np.sqrt(np.mean(eq**2))))
        corr=np.corrcoef(PB.T)
        RES[tag]=dict(methods=tab,best_index=i,best=[float(v) for v in pbest],jac_sd=[float(v) for v in sd_jac],
                      boot_ci=ci.tolist(),boot_info=binfo,boot_corr=corr.tolist(),loocv_h=eh.tolist(),loocv_Q=eq.tolist(),
                      boot_samples=PB[:300].tolist())
        # profile (M1) for plots
        RES[tag]['profile']=[M['M1 Variable projection (linear LS + 1-D scan)'][2][0].tolist(),M['M1 Variable projection (linear LS + 1-D scan)'][2][1].tolist()]
    # --- model selection for sweeps
    SEL={}
    for tag,hA,qA,hP in (('model',HA_MODEL,QA_MODEL,HP_MODEL),('exp',HA_EXP,QA_EXP,HP_EXP)):
        SEL[tag]=dict(h_theta=select_curve(THETA,hA,['linear','quadratic','cubic','gaussian']),
                      Q_theta=select_curve(THETA,qA,['linear','quadratic','power']),
                      h_P=select_curve(P,hP,['linear','quadratic','gaussian']))
        for k,v in SEL[tag].items():
            print('\n',tag,k)
            for r in v: print('   %-10s k=%d RMSE=%.4f R2=%.4f AICc=%8.2f LOOCV=%.4f'%(r['kind'],r['k'],r['RMSE'],r['R2'],r['AICc'],r['LOOCV_RMSE']))
    json.dump(dict(fits=RES,selection=SEL),open('fit_results.json','w'),indent=1)
    print('\nsaved fit_results.json')
