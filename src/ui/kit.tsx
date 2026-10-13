import React, { useId } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw } from 'lucide-react';
import type { PartStatus } from '../state/analysis';
import { ROLES, type Role } from '../content/deck';

/* ---------- formatting: currency and units always explicit ---------- */
export const sgd = (v: number, d = 2) => `${v < 0 ? '−' : ''}S$${Math.abs(v).toLocaleString('en-SG', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
export const sgd0 = (v: number) => sgd(v, 0);
export const sgdK = (v: number) => (Math.abs(v) >= 1e6 ? `${v < 0 ? '−' : ''}S$${(Math.abs(v) / 1e6).toFixed(2)}m` : Math.abs(v) >= 1e4 ? `${v < 0 ? '−' : ''}S$${(Math.abs(v) / 1e3).toFixed(1)}k` : sgd0(v));
/* Appendix A4 style, as in deck/revenue_cost.md: whole thousands, negatives in brackets. */
export const sgdThousands = (v: number) => { const t = `S$${Math.round(Math.abs(v) / 1e3).toLocaleString('en-SG')}k`; return v < 0 && Math.round(Math.abs(v) / 1e3) > 0 ? `(${t})` : t; };
export const int = (v: number) => Math.round(v).toLocaleString('en-SG');
export const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
export const num = (v: number, d = 2) => v.toLocaleString('en-SG', { minimumFractionDigits: d, maximumFractionDigits: d });
export const secToMin = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')} min`;

/* ---------- palette: checked for colour-blind separation, lightness and 3:1 contrast on the light surface ---------- */
export const SETUP_COLOR: Record<string, string> = { all_human: '#1F4E9E', mixed: '#B8860B', all_machine: '#0E9384' };
export const COMPONENT_COLOR = { labour: '#3B5BA9', machine: '#A066B8', lost: '#C2410C' };
export const INK = '#0A2146', MUTED = '#5B6E8C', GRID = '#E4E9F2', GOLD = '#B8860B';

/* ---------- layout ---------- */
export const Card: React.FC<{ title?: React.ReactNode; kicker?: string; className?: string; children: React.ReactNode; right?: React.ReactNode }> =
  ({ title, kicker, className = '', children, right }) => (
    <section className={`min-w-0 bg-white rounded-2xl p-5 sm:p-6 border border-[#E3DCC8] shadow-xs ${className}`}>
      {(title || kicker) && (
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            {kicker && <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">{kicker}</div>}
            {title && <h3 className="font-display text-lg font-bold text-[#0A2146]">{title}</h3>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );

/* Gate card, in the deck's structure: decision, evidence, suggested action, trade-off, what the model cannot
 * establish, who does what, and (expandable) how it is calculated. */
export const DecisionFrame: React.FC<{
  gate: string; when: string; roles: Role[]; decision: string; evidence: [string, React.ReactNode][];
  action: React.ReactNode; tradeoff: React.ReactNode; limitation: React.ReactNode;
  actions: [Role, React.ReactNode][]; calc?: React.ReactNode[]; status?: PartStatus;
}> = ({ gate, when, roles, decision, evidence, action, tradeoff, limitation, actions, calc, status }) => (
  <section aria-label={`${gate} gate card`} className="rounded-2xl bg-[#0A2558] text-white p-5 sm:p-6 border border-[#1A3D80]">
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/25 text-[#F3DE96] border border-[#D4AF37]/50">{gate}</span>
      <span className="text-[#A8C4ED]">{when}</span>
      {roles.map(r => <RoleChip key={r} role={r} dark />)}
    </div>
    <p className="mt-3 font-serif-body text-lg leading-snug">{decision}</p>
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <FrameCell q="Evidence">
        <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {evidence.map(([k, v]) => <React.Fragment key={k}><dt className="text-[#A8C4ED]">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></React.Fragment>)}
        </dl>
      </FrameCell>
      <FrameCell q="Suggested action">
        {status && status !== 'current' && <div className="mb-1"><StatusBadge status={status} dark /></div>}
        <div className={`text-sm leading-snug ${status === 'stale' ? 'opacity-60' : ''}`}>{action}</div>
      </FrameCell>
      <FrameCell q="Trade-off">
        <p className="text-sm text-[#DCE7F8] leading-snug">{tradeoff}</p>
      </FrameCell>
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
      <FrameCell q="What the model cannot establish">
        <p className="text-sm text-[#F6D9A8] leading-snug">{limitation}</p>
      </FrameCell>
      <FrameCell q="Who does what">
        <ul className="text-sm text-[#DCE7F8] space-y-1.5 leading-snug">
          {actions.map(([r, t], i) => <li key={i} className="flex gap-2 items-start"><RoleChip role={r} dark /><span>{t}</span></li>)}
        </ul>
      </FrameCell>
    </div>
    {calc && calc.length > 0 && (
      <details className="mt-4 group">
        <summary className="cursor-pointer select-none text-xs font-semibold text-[#F3DE96] list-none flex items-center gap-1.5">
          <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>▸</span>How it is calculated
        </summary>
        <ul className="mt-2 text-xs text-[#C9D8F2] space-y-1 list-disc pl-5 leading-relaxed">{calc.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </details>
    )}
  </section>
);
const FrameCell: React.FC<{ q: string; children: React.ReactNode }> = ({ q, children }) => (
  <div className="md:border-l md:border-[#24488C] md:pl-4 first:border-0 first:pl-0 min-w-0">
    <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3DE96] mb-1.5">{q}</div>
    {children}
  </div>
);

const ROLE_TONE: Record<Role, string> = {
  entry: 'bg-[#DCE8FB] text-[#16397A]', crm: 'bg-[#EDE3F6] text-[#5B2C83]', supply: 'bg-[#DFF3EE] text-[#0B5B51]',
  format: 'bg-[#FBEFD5] text-[#6B4E0B]', ops: 'bg-[#F4E3DD] text-[#7A2E19]',
};
export const RoleChip: React.FC<{ role: Role; dark?: boolean }> = ({ role }) => (
  <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold normal-case tracking-normal ${ROLE_TONE[role]}`}>{ROLES[role]}</span>
);

/* ---------- status ---------- */
export const StatusBadge: React.FC<{ status: PartStatus; dark?: boolean; label?: string }> = ({ status, dark, label }) => {
  const m = {
    current: { t: 'Up to date', c: dark ? 'bg-[#0E9384]/30 text-[#9FF0E1]' : 'bg-[#E6F6F3] text-[#0B6B60]', I: CheckCircle2 },
    computing: { t: 'Computing…', c: dark ? 'bg-white/10 text-white' : 'bg-[#EEF2F8] text-[#334E7A]', I: Loader2 },
    stale: { t: 'Recomputing: showing previous inputs', c: dark ? 'bg-[#D4AF37]/25 text-[#F3DE96]' : 'bg-[#FDF5E1] text-[#7A5A0E]', I: RefreshCw },
    error: { t: 'Model error', c: 'bg-[#FDECEA] text-[#9B2C1F]', I: AlertTriangle },
  }[status];
  const I = m.I;
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.c}`}>
      <I className={`w-3 h-3 ${status === 'computing' || status === 'stale' ? 'animate-spin' : ''}`} aria-hidden />
      {label ? `${label}: ` : ''}{m.t}
    </span>
  );
};

export const Stale: React.FC<{ status: PartStatus; children: React.ReactNode; className?: string }> = ({ status, children, className = '' }) => (
  <div className={`relative ${className}`} aria-busy={status !== 'current'}>
    <div className={status === 'stale' || status === 'computing' ? 'opacity-50 transition-opacity' : 'transition-opacity'}>{children}</div>
  </div>
);

/* ---------- notes ---------- */
export const Flag: React.FC<{ tone?: 'warn' | 'info' | 'bad'; children: React.ReactNode; className?: string }> = ({ tone = 'warn', children, className = '' }) => {
  const c = tone === 'warn' ? 'bg-[#FDF5E1] border-[#EAD8AC] text-[#6B4E0B]' : tone === 'bad' ? 'bg-[#FDECEA] border-[#F1BCAF] text-[#8C2F1F]' : 'bg-[#EEF4FD] border-[#CADCF5] text-[#2D496E]';
  const I = tone === 'info' ? Info : AlertTriangle;
  return (
    <div className={`flex gap-2 items-start text-xs leading-snug border rounded-lg px-3 py-2 ${c} ${className}`}>
      <I className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden /> <div>{children}</div>
    </div>
  );
};

export const Explain: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <details className={`group rounded-lg border border-[#E3DCC8] bg-[#FBF8F1] ${className}`}>
    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-[#0A2146] flex items-center gap-1.5 list-none">
      <span className="inline-block transition-transform group-open:rotate-90 text-[#8A6715]" aria-hidden>▸</span>{title}
    </summary>
    <div className="px-3 pb-3 text-xs text-[#3E5375] leading-relaxed space-y-2">{children}</div>
  </details>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean }> = ({ label, value, sub, strong }) => (
  <div className={`rounded-xl px-3 py-2.5 border ${strong ? 'bg-[#0A2558] border-[#0A2558] text-white' : 'bg-[#FBF8F1] border-[#ECE5D3]'}`}>
    <div className={`text-[11px] font-semibold uppercase tracking-wide ${strong ? 'text-[#F3DE96]' : 'text-[#6B7C99]'}`}>{label}</div>
    <div className={`text-lg font-bold leading-tight ${strong ? 'text-white' : 'text-[#0A2146]'}`}>{value}</div>
    {sub && <div className={`text-[11px] mt-0.5 ${strong ? 'text-[#C9D8F2]' : 'text-[#5B6E8C]'}`}>{sub}</div>}
  </div>
);

/* ---------- controls ---------- */
export interface Meta { label: string; unit: string; range: number[]; step: number; source?: string; rationale?: string; usd?: number }

export const Slider: React.FC<{
  meta: Meta; value: number; onChange: (v: number) => void; format?: (v: number) => string; max?: number; min?: number; disabled?: boolean; hint?: React.ReactNode;
}> = ({ meta, value, onChange, format, max, min, disabled, hint }) => {
  const id = useId();
  const lo = min ?? meta.range[0], hi = max ?? meta.range[1];
  const gridLo = +(Math.floor(lo / meta.step + 1e-9) * meta.step).toFixed(6), gridHi = +(Math.ceil(hi / meta.step - 1e-9) * meta.step).toFixed(6);
  const show = format ? format(value) : num(value, meta.step < 1 ? (meta.step < 0.1 ? 2 : 1) : 0);
  const tip = [meta.source, meta.rationale, meta.usd != null ? `Approved as USD ${meta.usd}, converted to SGD.` : ''].filter(Boolean).join('\n');
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-[#0A2146]">
          {meta.label} <span className="font-normal text-[#6B7C99]">({meta.unit})</span>
        </label>
        <span className="text-xs font-bold text-[#0A2146] tabular-nums">{show}</span>
      </div>
      {/* Step grid anchored at round numbers (so values read 700, not 699.78); the result is clamped to the approved range. */}
      <input
        id={id} type="range" min={gridLo} max={gridHi} step={meta.step} value={Math.min(hi, Math.max(lo, value))} disabled={disabled}
        onChange={e => onChange(Math.min(hi, Math.max(lo, +e.target.value)))}
        aria-valuetext={`${show} ${meta.unit}`}
        className="w-full mt-1"
      />
      <div className="flex justify-between text-[10px] text-[#8090AA]" title={tip}>
        <span>{format ? format(lo) : lo}</span>
        <span className="truncate px-2 cursor-help underline decoration-dotted">{meta.source?.startsWith('app') ? 'app assumption' : 'source'}</span>
        <span>{format ? format(hi) : hi}</span>
      </div>
      {hint && <div className="text-[11px] text-[#5B6E8C] mt-0.5">{hint}</div>}
    </div>
  );
};

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { v: T; t: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-[#D9D1BC] bg-[#FBF8F1] p-0.5">
      {options.map(o => (
        <button key={o.v} role="radio" aria-checked={value === o.v} tabIndex={value === o.v ? 0 : -1} onClick={() => onChange(o.v)}
          onKeyDown={e => {
            const k = options.findIndex(x => x.v === o.v), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
            if (!d) return; e.preventDefault();
            const next = options[(k + d + options.length) % options.length];
            onChange(next.v);
            ((e.currentTarget.parentElement?.children[options.indexOf(next)]) as HTMLElement | undefined)?.focus();
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${value === o.v ? 'bg-[#0A2558] text-white' : 'text-[#3E5375] hover:bg-[#F0E9D6]'}`}>
          {o.t}
        </button>
      ))}
    </div>
  );
}

export const NumberField: React.FC<{ label: string; unit?: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; className?: string }> =
  ({ label, unit, value, onChange, step = 1, min, max, className = '' }) => {
    const id = useId();
    return (
      <div className={className}>
        <label htmlFor={id} className="text-xs font-semibold text-[#0A2146]">{label}{unit && <span className="font-normal text-[#6B7C99]"> ({unit})</span>}</label>
        <input id={id} type="number" value={Number.isFinite(value) ? value : ''} step={step} min={min} max={max}
          onChange={e => { const x = parseFloat(e.target.value); if (Number.isFinite(x)) onChange(max != null ? Math.min(max, min != null ? Math.max(min, x) : x) : min != null ? Math.max(min, x) : x); }}
          className="mt-1 w-full rounded-lg border border-[#D9D1BC] bg-white px-2 py-1 text-sm tabular-nums" />
      </div>
    );
  };

export const SetupSwatch: React.FC<{ setup: string }> = ({ setup }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: SETUP_COLOR[setup] }} aria-hidden />
);
