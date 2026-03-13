import { useState, useMemo } from 'react';
import ResultCard from './ResultCard';

const SORT_TABS = [
  { key: 'score', label: '⭐ By Score' },
  { key: 'price_asc', label: '💲 Price ↑' },
  { key: 'price_desc', label: '💲 Price ↓' },
  { key: 'psm', label: '📐 $/sqm' },
];

function schemeLabels(cit, marital) {
  let ehg = 'EHG', cpf = 'CPF Grant';
  if (cit === 'SC_NR') {
    ehg = 'EHG (Singles — ½ income)';
    cpf = 'CPF Grant (Singles)';
  } else if (cit === 'SC_single' && marital === 'joint') {
    ehg = 'EHG (Joint Singles)';
    cpf = 'CPF Grant (JSS)';
  } else if (cit === 'SC_single' && marital === 'single_scheme') {
    ehg = 'EHG (Singles)';
    cpf = 'CPF Grant (Singles)';
  } else if (cit === 'SC_single' && marital === 'with_parents') {
    ehg = 'EHG (Singles — w/ Parents)';
    cpf = 'CPF Grant (Singles)';
  } else if (cit === 'SC_SC') {
    ehg = 'EHG (Families)';
    cpf = 'CPF Housing Grant (SC/SC)';
  } else if (cit === 'SC_PR') {
    ehg = 'EHG (Families)';
    cpf = 'CPF Housing Grant (SC/PR)';
  }
  return { ehg, cpf };
}

export default function ResultsPane({
  recs, grants, effective, cash, cpf, cit, marital, rawCount, latestMonth, mustAmenities,
  highlightedTown, onCardClick, onJumpMap,
}) {
  const [sortKey, setSortKey] = useState('score');
  const labels = useMemo(() => schemeLabels(cit, marital), [cit, marital]);
  const activeCriteriaCount = recs[0]?.sc?.active?.length || 0;

  const sorted = [...recs];
  if (sortKey === 'score') sorted.sort((a, b) => b.sc.total - a.sc.total);
  else if (sortKey === 'price_asc') sorted.sort((a, b) => a.pd.median - b.pd.median);
  else if (sortKey === 'price_desc') sorted.sort((a, b) => b.pd.median - a.pd.median);
  else if (sortKey === 'psm') sorted.sort((a, b) => a.pd.psm - b.pd.psm);

  let staleWarning = null;
  if (latestMonth) {
    const [y, m] = latestMonth.split('-').map(Number);
    const now = new Date();
    const wks = Math.floor(((now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)) * 4.33);
    if (wks > 6) {
      staleWarning = (
        <div className="px-3 py-2 bg-[rgba(212,168,67,0.04)] border border-[rgba(212,168,67,0.12)] rounded-[5px] text-[0.7rem] text-muted leading-relaxed mb-3.5">
          ⚠️ Latest transaction data is ~{wks} weeks old. Verify at{' '}
          <a href="https://www.hdb.gov.sg" target="_blank" rel="noopener noreferrer" className="text-gold">hdb.gov.sg</a>.
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Sort tabs */}
      <div className="flex gap-1 px-5 pt-3 border-b border-dk3 bg-dk2 shrink-0">
        {SORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSortKey(tab.key)}
            className={`px-4 py-1.5 pb-2.5 bg-transparent border-none font-sans text-[0.8rem] cursor-pointer border-b-2 transition-all -mb-px
              ${sortKey === tab.key ? 'text-gold border-b-gold' : 'text-muted border-b-transparent'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="font-serif text-[1.25rem] text-white">Top {recs.length} Recommendations</div>
            <div className="text-[0.74rem] text-muted mt-0.5">
              {rawCount.toLocaleString()} transactions · {latestMonth || '—'} · {activeCriteriaCount} active criteria · data.gov.sg
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[rgba(22,160,133,0.1)] border border-[rgba(22,160,133,0.25)] text-teal text-[0.65rem] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow" />
            LIVE DATA
          </span>
        </div>

        {/* Grant bar */}
        <div className="bg-dk2 border border-dk3 border-l-[3px] border-l-green rounded-[7px] px-4 py-3 mb-3.5 flex items-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="text-[0.62rem] text-muted uppercase tracking-[1px]">Cash + CPF</div>
            <div className="font-mono text-[0.9rem] text-green font-semibold">${(cash + cpf).toLocaleString()}</div>
          </div>
          {grants.ehg > 0 && <>
            <div className="w-px h-8 bg-dk4" />
            <div className="text-center">
              <div className="text-[0.62rem] text-muted uppercase tracking-[1px]">{labels.ehg}</div>
              <div className="font-mono text-[0.9rem] text-green font-semibold">${grants.ehg.toLocaleString()}</div>
            </div>
          </>}
          {grants.cpfG > 0 && <>
            <div className="w-px h-8 bg-dk4" />
            <div className="text-center">
              <div className="text-[0.62rem] text-muted uppercase tracking-[1px]">{labels.cpf}</div>
              <div className="font-mono text-[0.9rem] text-green font-semibold">${grants.cpfG.toLocaleString()}</div>
            </div>
          </>}
          {grants.phg > 0 && <>
            <div className="w-px h-8 bg-dk4" />
            <div className="text-center">
              <div className="text-[0.62rem] text-muted uppercase tracking-[1px]">PHG</div>
              <div className="font-mono text-[0.9rem] text-green font-semibold">${grants.phg.toLocaleString()}</div>
            </div>
          </>}
          <div className="w-px h-8 bg-dk4" />
          <div className="text-center">
            <div className="text-[0.62rem] text-muted uppercase tracking-[1px]">Effective Budget</div>
            <div className="font-mono text-[0.9rem] text-green font-semibold">~${effective.toLocaleString()}</div>
          </div>
        </div>

        {staleWarning}

        {/* Cards */}
        {sorted.map((rec, i) => (
          <ResultCard
            key={rec.town}
            rec={rec}
            index={i}
            mustAmenities={mustAmenities}
            isHighlighted={highlightedTown === rec.town}
            onClick={() => onCardClick(rec.town)}
            onJumpMap={onJumpMap}
          />
        ))}

        {/* Disclaimer */}
        <div className="pt-3.5 text-[0.66rem] text-dk4 leading-relaxed border-t border-dk3 mt-1.5">
          All prices are indicative estimates based on historical HDB resale transactions from{' '}
          <strong className="text-muted">data.gov.sg</strong>.
          Amenity proximity is approximate (walking-time estimates). Always verify eligibility at{' '}
          <a href="https://www.hdb.gov.sg" target="_blank" rel="noopener noreferrer" className="text-gold">www.hdb.gov.sg</a>.
          This tool does not guarantee flat availability or transaction prices.
        </div>
      </div>
    </div>
  );
}
