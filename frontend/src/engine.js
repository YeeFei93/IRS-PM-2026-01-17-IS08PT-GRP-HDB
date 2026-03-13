import { REGIONS, AMENITIES } from './constants';

// ════════════════════════════════════════════════════════════
//  GRANT / ELIGIBILITY ENGINE  (mirrors Python model)
// ════════════════════════════════════════════════════════════

// TABLE A — SC/SC or SC/PR, BOTH first-timers (Families / Couples)
function ehgFamilyBands(income) {
  const bands = [
    [1500, 120000], [2000, 110000], [2500, 105000], [3000, 95000], [3500, 90000],
    [4000, 80000], [4500, 70000], [5000, 65000], [5500, 55000], [6000, 50000],
    [6500, 40000], [7000, 30000], [7500, 25000], [8000, 20000], [8500, 10000], [9000, 5000],
  ];
  for (const [ceil, amt] of bands) if (income <= ceil) return amt;
  return 0;
}

// TABLE B — SC Single (solo or buying with parents), or mixed couple
function ehgSoloBands(income) {
  if (income > 4500) return 0;
  const bands = [
    [750, 60000], [1000, 55000], [1250, 52500], [1500, 47500], [1750, 45000],
    [2000, 40000], [2250, 35000], [2500, 32500], [2750, 27500], [3000, 25000],
    [3250, 20000], [3500, 15000], [3750, 12500], [4000, 10000], [4250, 5000], [4500, 2500],
  ];
  for (const [ceil, amt] of bands) if (income <= ceil) return amt;
  return 0;
}

// TABLE C — SC + Non-Resident Spouse (EHG Singles scheme, ½ household income)
function ehgNonResidentSpouseBands(income) {
  const half = income / 2;
  if (half > 4500) return 0;
  const bands = [
    [750, 60000], [1000, 55000], [1250, 52500], [1500, 47500], [1750, 45000],
    [2000, 40000], [2250, 35000], [2500, 32500], [2750, 27500], [3000, 25000],
    [3250, 20000], [3500, 15000], [3750, 12500], [4000, 10000], [4250, 5000], [4500, 2500],
  ];
  for (const [halfCeil, amt] of bands) if (half <= halfCeil) return amt;
  return 0;
}

// TABLE D — Joint Singles Scheme: Two or more first-timer SC singles
function ehgJointSinglesBands(income) {
  if (income > 9000) return 0;
  const bands = [
    [1500, 120000], [2000, 110000], [2500, 105000], [3000, 95000], [3500, 90000],
    [4000, 80000], [4500, 70000], [5000, 65000], [5500, 55000], [6000, 50000],
    [6500, 40000], [7000, 30000], [7500, 25000], [8000, 20000], [8500, 10000], [9000, 5000],
  ];
  for (const [ceil, amt] of bands) if (income <= ceil) return amt;
  return 0;
}

export function calcGrants(cit, income, ftype, ftimer, prox, marital) {
  const isFirst = ftimer === 'first';
  const isPR = cit === 'PR_PR';

  const isSingleScheme = (cit === 'SC_single' && marital === 'single_scheme');
  const isJointSingle = (cit === 'SC_single' && marital === 'joint');
  const isWithParents = (cit === 'SC_single' && marital === 'with_parents');

  // ── EHG ──
  let ehg = 0;
  if (isFirst && !isPR) {
    if (cit === 'SC_NR') {
      ehg = ehgNonResidentSpouseBands(income);
    } else if (isJointSingle) {
      ehg = ehgJointSinglesBands(income);
    } else if (isSingleScheme || isWithParents) {
      ehg = ehgSoloBands(income);
    } else if (cit !== 'SC_single') {
      if (income <= 9000) ehg = ehgFamilyBands(income);
    }
  }

  // ── CPF Housing Grant (Resale only) ──
  let cpfG = 0;
  if (isFirst && !isPR) {
    const large = ['5 ROOM', 'EXECUTIVE'].includes(ftype);
    if (cit === 'SC_SC') {
      if (income <= 14000) cpfG = large ? 50000 : 80000;
    } else if (cit === 'SC_PR') {
      if (income <= 14000) cpfG = large ? 40000 : 70000;
    } else if (cit === 'SC_NR') {
      if (income <= 7000) cpfG = large ? 25000 : 40000;
    } else if (isJointSingle) {
      if (income <= 14000) cpfG = large ? 50000 : 80000;
    } else if (isSingleScheme || isWithParents) {
      if (income <= 7000) cpfG = large ? 25000 : 40000;
    }
  }

  // ── PHG (Proximity Housing Grant) ──
  let phg = 0;
  if (!isPR && cit !== 'SC_NR') {
    const isSinglesPhg = isSingleScheme || isWithParents;
    if (prox === 'same') phg = isSinglesPhg ? 15000 : 30000;
    else if (prox === 'near') phg = isSinglesPhg ? 10000 : 20000;
  }

  return { ehg, cpfG, phg, total: ehg + cpfG + phg };
}

export function loanCapacity(monthly, rateAnnual = 0.026, years = 25) {
  const r = rateAnnual / 12;
  const n = years * 12;
  const factor = ((1 + r) ** n - 1) / (r * (1 + r) ** n);
  return Math.round(monthly * factor);
}

export function checkEligibility(cit, income, age, marital) {
  let eligible = true, warns = [], notes = [];

  const isJointSingle = (cit === 'SC_single' && marital === 'joint');
  const isWithParents = (cit === 'SC_single' && marital === 'with_parents');
  const isSingleScheme = (cit === 'SC_single' && marital === 'single_scheme');

  if (cit === 'PR_PR') { notes.push('PRs: resale flats only.'); }
  if (cit === 'SC_NR') { notes.push('SC + Non-Resident Spouse: resale flats only.'); }
  if (cit === 'SC_single' && age < 35) {
    eligible = false;
    warns.push('Singles must be ≥35 years old to buy under the Singles / JSS / Single with Parents scheme.');
  }
  if (isSingleScheme) {
    notes.push('Singapore Single Scheme: PHG (Singles) available — $15k same flat, $10k within 4km.');
  }
  if (isWithParents) {
    notes.push('Single with Parents: PHG (Singles) applies — $15k same flat, $10k within 4km.');
  }
  if (isJointSingle) {
    notes.push('Joint Singles Scheme: 2+ SC singles buying together. EHG uses combined household income (≤$9k).');
  }
  if (income > 16000) { eligible = false; warns.push('Income >$16k: HDB ineligible.'); }
  else if (income > 14000) { warns.push('Income $14k–$16k: resale only.'); }
  else if (income > 9000 && !isJointSingle) {
    notes.push('Income >$9k: EHG not applicable. CPF Housing Grant may still apply (≤$14k).');
  } else if (income > 9000 && isJointSingle) {
    notes.push('JSS: Combined income >$9k — EHG not applicable. CPF Grant still applies up to $14k.');
  }

  return { eligible, warns, notes };
}

// ── Price Analysis ──
function pct(sorted, p) {
  const i = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p / 100 * sorted.length) - 1));
  return sorted[i];
}

export function analyseRecords(records, town, ftype) {
  const rel = records.filter(r =>
    r.town === town && (ftype === 'any' || r.flat_type === ftype)
  );
  if (!rel.length) return null;

  const prices = rel.map(r => +r.resale_price).sort((a, b) => a - b);
  const areas = rel.map(r => +r.floor_area_sqm);

  const median = pct(prices, 50);
  const p25 = pct(prices, 25);
  const p75 = pct(prices, 75);
  const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;
  const psm = avgArea > 0 ? median / avgArea : 0;

  const byMonth = {};
  rel.forEach(r => {
    if (!byMonth[r.month]) byMonth[r.month] = [];
    byMonth[r.month].push(+r.resale_price);
  });
  const months = Object.keys(byMonth).sort();
  const vals = months.map(m => pct([...byMonth[m]].sort((a, b) => a - b), 50));

  const trend12 = vals.length >= 2
    ? ((vals[vals.length - 1] - vals[0]) / vals[0] * 100).toFixed(1)
    : 0;
  const mom = vals.length >= 2
    ? ((vals[vals.length - 1] - vals[vals.length - 2]) / vals[vals.length - 2] * 100).toFixed(1)
    : 0;

  const conf = rel.length >= 20 ? 'high' : rel.length >= 5 ? 'medium' : 'low';
  const latest = months[months.length - 1] || null;

  return {
    median, p25, p75, avgArea: +avgArea.toFixed(1), psm: Math.round(psm),
    trend12: +trend12, mom: +mom, conf, n: rel.length, latest, months, vals,
  };
}

// ════════════════════════════════════════════════════════════
//  MCDM + SERENDIPITY SCORING ENGINE
//  Total = 80pts (MCDM, equal-weighted per active criterion)
//        + 20pts (Serendipity, from inactive criteria)
// ════════════════════════════════════════════════════════════
const MCDM_TOTAL = 80;
const SERENDIPITY_TOTAL = 20;
const ALL_CRITERIA = ['budget', 'flat', 'region', 'lease', 'mrt', 'amenity'];

// ── Raw scorers: return 0.0–1.0 ──
function rawBudget(median, budget) {
  if (!budget || !median) return 0;
  const r = median / budget;
  if (r <= 0.70) return 1.00;
  else if (r <= 0.80) return 0.90;
  else if (r <= 0.90) return 0.75;
  else if (r <= 1.00) return 0.55;
  else if (r <= 1.10) return 0.25;
  else return 0.00;
}

function rawMrt(mins) {
  if (mins <= 5) return 1.00;
  else if (mins <= 10) return 0.85;
  else if (mins <= 15) return 0.65;
  else if (mins <= 20) return 0.45;
  else if (mins <= 30) return 0.20;
  else return 0.00;
}

function rawAmenity(town, mustArr) {
  const a = AMENITIES[town] || {};
  const keys = mustArr.length ? mustArr : ['mrt', 'hawker', 'park', 'school'];
  const WALK = { mrt: a.mrtMin || 20, hawker: 5, park: 10, school: 8, hospital: 15 };
  const scores = keys.map(k => {
    const mins = WALK[k] || 15;
    if (mins <= 5) return 1.00;
    else if (mins <= 10) return 0.80;
    else if (mins <= 15) return 0.60;
    else if (mins <= 20) return 0.40;
    else if (mins <= 30) return 0.20;
    else return 0.00;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function rawRegion(town, regions) {
  if (!regions || !regions.length) return 0.5;
  for (const [reg, towns] of Object.entries(REGIONS)) {
    if (towns.includes(town) && regions.includes(reg)) return 1.0;
  }
  return 0.0;
}

function rawFlat(pd) {
  const ranges = { '2 ROOM': [36, 45], '3 ROOM': [60, 75], '4 ROOM': [85, 105],
    '5 ROOM': [110, 135], 'EXECUTIVE': [130, 165] };
  const r = ranges[pd.ftype || '4 ROOM'];
  if (!r || !pd.avgArea) return 0.5;
  if (pd.avgArea >= r[0] && pd.avgArea <= r[1]) return 1.0;
  if (pd.avgArea > r[1]) return 0.90;
  return Math.max(pd.avgArea / r[0], 0);
}

function rawLease(minLease, buyerAge) {
  const est = 75;
  if (est >= minLease) return 1.0;
  const base = Math.max(est / minLease, 0);
  const cpfThreshold = 80 - buyerAge;
  return est < cpfThreshold ? base * 0.75 : base;
}

// ── Detect which criteria the buyer actively configured ──
function detectActive(ftype, budget, mustArr, regions, minLease, maxMrt) {
  const active = [];
  if (budget > 0) active.push('budget');
  if (ftype !== 'any') active.push('flat');
  if (regions && regions.length) active.push('region');
  if (minLease > 60) active.push('lease');
  if (maxMrt < 30) active.push('mrt');
  if (mustArr && mustArr.length) active.push('amenity');
  return active;
}

// ── Per-criterion raw score dispatcher ──
function rawForCriterion(crit, town, pd, budget, mustArr, regions, minLease, buyerAge) {
  const a = AMENITIES[town] || {};
  switch (crit) {
    case 'budget': return rawBudget(pd.median, budget);
    case 'flat': return rawFlat(pd);
    case 'region': return rawRegion(town, regions);
    case 'lease': return rawLease(minLease, buyerAge);
    case 'mrt': return rawMrt(a.mrtMin || 20);
    case 'amenity': return rawAmenity(town, mustArr);
    default: return 0;
  }
}

// ── Serendipity: score inactive criteria ──
function computeSerendipity(inactive, town, pd, budget, mustArr, regions) {
  const criteria = inactive.length ? inactive : ALL_CRITERIA;
  const a = AMENITIES[town] || {};
  const sub = {};
  for (const c of criteria) {
    if (c === 'budget') sub[c] = rawBudget(pd.median, budget);
    else if (c === 'flat') sub[c] = rawFlat(pd);
    else if (c === 'region') sub[c] = regions.length ? rawRegion(town, regions) : 0.5;
    else if (c === 'lease') sub[c] = (() => { const e = 75; return e >= 80 ? 1 : e >= 70 ? 0.85 : e >= 60 ? 0.65 : 0.4; })();
    else if (c === 'mrt') sub[c] = rawMrt(a.mrtMin || 20);
    else if (c === 'amenity') sub[c] = rawAmenity(town, []);
  }
  const avg = Object.values(sub).reduce((a, b) => a + b, 0) / Object.keys(sub).length;
  return { raw: avg, pts: +(avg * SERENDIPITY_TOTAL).toFixed(2), sub };
}

function scoreLabel(total) {
  if (total >= 85) return 'Excellent Match';
  else if (total >= 70) return 'Strong Match';
  else if (total >= 55) return 'Good Match';
  else if (total >= 40) return 'Fair Match';
  else return 'Exploratory';
}

export function computeScore(town, pd, effective, mustArr, maxMrt, selRegions, ftype, minLease, buyerAge) {
  const a = AMENITIES[town] || {};
  const mrt = a.mrtMin || 20;
  const ftypeEff = ftype || '4 ROOM';
  pd.ftype = ftypeEff === 'any' ? '4 ROOM' : ftypeEff;
  const minLeaseEff = minLease || 50;
  const buyerAgeEff = buyerAge || 32;

  // Step 1: detect active criteria
  const active = detectActive(ftypeEff, effective, mustArr, selRegions, minLeaseEff, maxMrt);
  const inactive = ALL_CRITERIA.filter(c => !active.includes(c));
  const criteria = active.length ? active : ALL_CRITERIA;
  const weight = +(MCDM_TOTAL / criteria.length).toFixed(4);

  // Step 2: MCDM components
  const components = {};
  let mcdmPts = 0;
  for (const crit of criteria) {
    const r = rawForCriterion(crit, town, pd, effective, mustArr, selRegions, minLeaseEff, buyerAgeEff);
    const pts = +(r * weight).toFixed(2);
    mcdmPts += pts;
    components[crit] = { raw: +r.toFixed(3), pts, weight: +weight.toFixed(2) };
  }

  // Step 3: Serendipity
  const seren = computeSerendipity(inactive, town, pd, effective, mustArr, selRegions);

  // Step 4: Total
  const total = +Math.min(100, mcdmPts + seren.pts).toFixed(1);

  // ── Build detail objects for display ──
  const ratio = pd.median / effective;
  let townRegionName = '—';
  for (const [reg, towns] of Object.entries(REGIONS)) {
    if (towns.includes(town)) {
      townRegionName = reg === 'northeast' ? 'North-East' : reg.charAt(0).toUpperCase() + reg.slice(1);
      break;
    }
  }

  // Amenity detail for card sub-rows
  const amenDetail = {};
  const amenKeys = ['mrt', 'hawker', 'park', 'school', 'hospital'];
  const WALK_EST = { mrt: a.mrtMin || 20, hawker: 5, park: 10, school: 8, hospital: 18 };
  for (const k of amenKeys) {
    const mins = WALK_EST[k] || 15;
    const isMust = mustArr.includes(k);
    let pts;
    if (mins <= 5) pts = 6;
    else if (mins <= 10) pts = 5;
    else if (mins <= 15) pts = 4;
    else if (mins <= 20) pts = 2;
    else if (mins <= 30) pts = 1;
    else pts = isMust ? -3 : 0;
    amenDetail[k] = {
      pts, max: 6, ok: mins <= 30, mins,
      name: k === 'mrt' ? (a.mrt || null) : k === 'hawker' ? (a.hawker || null) : k === 'park' ? (a.park || null) : null,
    };
  }

  const budComp = components['budget'] || { pts: +(rawBudget(pd.median, effective) * weight).toFixed(1) };
  const amenComp = components['amenity'] || { pts: +(rawAmenity(town, mustArr) * weight).toFixed(1) };
  const mrtComp = components['mrt'] || { pts: +(rawMrt(mrt) * weight).toFixed(1) };
  const regComp = components['region'] || { pts: +(rawRegion(town, selRegions) * weight).toFixed(1) };
  const flatComp = components['flat'] || { pts: +(rawFlat(pd) * weight).toFixed(1) };

  return {
    total,
    label: scoreLabel(total),
    active, inactive, weight: +weight.toFixed(2),
    mcdm_pts: +mcdmPts.toFixed(2),
    serendipity: seren,
    components,
    budget: {
      pts: +budComp.pts, max: weight,
      desc: ratio <= 1.0
        ? `Median $${pd.median.toLocaleString()} is within your budget of $${effective.toLocaleString()} (${(ratio * 100).toFixed(0)}% used)`
        : `Median is ${((ratio - 1) * 100).toFixed(0)}% above budget — grants may bridge the gap`,
    },
    amenity: { pts: +amenComp.pts, max: weight, detail: amenDetail },
    transport: {
      pts: +mrtComp.pts, max: weight,
      desc: mrt <= 5 ? `${a.mrt || 'MRT'} — ${mrt} min walk (excellent)`
        : mrt <= 10 ? `${a.mrt || 'MRT'} — ${mrt} min walk (good)`
        : mrt <= 15 ? `${a.mrt || 'MRT'} — ${mrt} min walk (moderate)`
        : `${a.mrt || 'MRT'} — ${mrt} min walk`,
    },
    region: {
      pts: +regComp.pts, max: weight,
      desc: selRegions.length === 0
        ? 'No region preference — neutral score applied'
        : regComp.pts >= weight * 0.9
          ? `${town} (${townRegionName}) matches your preferred region`
          : `${town} (${townRegionName}) is outside your preferred regions`,
    },
    flat: {
      pts: +flatComp.pts, max: weight,
      desc: `Avg floor area ${pd.avgArea} sqm · ${pd.n} transactions (${pd.conf} confidence)`,
    },
  };
}

export function whyText(town, ftype, score, pd, budget) {
  const savings = budget - pd.median;
  const under = savings > 0;
  const tr = pd.trend12;
  return `${town} offers ${ftype} flats ${under
    ? `within budget with ~$${Math.abs(savings).toLocaleString()} headroom`
    : 'slightly above base budget — grants and negotiation may close the gap'
    }. ${tr < 0
      ? 'Prices have softened over 12 months, presenting a potential buying window.'
      : tr > 3
        ? 'Prices are rising; acting sooner may be advantageous.'
        : 'Prices are stable, giving you time to compare options carefully.'
    }`;
}

export function scoreToColor(score) {
  const r = score / 100;
  if (r <= 0.5) {
    const t = r * 2;
    const green = Math.round(57 + t * (174 - 57));
    return `rgb(192,${green},43)`;
  } else {
    const t = (r - 0.5) * 2;
    const red = Math.round(192 - t * (192 - 39));
    return `rgb(${red},174,67)`;
  }
}
