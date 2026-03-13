import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Welcome from './components/Welcome';
import Loading from './components/Loading';
import Empty from './components/Empty';
import ResultsPane from './components/ResultsPane';
import MapView from './pages//MapView';
import TrendsView from './pages/TrendsView';
import { REGIONS, ALL_TOWNS, API_BASE } from './constants';
import { calcGrants, loanCapacity, checkEligibility, analyseRecords, computeScore } from './engine';
import { fetchTown, checkBackendHealth, runSearchBackend, normaliseBackendRec } from './api';
import MainView from './pages/MainView';

const INITIAL_FORM = {
  cit: 'SC_SC',
  age: 32,
  marital: 'married',
  inc: 6500,
  ftimer: 'first',
  prox: 'none',
  ftype: '4 ROOM',
  selRegions: [],
  floor: 'any',
  lease: 50,
  cash: 30000,
  cpf: 80000,
  loan: 1800,
  mustAmenities: [],
  mrtMax: 10,
};

export default function App() {
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('results');
  const [phase, setPhase] = useState('welcome'); // welcome | loading | results | empty
  const [recs, setRecs] = useState([]);
  const [rawCount, setRawCount] = useState(0);
  const [latestMonth, setLatestMonth] = useState(null);
  const [highlightedTown, setHighlightedTown] = useState(null);
  const [loadMainText, setLoadMainText] = useState('');
  const [loadStepText, setLoadStepText] = useState('');
  const loadStepRef = useRef(null);

  const onFormChange = useCallback((key, value) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Derived eligibility/grant/budget calculations
  const derived = useMemo(() => {
    const { cit, age, inc, ftimer, prox, ftype, cash, cpf, loan, marital } = formState;
    const eligibility = checkEligibility(cit, inc, age, marital);
    const grants = calcGrants(cit, inc, ftype, ftimer, prox, marital);
    const loanAmt = loanCapacity(loan);
    const effective = cash + cpf + grants.total + Math.min(loanAmt, 750000);
    return { eligibility, grants, effective };
  }, [formState]);

  const runSearch = useCallback(async () => {
    if (!derived.eligibility.eligible) {
      alert('Please resolve eligibility issues before searching.');
      return;
    }

    setPhase('loading');
    setActiveTab('results');
    const steps = [
      'Connecting to data.gov.sg…',
      'Fetching resale transactions…',
      'Running data quality checks…',
      'Analysing prices per town…',
      'Computing amenity scores…',
      'Ranking recommendations…',
    ];
    let si = 0;
    setLoadMainText('Connecting to data.gov.sg…');
    setLoadStepText(steps[0]);
    loadStepRef.current = setInterval(() => {
      si++;
      setLoadStepText(steps[Math.min(si, steps.length - 1)]);
    }, 900);

    const { selRegions, ftype, lease: minLease, age: buyerAge } = formState;
    const towns = selRegions.length
      ? selRegions.flatMap(r => REGIONS[r] || [])
      : ALL_TOWNS;

    // ── Try backend first ──
    let backendOk = false;
    if (API_BASE) {
      try {
        backendOk = await checkBackendHealth();
      } catch { backendOk = false; }
    }

    if (backendOk) {
      setLoadMainText('Sending request to recommendation engine…');
      try {
        const payload = { ...formState, effective: derived.effective, grants: derived.grants };
        const res = await runSearchBackend(payload);
        clearInterval(loadStepRef.current);
        const topRecs = (res.recommendations || []).map(normaliseBackendRec).slice(0, 10);
        setRawCount(res.raw_count || topRecs.length);
        setLatestMonth(res.latest_month || null);
        setRecs(topRecs);
        setPhase(topRecs.length ? 'results' : 'empty');
        return;
      } catch (e) {
        console.warn('Backend search failed, falling back to data.gov.sg', e);
      }
    }

    // ── Fallback: data.gov.sg direct ──
    const d = new Date();
    d.setMonth(d.getMonth() - 14);
    const cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    let rawRecords = [];
    const BATCH = 6;
    for (let i = 0; i < Math.min(towns.length, 20); i += BATCH) {
      const batch = towns.slice(i, i + BATCH);
      setLoadMainText(
        `Fetching ${batch[0]}… (${i + 1}–${Math.min(i + BATCH, towns.length)} of ${Math.min(towns.length, 20)})`
      );
      const results = await Promise.all(batch.map(t => fetchTown(t, ftype, cutoff)));
      results.forEach(r => rawRecords.push(...r));
    }

    clearInterval(loadStepRef.current);

    const { effective, grants } = derived;
    const { mustAmenities, mrtMax } = formState;

    const seen = new Set();
    const newRecs = [];
    for (const town of towns) {
      if (seen.has(town)) continue;
      seen.add(town);
      const pd = analyseRecords(rawRecords, town, ftype);
      if (!pd) continue;
      if (pd.p25 > effective * 1.18) continue;
      const sc = computeScore(town, pd, effective, mustAmenities, mrtMax, selRegions, ftype, minLease, buyerAge);
      newRecs.push({ town, ftype: ftype === 'any' ? '4 ROOM' : ftype, pd, sc, grants, effective });
    }

    newRecs.sort((a, b) => b.sc.total - a.sc.total);
    const topRecs = newRecs.slice(0, 10);

    setRawCount(rawRecords.length);
    const latest = rawRecords.length
      ? rawRecords.map(r => r.month).sort().reverse()[0]
      : null;
    setLatestMonth(latest);
    setRecs(topRecs);
    setPhase(topRecs.length ? 'results' : 'empty');
  }, [formState, derived]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (loadStepRef.current) clearInterval(loadStepRef.current); };
  }, []);

  

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="grid grid-cols-[400px_1fr] min-h-[calc(100vh-56px)]">
        <Sidebar
          formState={formState}
          onFormChange={onFormChange}
          eligibility={derived.eligibility}
          grants={derived.grants}
          effective={derived.effective}
          onSearch={runSearch}
          isSearching={phase === 'loading'}
        />
        <main className="flex flex-col overflow-y-auto h-[calc(100vh-56px)]">
          {/* Results Tab */}
          {activeTab === 'results' && (
            <MainView phase={phase}
              loadMainText={loadMainText}
              loadStepText={loadStepText} 
              recs={recs}
              derived={derived}
              formState={formState}
              rawCount={rawCount}
              latestMonth={latestMonth}
              highlightedTown={highlightedTown}
              setHighlightedTown={setHighlightedTown}
            
            />
          )}

          {/* Map Tab */}
          {activeTab === 'map' && (
            <MapView recs={recs} highlightedTown={highlightedTown} />
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <TrendsView recs={recs} />
          )}
        </main>
      </div>
    </div>
  );
}
