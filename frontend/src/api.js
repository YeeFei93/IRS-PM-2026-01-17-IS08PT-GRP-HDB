import { DATASET, API_BASE, AMENITY_THRESHOLDS } from './constants';
import { AMENITIES } from './constants';

// ── Backend API support ──

export async function checkBackendHealth() {
  if (!API_BASE) return false;
  try {
    const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch { return false; }
}

export async function runSearchBackend(payload) {
  const r = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Backend ${r.status}`);
  return r.json();
}

export function normaliseBackendRec(r) {
  const amenDetail = {};
  for (const k of ['mrt', 'hawker', 'park', 'school', 'hospital']) {
    const raw = r.amenity_detail?.[k];
    if (raw) {
      const thresh = AMENITY_THRESHOLDS[k];
      amenDetail[k] = {
        pts: raw.pts ?? 0, max: raw.max ?? 6,
        ok: thresh ? (raw.mins ?? 99) <= thresh.maxMins : raw.ok ?? false,
        mins: raw.mins, name: raw.name || null,
      };
    } else {
      amenDetail[k] = { pts: 0, max: 6, ok: false, mins: null, name: null };
    }
  }

  return {
    town: r.town,
    ftype: r.flat_type || r.ftype || '4 ROOM',
    pd: r.pd || { median: 0, p25: 0, p75: 0, avgArea: 0, psm: 0, trend12: 0, mom: 0, conf: 'low', n: 0 },
    sc: {
      total: r.score ?? r.total ?? 0,
      label: r.label || 'Exploratory',
      active: r.active || [],
      inactive: r.inactive || [],
      weight: r.weight || 0,
      mcdm_pts: r.mcdm_pts || 0,
      serendipity: r.serendipity || { raw: 0, pts: 0, sub: {} },
      components: r.components || {},
      budget: r.budget || { pts: 0, max: 0, desc: '' },
      amenity: { pts: r.amenity?.pts || 0, max: r.amenity?.max || 0, detail: amenDetail },
      transport: r.transport || { pts: 0, max: 0, desc: '' },
      region: r.region || { pts: 0, max: 0, desc: '' },
      flat: r.flat || { pts: 0, max: 0, desc: '' },
      lease: r.lease || { pts: 0, max: 0, desc: '' },
    },
    grants: r.grants || { ehg: 0, cpfG: 0, phg: 0, total: 0, notes: [] },
    effective: r.effective || 0,
  };
}

// ── data.gov.sg fallback API ──

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
