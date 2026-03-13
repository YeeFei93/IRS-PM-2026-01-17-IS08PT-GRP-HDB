import { useState, useMemo } from 'react';

function SidebarSection({ icon, title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-dk3">
      <div
        className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm">{icon}</span>
        <span className="font-serif text-[0.88rem] text-gold flex-1">{title}</span>
        <span className={`text-[11px] text-muted transition-transform duration-200 ${!open ? '-rotate-90' : ''}`}>
          ▾
        </span>
      </div>
      {open && <div className="px-4 pb-3.5">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[0.7rem] text-muted uppercase tracking-[1px] mb-1.5 font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function RangeValue({ children }) {
  return (
    <div className="font-mono text-[0.78rem] text-gold text-right mb-1">
      {children}
    </div>
  );
}

function RangeLabels({ left, right }) {
  return (
    <div className="flex justify-between text-[0.68rem] text-muted mt-1">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function CheckItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 border rounded-[5px] cursor-pointer transition-all text-[0.76rem] select-none
        ${active
          ? 'bg-[rgba(212,168,67,0.1)] border-gold text-gold-l'
          : 'bg-dk3 border-dk4 hover:border-mid'
        }`}
    >
      <span className="text-[13px]">{icon}</span> {label}
    </div>
  );
}

function RegionTag({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full border text-[0.72rem] cursor-pointer transition-all select-none
        ${active
          ? 'bg-[rgba(192,57,43,0.2)] border-red text-[#ff9090]'
          : 'bg-dk3 border-dk4 hover:border-mid'
        }`}
    >
      {label}
    </div>
  );
}

function EligibilityBadge({ eligible, warns, notes, effective, grants }) {
  if (!eligible) {
    return (
      <div className="mt-2.5 p-2.5 px-3 rounded-md text-[0.78rem] leading-relaxed border bg-[rgba(192,57,43,0.07)] border-[rgba(192,57,43,0.3)] text-[#ff8080]">
        ⚠️ {warns.join(' ')}
      </div>
    );
  }
  const cls = warns.length
    ? 'bg-[rgba(230,126,34,0.07)] border-[rgba(230,126,34,0.3)] text-[#f0a050]'
    : 'bg-[rgba(39,174,96,0.07)] border-[rgba(39,174,96,0.3)] text-[#55d98d]';
  return (
    <div className={`mt-2.5 p-2.5 px-3 rounded-md text-[0.78rem] leading-relaxed border ${cls}`}>
      ✓ Eligible &nbsp;·&nbsp; Effective Budget: <strong>~${effective.toLocaleString()}</strong>
      {grants.total > 0 && (
        <><br /><small>EHG ${grants.ehg.toLocaleString()} + CPF ${grants.cpfG.toLocaleString()} + PHG ${grants.phg.toLocaleString()} = ${grants.total.toLocaleString()}</small></>
      )}
      {warns.length > 0 && <><br /><small>{warns.join(' ')}</small></>}
      {notes.length > 0 && <><br /><small>{notes.join(' ')}</small></>}
    </div>
  );
}

const REGION_OPTIONS = [
  { value: 'north', label: 'North' },
  { value: 'northeast', label: 'North-East' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
];

const AMENITY_OPTIONS = [
  { value: 'mrt', icon: '🚇', label: 'MRT ≤500m' },
  { value: 'hawker', icon: '🍜', label: 'Hawker ≤1km' },
  { value: 'school', icon: '🏫', label: 'Pri School ≤1km' },
  { value: 'park', icon: '🌳', label: 'Park ≤1km' },
  { value: 'mall', icon: '🛍️', label: 'Mall ≤1.5km' },
  { value: 'hospital', icon: '🏥', label: 'Hospital ≤3km' },
];

const MARITAL_OPTIONS = [
  { value: 'married', label: 'Married', groups: ['SC_SC', 'SC_PR', 'SC_NR', 'PR_PR'] },
  { value: 'fiancee', label: 'Fiancé / Fiancée', groups: ['SC_SC', 'SC_PR', 'SC_NR'] },
  { value: 'widowed', label: 'Widowed / Divorced', groups: ['SC_SC', 'SC_PR', 'PR_PR'] },
  { value: 'single_scheme', label: 'Singapore Single Scheme', groups: ['SC_single'] },
  { value: 'joint', label: 'Joint Singles Scheme (JSS)', groups: ['SC_single'] },
  { value: 'with_parents', label: 'Single with Parents', groups: ['SC_single'] },
];

const FTIMER_OPTIONS = [
  { value: 'first', label: 'First-Timer', groups: null },
  { value: 'second', label: 'Second-Timer', groups: null },
  { value: 'mixed', label: 'One First + One Second Timer', groups: ['SC_SC', 'SC_PR', 'PR_PR'] },
];

export default function Sidebar({
  formState, onFormChange, eligibility, grants, effective, onSearch, isSearching,
}) {
  const {
    cit, age, marital, inc, ftimer, prox,
    ftype, selRegions, floor, lease,
    cash, cpf, loan,
    mustAmenities, mrtMax,
  } = formState;

  const set = (key) => (e) => onFormChange(key, e.target.value);
  const setNum = (key) => (e) => onFormChange(key, +e.target.value);

  // Dynamic marital options filtered by citizenship
  const visibleMarital = useMemo(() => MARITAL_OPTIONS.filter(opt => opt.groups.includes(cit)), [cit]);
  const visibleFtimer = useMemo(() => FTIMER_OPTIONS.filter(opt => !opt.groups || opt.groups.includes(cit)), [cit]);

  // Auto-reset marital/ftimer when citizenship changes and current selection is invalid
  const maritalValid = visibleMarital.some(o => o.value === marital);
  if (!maritalValid && visibleMarital.length > 0) {
    onFormChange('marital', visibleMarital[0].value);
  }
  const ftimerValid = visibleFtimer.some(o => o.value === ftimer);
  if (!ftimerValid && visibleFtimer.length > 0) {
    onFormChange('ftimer', visibleFtimer[0].value);
  }

  const toggleRegion = (val) => {
    const next = selRegions.includes(val)
      ? selRegions.filter(r => r !== val)
      : [...selRegions, val];
    onFormChange('selRegions', next);
  };

  const toggleAmenity = (val) => {
    const next = mustAmenities.includes(val)
      ? mustAmenities.filter(a => a !== val)
      : [...mustAmenities, val];
    onFormChange('mustAmenities', next);
  };

  return (
    <aside className="bg-dk2 border-r border-dk4 overflow-y-auto h-[calc(100vh-56px)] sticky top-14 w-[400px] shrink-0">
      {/* Buyer Profile */}
      <SidebarSection icon="👤" title="Buyer Profile">
        <Field label="Citizenship Status">
          <select value={cit} onChange={set('cit')}>
            <option value="SC_SC">SC + SC (Couple / Family)</option>
            <option value="SC_PR">SC + SPR Couple</option>
            <option value="SC_NR">SC + Non-Resident Spouse</option>
            <option value="SC_single">SC Single (≥35)</option>
            <option value="PR_PR">PR + PR Couple</option>
          </select>
        </Field>
        <Field label="Age — Youngest Applicant">
          <RangeValue>{age} yrs</RangeValue>
          <input type="range" min={21} max={70} value={age} onChange={setNum('age')} />
          <RangeLabels left="21" right="70" />
        </Field>
        <Field label="Marital / Family Status">
          <select value={marital} onChange={set('marital')}>
            {visibleMarital.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Monthly Household Income ($)">
          <RangeValue>${Number(inc).toLocaleString()} / mo</RangeValue>
          <input type="range" min={0} max={21000} step={500} value={inc} onChange={setNum('inc')} />
          <RangeLabels left="$0" right="$21,000" />
        </Field>
        <Field label="First-Timer Status">
          <select value={ftimer} onChange={set('ftimer')}>
            {visibleFtimer.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Living Near / With Parents?">
          <select value={prox} onChange={set('prox')}>
            <option value="none">No</option>
            <option value="same">Same Flat as Parents / Children</option>
            <option value="near">Within 4km of Parents / Children</option>
          </select>
        </Field>
        {eligibility && (
          <EligibilityBadge
            eligible={eligibility.eligible}
            warns={eligibility.warns}
            notes={eligibility.notes}
            effective={effective}
            grants={grants}
          />
        )}
      </SidebarSection>

      {/* Flat Preferences */}
      <SidebarSection icon="🏢" title="Flat Preferences">
        <Field label="Flat Type">
          <select value={ftype} onChange={set('ftype')}>
            <option value="any">Any</option>
            <option value="2 ROOM">2-Room Flexi</option>
            <option value="3 ROOM">3-Room</option>
            <option value="4 ROOM">4-Room</option>
            <option value="5 ROOM">5-Room</option>
            <option value="EXECUTIVE">Executive</option>
          </select>
        </Field>
        <Field label="Preferred Region">
          <div className="flex flex-wrap gap-1.5">
            {REGION_OPTIONS.map(r => (
              <RegionTag
                key={r.value}
                label={r.label}
                active={selRegions.includes(r.value)}
                onClick={() => toggleRegion(r.value)}
              />
            ))}
          </div>
        </Field>
        <Field label="Floor Preference">
          <select value={floor} onChange={set('floor')}>
            <option value="any">Any Floor</option>
            <option value="low">Low (1–6F)</option>
            <option value="mid">Mid (7–15F)</option>
            <option value="high">High (16F+)</option>
          </select>
        </Field>
        <Field label="Minimum Remaining Lease">
          <RangeValue>{lease} years</RangeValue>
          <input type="range" min={20} max={99} step={5} value={lease} onChange={setNum('lease')} />
          <RangeLabels left="20 yrs" right="99 yrs" />
        </Field>
      </SidebarSection>

      {/* Budget */}
      <SidebarSection icon="💰" title="Budget">
        <Field label="Cash Available ($)">
          <RangeValue>${Number(cash).toLocaleString()}</RangeValue>
          <input type="range" min={0} max={500000} step={5000} value={cash} onChange={setNum('cash')} />
          <RangeLabels left="$0" right="$500k" />
        </Field>
        <Field label="CPF Ordinary Account ($)">
          <RangeValue>${Number(cpf).toLocaleString()}</RangeValue>
          <input type="range" min={0} max={600000} step={5000} value={cpf} onChange={setNum('cpf')} />
          <RangeLabels left="$0" right="$600k" />
        </Field>
        <Field label="Max Monthly Loan Repayment ($)">
          <RangeValue>${Number(loan).toLocaleString()} / mo</RangeValue>
          <input type="range" min={500} max={6000} step={100} value={loan} onChange={setNum('loan')} />
          <RangeLabels left="$500" right="$6,000" />
        </Field>
      </SidebarSection>

      {/* Amenity Priorities */}
      <SidebarSection icon="📍" title="Amenity Priorities">
        <Field label={<>Must-Have Amenities <span className="text-muted text-[0.62rem] normal-case tracking-normal">(threshold-filtered)</span></>}>
          <div className="grid grid-cols-2 gap-1.5">
            {AMENITY_OPTIONS.map(a => (
              <CheckItem
                key={a.value}
                icon={a.icon}
                label={a.label}
                active={mustAmenities.includes(a.value)}
                onClick={() => toggleAmenity(a.value)}
              />
            ))}
          </div>
          <div className="text-[0.61rem] text-muted mt-1.5 leading-relaxed">
            Selected amenities are threshold-checked against real dataset distances.<br />
            Towns that miss a must-have enter serendipity pool only.
          </div>
        </Field>
        <Field label="Max Walk to MRT (minutes)">
          <RangeValue>{mrtMax} min</RangeValue>
          <input type="range" min={3} max={30} value={mrtMax} onChange={setNum('mrtMax')} />
          <RangeLabels left="3 min" right="30 min" />
        </Field>
      </SidebarSection>

      {/* Search Button */}
      <div className="p-4">
        <button
          onClick={onSearch}
          disabled={isSearching || !eligibility?.eligible}
          className="w-full py-3 bg-gradient-to-br from-red to-gold border-none rounded-[7px] text-white font-sans text-[0.9rem] font-semibold cursor-pointer tracking-wide transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🔍 Find My HDB Estate
        </button>
        <p className="text-center text-[0.64rem] text-dk4 mt-2 leading-relaxed">
          Live data · data.gov.sg HDB Resale Dataset<br />
          Prices are indicative estimates only
        </p>
      </div>
    </aside>
  );
}
