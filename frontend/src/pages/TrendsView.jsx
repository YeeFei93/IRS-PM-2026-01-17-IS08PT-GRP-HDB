export default function TrendsView({ recs }) {
  if (!recs.length) {
    return (
      <div className="p-5">
        <div className="mb-4">
          <div className="font-serif text-[1.2rem] text-white">Price Trend Analysis</div>
          <div className="text-[0.76rem] text-muted mt-1">Monthly median resale prices · data.gov.sg</div>
        </div>
        <div className="text-muted text-[0.82rem] py-5">
          Run a search to see price trends for your selected towns.
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-4">
        <div className="font-serif text-[1.2rem] text-white">Price Trend Analysis</div>
        <div className="text-[0.76rem] text-muted mt-1">Monthly median resale prices · data.gov.sg</div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {recs.slice(0, 9).map((rec, idx) => {
          const { pd } = rec;
          const vals = pd.vals || [];
          const max = Math.max(...vals, 1);
          const tr = pd.trend12;

          return (
            <div
              key={rec.town}
              className="bg-dk2 border border-dk3 rounded-[10px] p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="font-serif text-[0.95rem] text-white mb-0.5">{rec.town}</div>
              <div className="text-[0.67rem] text-muted uppercase tracking-[1px] mb-2.5">{rec.ftype}</div>
              <div className="font-mono text-[1.25rem] text-gold mb-0.5">${pd.median.toLocaleString()}</div>
              <div className="text-[0.72rem] text-muted mb-2.5">
                ${pd.psm.toLocaleString()}/sqm · {pd.n} txns
              </div>

              {/* Chart bars */}
              <div className="h-[54px] flex items-end gap-0.5 mb-1.5">
                {vals.length > 0 ? vals.map((v, i) => {
                  const h = Math.max(4, Math.round(v / max * 100));
                  const isCur = i === vals.length - 1;
                  return (
                    <div
                      key={i}
                      title={`$${v.toLocaleString()}`}
                      className={`flex-1 rounded-t-sm transition-all duration-500 min-h-[2px] cursor-pointer
                        ${isCur ? 'bg-gold' : 'bg-[rgba(212,168,67,0.25)] hover:bg-[rgba(212,168,67,0.55)]'}`}
                      style={{ height: `${h}%` }}
                    />
                  );
                }) : (
                  <span className="text-[0.68rem] text-muted">Insufficient data</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-3.5">
                <div>
                  <div className={`font-mono text-[0.76rem] ${tr > 0 ? 'text-orange' : 'text-green'}`}>
                    {tr > 0 ? '▲' : '▼'} {Math.abs(tr)}%
                  </div>
                  <div className="text-[0.62rem] text-muted">12-mo</div>
                </div>
                <div>
                  <div className="font-mono text-[0.76rem]">${(pd.p25 / 1000).toFixed(0)}k</div>
                  <div className="text-[0.62rem] text-muted">25th pct</div>
                </div>
                <div>
                  <div className="font-mono text-[0.76rem]">${(pd.p75 / 1000).toFixed(0)}k</div>
                  <div className="text-[0.62rem] text-muted">75th pct</div>
                </div>
                <div>
                  <div className="font-mono text-[0.76rem]">{pd.avgArea}</div>
                  <div className="text-[0.62rem] text-muted">avg sqm</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
