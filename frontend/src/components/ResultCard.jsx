import { AMENITIES } from '../constants';
import { whyText } from '../engine';

function ScoreRow({ icon, label, pts, max, desc }) {
  const frac = pts / max;
  const barCol = frac >= 0.75 ? 'var(--color-green)' : frac >= 0.5 ? 'var(--color-gold)' : 'var(--color-orange)';
  const ptsCls = frac >= 0.75 ? 'text-green' : frac >= 0.5 ? 'text-gold' : 'text-orange';
  return (
    <div className="flex items-center px-3 py-1.5 gap-2.5 border-b border-dk4 last:border-b-0">
      <div className="text-sm shrink-0 w-5 text-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[0.74rem] text-light font-medium">{label}</div>
        <div className="text-[0.67rem] text-muted mt-0.5 leading-snug">{desc}</div>
        <div className="h-0.5 rounded-sm mt-1 bg-dk4">
          <div
            className="h-0.5 rounded-sm bar-fill-transition"
            style={{ width: `${Math.max(0, (pts / max) * 100).toFixed(0)}%`, background: barCol }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-mono text-[0.82rem] font-semibold ${ptsCls}`}>{pts}</div>
        <div className="text-[0.62rem] text-muted">/{max}</div>
      </div>
    </div>
  );
}

function AmenityRow({ icon, label, d, isMust }) {
  if (!d) return null;
  const ptsPositive = d.pts > 0;
  const ptsCls = d.pts >= 5 ? 'text-green' : d.pts > 0 ? 'text-gold' : 'text-orange';
  const detail = d.name
    ? (d.mins ? `${d.name} — ${d.mins} min walk` : d.name)
    : (ptsPositive ? 'Present nearby' : 'Not confirmed nearby');
  return (
    <div className="flex items-center px-3 py-1 gap-2.5 border-b border-dk4 last:border-b-0">
      <div className="text-xs shrink-0 w-5 text-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[0.7rem] text-light font-medium">
          {label}
          {isMust && (
            ptsPositive
              ? <span className="ml-1 inline-flex items-center gap-1 px-1.5 rounded text-[0.62rem] font-mono bg-[rgba(39,174,96,0.12)] text-[#55d98d]">✓ must-have met</span>
              : <span className="ml-1 inline-flex items-center gap-1 px-1.5 rounded text-[0.62rem] font-mono bg-[rgba(192,57,43,0.12)] text-[#ff8080]">✗ must-have missing −5pts</span>
          )}
        </div>
        <div className="text-[0.67rem] text-muted">{detail}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-mono text-[0.76rem] ${ptsCls}`}>{d.pts >= 0 ? '+' : ''}{d.pts}</div>
        <div className="text-[0.62rem] text-muted">/{d.max}</div>
      </div>
    </div>
  );
}

export default function ResultCard({ rec, index, mustAmenities, isHighlighted, onClick, onJumpMap }) {
  const { town, ftype, pd, sc, grants } = rec;
  const am = AMENITIES[town] || {};
  const scCls = sc.total >= 75 ? 'text-green' : sc.total >= 55 ? 'text-gold' : 'text-orange';
  const tr = pd.trend12;
  const trStr = `${tr > 0 ? '▲' : '▼'} ${Math.abs(tr)}%`;
  const trCol = tr > 0 ? 'text-orange' : 'text-green';
  const confCls = pd.conf === 'high' ? 'text-[#55d98d] bg-[rgba(39,174,96,0.1)]'
    : pd.conf === 'medium' ? 'text-orange bg-[rgba(230,126,34,0.1)]'
      : 'text-[#ff8080] bg-[rgba(192,57,43,0.1)]';

  const scoreRows = [];
  if (sc.active?.includes('budget'))
    scoreRows.push({ icon: '💰', label: `Budget Fit (${sc.weight?.toFixed(1)} pts)`, pts: sc.budget.pts, max: sc.weight || sc.budget.max, desc: sc.budget.desc });
  if (sc.active?.includes('mrt'))
    scoreRows.push({ icon: '🚇', label: `MRT Access (${sc.weight?.toFixed(1)} pts)`, pts: sc.transport.pts, max: sc.weight || sc.transport.max, desc: sc.transport.desc });
  if (sc.active?.includes('region'))
    scoreRows.push({ icon: '🗺️', label: `Region Match (${sc.weight?.toFixed(1)} pts)`, pts: sc.region.pts, max: sc.weight || sc.region.max, desc: sc.region.desc });
  if (sc.active?.includes('flat'))
    scoreRows.push({ icon: '🏠', label: `Flat Size (${sc.weight?.toFixed(1)} pts)`, pts: sc.flat.pts, max: sc.weight || sc.flat.max, desc: sc.flat.desc });
  if (sc.active?.includes('lease'))
    scoreRows.push({ icon: '📅', label: `Min Lease (${sc.weight?.toFixed(1)} pts)`, pts: sc.components?.lease?.pts || 0, max: sc.weight || 13.33, desc: 'Estimated remaining lease vs your minimum requirement' });
  // Fallback: if no active criteria detected (old score shape), show all
  if (!sc.active || scoreRows.length === 0) {
    scoreRows.push(
      { icon: '💰', label: 'Budget Fit', pts: sc.budget.pts, max: sc.budget.max, desc: sc.budget.desc },
      { icon: '🚇', label: 'Transport Access', pts: sc.transport.pts, max: sc.transport.max, desc: sc.transport.desc },
      { icon: '🗺️', label: 'Region Match', pts: sc.region.pts, max: sc.region.max, desc: sc.region.desc },
      { icon: '🏠', label: 'Flat Attributes', pts: sc.flat.pts, max: sc.flat.max, desc: sc.flat.desc },
    );
  }

  const amenItems = [
    { key: 'mrt', icon: '🚇', label: 'MRT Station', d: sc.amenity.detail.mrt },
    { key: 'hawker', icon: '🍜', label: 'Hawker Centre', d: sc.amenity.detail.hawker },
    { key: 'park', icon: '🌳', label: 'Park', d: sc.amenity.detail.park },
    { key: 'school', icon: '🏫', label: 'Primary School', d: sc.amenity.detail.school },
    { key: 'hospital', icon: '🏥', label: 'Hospital', d: sc.amenity.detail.hospital },
  ];

  const amenPtsCls = sc.amenity.pts >= 20 ? 'text-green' : sc.amenity.pts >= 12 ? 'text-gold' : 'text-orange';

  return (
    <div
      onClick={onClick}
      className={`bg-dk2 border rounded-[10px] mb-3 overflow-hidden cursor-pointer transition-all duration-200 animate-slide-up hover:border-mid hover:-translate-y-px
        ${isHighlighted ? 'border-gold' : 'border-dk3'}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-2 gap-2.5">
        <div className="w-[26px] h-[26px] bg-gradient-to-br from-red to-gold rounded-[5px] flex items-center justify-center text-[0.72rem] font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="font-serif text-[0.95rem] text-white">{town}</div>
          <div className="text-[0.7rem] text-muted mt-0.5">
            {ftype} · HDB Resale · {pd.n} transactions
            {rec.failed_must?.length > 0 && <span className="text-orange"> · ⚠️ {rec.failed_must.length} threshold missed</span>}
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-[1.2rem] font-semibold leading-none ${scCls}`}>{sc.total}</div>
          <div className="text-[0.6rem] text-muted">/100 score</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-4 pb-2">
        <div className="h-[3px] bg-dk3 rounded-sm overflow-hidden">
          <div className="h-full rounded-sm bg-gradient-to-r from-red to-gold bar-fill-transition" style={{ width: `${sc.total}%` }} />
        </div>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted">
            Budget <span className="text-light">{sc.budget.pts.toFixed?.(1) ?? sc.budget.pts}/{sc.budget.max.toFixed?.(1) ?? 20}</span>
          </div>
          <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted">
            Amenities <span className="text-light">{sc.amenity.pts.toFixed?.(1) ?? sc.amenity.pts}/{sc.amenity.max.toFixed?.(1) ?? 30}</span>
          </div>
          <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted">
            Transport <span className="text-light">{sc.transport.pts.toFixed?.(1) ?? sc.transport.pts}/{sc.transport.max.toFixed?.(1) ?? 20}</span>
          </div>
          <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted">
            Region <span className="text-light">{sc.region.pts.toFixed?.(1) ?? sc.region.pts}/{sc.region.max.toFixed?.(1) ?? 15}</span>
          </div>
          <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted">
            Flat <span className="text-light">{sc.flat.pts.toFixed?.(1) ?? sc.flat.pts}/{sc.flat.max.toFixed?.(1) ?? 15}</span>
          </div>
          {sc.serendipity && <div className="text-[0.62rem] px-1.5 py-0.5 rounded bg-dk3 text-muted border-l-2 border-[#9b59b6]">
            Serendipity <span className="text-[#c39bd3]">{sc.serendipity.pts.toFixed(1)}/20</span>
          </div>}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-2 border-t border-dk3">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">Est. Price Range</div>
            <div className="font-mono text-[0.85rem] text-gold">${(pd.p25 / 1000).toFixed(0)}k–${(pd.p75 / 1000).toFixed(0)}k</div>
          </div>
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">Median Price</div>
            <div className="font-mono text-[0.8rem] text-light">${pd.median.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">$/sqm</div>
            <div className="font-mono text-[0.8rem] text-light">${pd.psm.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">12-mo Trend</div>
            <div className={`font-mono text-[0.8rem] ${trCol}`}>{trStr}</div>
          </div>
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">Avg Area</div>
            <div className="font-mono text-[0.8rem] text-light">{pd.avgArea} sqm</div>
          </div>
          <div>
            <div className="text-[0.62rem] text-muted uppercase tracking-wide mb-0.5">Confidence</div>
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65rem] font-mono ${confCls}`}>● {pd.conf}</div>
          </div>
        </div>

        {/* Amenity pills */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {am.mrt && <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-dk3 border border-dk4 text-[0.7rem] text-muted">🚇 {am.mrt} — {am.mrtMin} min</div>}
          {am.hawker && <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-dk3 border border-dk4 text-[0.7rem] text-muted">🍜 {am.hawker}</div>}
          {am.park && <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-dk3 border border-dk4 text-[0.7rem] text-muted">🌳 {am.park}</div>}
        </div>

        {/* Why text */}
        <div className="text-[0.76rem] text-muted leading-relaxed italic px-2.5 py-1.5 bg-dk3 rounded-[5px] border-l-2 border-gold mb-2">
          {whyText(town, ftype, sc.total, pd, rec.effective)}
        </div>

        {/* Score Breakdown */}
        <div className="mt-3 bg-dk3 rounded-[7px] border border-dk4 overflow-hidden">
          <div className="px-3 py-2 pb-1.5 text-[0.68rem] text-muted uppercase tracking-[1px] border-b border-dk4">
            📊 Score Breakdown — {sc.total}/100
          </div>
          {scoreRows.map(row => <ScoreRow key={row.label} {...row} />)}
          {/* Amenity header row */}
          <div className="flex items-center px-3 py-1.5 gap-2.5 border-b border-dk4">
            <div className="text-sm shrink-0 w-5 text-center">📍</div>
            <div className="flex-1">
              <div className="text-[0.74rem] text-light font-medium">
                Amenity Score <span className="text-[0.62rem] text-muted font-normal">— {typeof sc.amenity.pts === 'number' ? sc.amenity.pts.toFixed(1) : sc.amenity.pts}/{typeof sc.weight === 'number' ? sc.weight.toFixed(1) : '30'} pts</span>
              </div>
              <div className="text-[0.67rem] text-muted">Breakdown of all nearby amenities and their contribution</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-mono text-[0.82rem] font-semibold ${amenPtsCls}`}>{typeof sc.amenity.pts === 'number' ? sc.amenity.pts.toFixed(1) : sc.amenity.pts}</div>
              <div className="text-[0.62rem] text-muted">/{typeof sc.weight === 'number' ? sc.weight.toFixed(1) : '30'}</div>
            </div>
          </div>
          {amenItems.map(ai => (
            <AmenityRow key={ai.key} icon={ai.icon} label={ai.label} d={ai.d} isMust={mustAmenities.includes(ai.key)} />
          ))}
        </div>

        {/* Grant pills */}
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {grants.ehg > 0 && <span className="px-2 py-0.5 rounded text-[0.65rem] font-mono bg-[rgba(39,174,96,0.12)] text-[#55d98d] border border-[rgba(39,174,96,0.25)]">EHG ${grants.ehg.toLocaleString()}</span>}
          {grants.cpfG > 0 && <span className="px-2 py-0.5 rounded text-[0.65rem] font-mono bg-[rgba(41,128,185,0.12)] text-[#70b8e8] border border-[rgba(41,128,185,0.25)]">CPF Grant ${grants.cpfG.toLocaleString()}</span>}
          {grants.phg > 0 && <span className="px-2 py-0.5 rounded text-[0.65rem] font-mono bg-[rgba(155,89,182,0.12)] text-[#c39bd3] border border-[rgba(155,89,182,0.25)]">PHG ${grants.phg.toLocaleString()}</span>}
          {grants.total === 0 && <span className="text-[0.68rem] text-muted">No grants applicable</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-dk3 flex items-center justify-between">
        <span className="text-[0.62rem] text-dk4 font-mono">data.gov.sg · HDB Resale Prices · up to {pd.latest || '—'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onJumpMap(town); }}
          className="px-2.5 py-1 bg-transparent border border-mid rounded-full text-muted text-[0.7rem] cursor-pointer font-sans transition-all hover:border-gold hover:text-gold"
        >
          📍 Show on Map
        </button>
      </div>
    </div>
  );
}
