import { DATASET } from './constants';

// ── Backend API base URL ────────────────────────────────────────────────────
// In dev, Vite proxies /api → http://localhost:8000.
// In prod, set VITE_API_BASE to the deployed backend URL.
const API_BASE = import.meta.env.VITE_API_BASE || '';

// ════════════════════════════════════════════════════════════
//  BACKEND API (FastAPI)
// ════════════════════════════════════════════════════════════

export async function backendHealthCheck() {
  const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`Backend health ${r.status}`);
  return r.json();
}

export async function backendRecommend(formState) {
  const body = {
    cit: formState.cit,
    marital: formState.marital,
    age: formState.age,
    income: formState.inc,
    ftimer: formState.ftimer,
    prox: formState.prox,
    ftype: formState.ftype,
    regions: formState.selRegions,
    must_have: formState.mustAmenities,
    max_mrt_mins: formState.mrtMax,
    min_lease: formState.lease,
    cash: formState.cash,
    cpf: formState.cpf,
    loan: formState.loan,
  };
  const r = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || `Backend error ${r.status}`);
  }
  return r.json();
}

export async function backendPrices(town, ftype) {
  const qs = new URLSearchParams({ town, ftype }).toString();
  const r = await fetch(`${API_BASE}/api/prices?${qs}`);
  if (!r.ok) throw new Error(`Prices error ${r.status}`);
  return r.json();
}

/**
 * Normalise a single backend recommendation into the shape the
 * React components (ResultCard, ResultsPane, MapView) expect.
 */
export function normaliseBackendRec(rec) {
  const pd = rec.price_data;
  const s = rec.score;
  const g = rec.grants;
  const am = rec.amenities || {};
  const mcdm = s.mcdm || {};
  const comp = mcdm.components || {};
  const w = s.weight_per_criterion || 13.33;

  // Build amenity detail from backend amenities
  const amenDetail = {};
  for (const k of ['mrt', 'hawker', 'park', 'school', 'hospital', 'mall']) {
    const a = am[k] || {};
    const mins = a.walk_mins ?? 999;
    let pts;
    if (mins <= 5) pts = 6;
    else if (mins <= 10) pts = 5;
    else if (mins <= 15) pts = 4;
    else if (mins <= 20) pts = 2;
    else if (mins <= 30) pts = 1;
    else pts = 0;
    amenDetail[k] = {
      pts, max: 6, ok: mins <= 30, mins,
      name: a.name || null,
    };
  }

  const budComp = comp.budget || {};
  const mrtComp = comp.mrt || {};
  const regComp = comp.region || {};
  const flatComp = comp.flat || {};
  const amenComp = comp.amenity || {};

  const ratio = pd.median / (rec.effective_budget || 1);

  return {
    town: rec.town,
    ftype: rec.ftype,
    pd: {
      median: pd.median,
      p25: pd.p25,
      p75: pd.p75,
      avgArea: pd.avg_area,
      psm: pd.psm,
      trend12: pd.trend_pct ?? 0,
      mom: 0,
      conf: pd.low_confidence ? 'low' : (pd.n >= 20 ? 'high' : 'medium'),
      n: pd.n,
      latest: null,
      months: [],
      vals: [],
    },
    sc: {
      total: s.total,
      label: s.label,
      active: s.active_criteria || [],
      inactive: s.inactive_criteria || [],
      weight: w,
      mcdm_pts: mcdm.total_pts || 0,
      serendipity: s.serendipity || { pts: 0 },
      components: comp,
      budget: {
        pts: budComp.pts ?? 0, max: w,
        desc: ratio <= 1.0
          ? `Median $${pd.median?.toLocaleString()} within budget ($${rec.effective_budget?.toLocaleString()})`
          : `Median ${((ratio - 1) * 100).toFixed(0)}% above budget`,
      },
      amenity: { pts: amenComp.pts ?? 0, max: w, detail: amenDetail },
      transport: {
        pts: mrtComp.pts ?? 0, max: w,
        desc: `${am.mrt?.name || 'MRT'} — ${am.mrt?.walk_mins ?? '?'} min walk`,
      },
      region: { pts: regComp.pts ?? 0, max: w, desc: '' },
      flat: {
        pts: flatComp.pts ?? 0, max: w,
        desc: `Avg floor area ${pd.avg_area} sqm · ${pd.n} transactions`,
      },
    },
    grants: {
      ehg: g.ehg || 0,
      cpfG: g.cpf_grant || 0,
      phg: g.phg || 0,
      total: g.total || 0,
    },
    effective: rec.effective_budget,
    failed_must: rec.failed_must || [],
  };
}

// ════════════════════════════════════════════════════════════
//  CLIENT-SIDE FALLBACK (data.gov.sg CKAN API)
// ════════════════════════════════════════════════════════════

async function apiCall(town, ftype, limit = 500, offset = 0) {
  const filters = { town };
  if (ftype && ftype !== 'any') filters.flat_type = ftype;

  const qs = new URLSearchParams({
    resource_id: DATASET,
    limit,
    offset,
    filters: JSON.stringify(filters),
    sort: 'month desc',
  }).toString();

  const directUrl = `https://data.gov.sg/api/action/datastore_search?${qs}`;
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;

  const tryFetch = async (url) => {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j && j.success !== undefined) return j;
    if (j && j.result) return j;
    throw new Error('Unexpected response');
  };

  try { return await tryFetch(directUrl); } catch (_) { /* fallback */ }
  try { return await tryFetch(proxyUrl); } catch (_) { /* fallback */ }

  const aoUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(directUrl)}`;
  const ao = await fetch(aoUrl);
  const aoJ = await ao.json();
  return JSON.parse(aoJ.contents);
}

export async function fetchTown(town, ftype, cutoff) {
  const all = [];
  let offset = 0;
  while (true) {
    let data;
    try { data = await apiCall(town, ftype, 500, offset); }
    catch (e) { console.warn('Fetch fail', town, e); break; }

    const recs = data?.result?.records || [];
    if (!recs.length) break;

    const filtered = recs.filter(r => r.month >= cutoff);
    all.push(...filtered);

    const oldest = recs.reduce((mn, r) => r.month < mn ? r.month : mn, recs[0].month);
    if (oldest < cutoff || recs.length < 500) break;
    offset += 500;
  }
  return all;
}
