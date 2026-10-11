/* Hand-rolled responsive SVG charts (viewBox scaling), matching the existing app. Each has a hover layer
 * and direct labels; colours come from kit.tsx's validated palettes. */
import React, { useEffect, useRef, useState } from 'react';
import { INK, MUTED, GRID, GOLD, COMPONENT_COLOR, SETUP_COLOR, int, sgd0, sgd, sgdK, pct } from './kit';
import { SETUP_LABEL } from '../model/engine.js';

/* Charts draw at the container's real pixel width, so text stays the same size on phones and wide screens. */
function useWidth(fallback = 300): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function ticks(max: number, n = 4): number[] {
  if (!(max > 0)) return [0];
  const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const Tip: React.FC<{ x: number; y: number; w?: number; lines: string[]; W: number }> = ({ x, y, w = 168, lines, W }) => {
  const bx = Math.min(Math.max(4, x - w / 2), W - w - 4), h = 8 + lines.length * 14;
  return (
    <g pointerEvents="none">
      <rect x={bx} y={y} width={w} height={h} rx={6} fill="#0A2146" opacity={0.94} />
      {lines.map((t, i) => <text key={i} x={bx + 8} y={y + 16 + i * 14} fontSize={11} fill="#fff" fontWeight={i ? 400 : 700}>{t}</text>)}
    </g>
  );
};

/* Every chart has the same figures as a table, for keyboard, screen-reader and touch users. */
export const ChartTable: React.FC<{ caption: string; head: string[]; rows: (string | number)[][] }> = ({ caption, head, rows }) => (
  <details className="mt-1 text-xs">
    <summary className="cursor-pointer select-none text-[#0047BA] font-semibold">Show data table</summary>
    <div className="overflow-x-auto mt-1">
      <table className="w-full tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="text-left text-[#6B7C99] border-b border-[#ECE5D3]">{head.map(h => <th key={h} scope="col" className="py-1 pr-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#F3EEE2]">{r.map((c, j) => j ? <td key={j} className="py-0.5 pr-3">{c}</td> : <th key={j} scope="row" className="py-0.5 pr-3 text-left font-normal">{c}</th>)}</tr>)}</tbody>
      </table>
    </div>
  </details>
);

/* Focus, hover and tap all select the same mark; Escape clears. */
const pointProps = (i: number, label: string, set: (v: number | null) => void) => ({
  tabIndex: 0, role: 'button', 'aria-label': label,
  onMouseEnter: () => set(i), onMouseLeave: () => set(null), onFocus: () => set(i), onBlur: () => set(null),
  onPointerDown: () => set(i), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') set(null); },
  style: { outline: 'none' } as React.CSSProperties,
});

/* ---------- Predict: 12-week band ---------- */
export const ForecastChart: React.FC<{
  weeks: { week: number; hype: boolean; base: number; low: number; high: number }[];
  perDay: boolean; coverage: number; u: number; bandNote: string; actuals?: { week: number; cups: number }[];
}> = ({ weeks, perDay, coverage, u, bandNote, actuals }) => {
  const [hover, setHover] = useState<number | null>(null);
  const k = perDay ? 1 / 7 : 1;
  const [box, W] = useWidth();
  const H = 240, L = 52, R = 12, T = 14, B = 22;
  const ymax = Math.max(...weeks.map(w => w.high * k), ...(actuals || []).map(a => a.cups * k)) * 1.08;
  const X = (i: number) => L + (W - L - R) * (i + 0.5) / weeks.length, Y = (v: number) => T + (H - T - B) * (1 - v / ymax);
  const bw = (W - L - R) / weeks.length;
  const area = weeks.map((w, i) => `${i ? 'L' : 'M'}${X(i) - bw / 2} ${Y(w.high * k)} L${X(i) + bw / 2} ${Y(w.high * k)}`).join(' ') + ' ' +
    [...weeks].reverse().map((w, j) => { const i = weeks.length - 1 - j; return `L${X(i) + bw / 2} ${Y(w.low * k)} L${X(i) - bw / 2} ${Y(w.low * k)}`; }).join(' ') + ' Z';
  const line = weeks.map((w, i) => `${i ? 'L' : 'M'}${X(i) - bw / 2} ${Y(w.base * k)} L${X(i) + bw / 2} ${Y(w.base * k)}`).join(' ');
  const hypeN = weeks.filter(w => w.hype).length;
  const unit = perDay ? 'cups/day' : 'cups/week';
  return (
    <div ref={box} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="group" aria-label={`Weekly demand forecast in ${unit}, ${bandNote}. Tab to each week, or use the data table.`}>
      {hypeN > 0 && <rect x={L} y={T} width={bw * hypeN} height={H - T - B} fill="#FDF5E1" />}
      {hypeN > 0 && <text x={L + 6} y={T + 13} fontSize={10.5} fill="#7A5A0E" fontWeight={700}>Opening hype</text>}
      {ticks(ymax).map(v => (
        <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={GRID} /><text x={L - 6} y={Y(v) + 3.5} fontSize={10} fill={MUTED} textAnchor="end">{int(v)}</text></g>
      ))}
      <path d={area} fill="#1F4E9E" opacity={0.14} />
      <path d={line} fill="none" stroke={INK} strokeWidth={2} />
      {actuals?.map(a => {
        const i = weeks.findIndex(w => w.week === a.week); if (i < 0 || !(a.cups > 0)) return null;
        return <circle key={a.week} cx={X(i)} cy={Y(a.cups * k)} r={4.5} fill={GOLD} stroke="#fff" strokeWidth={2} />;
      })}
      {weeks.map((w, i) => <text key={w.week} x={X(i)} y={H - B + 14} fontSize={10} fill={MUTED} textAnchor="middle">W{w.week}</text>)}

      {weeks.map((w, i) => (
        <rect key={w.week} x={X(i) - bw / 2} y={T} width={bw} height={H - T - B} fill="transparent"
          {...pointProps(i, `Week ${w.week}${w.hype ? ', opening hype' : ''}: base ${int(w.base * k)}, low ${int(w.low * k)}, high ${int(w.high * k)} ${unit}`, setHover)} />
      ))}
      {hover != null && (() => {
        const w = weeks[hover], a = actuals?.find(x => x.week === w.week);
        return <>
          <rect x={X(hover) - bw / 2} y={T} width={bw} height={H - T - B} fill="none" stroke={GOLD} strokeWidth={2} pointerEvents="none" />
          <line x1={X(hover)} x2={X(hover)} y1={T} y2={H - B} stroke={INK} strokeDasharray="3 3" pointerEvents="none" />
          <Tip W={W} x={X(hover)} y={T + 4} lines={[`Week ${w.week}${w.hype ? ' (hype)' : ''}`, `High ${int(w.high * k)} ${unit}`, `Base ${int(w.base * k)}`, `Low ${int(w.low * k)}`,
            ...(a && a.cups > 0 ? [`Observed ${int(a.cups * k)} (synthetic)`] : [])]} />
        </>;
      })()}
    </svg>
    <p className="text-[11px] text-[#5B6E8C] mt-1">{bandNote} · {unit} · line = base · shaded = {pct(coverage)} band at ±{pct(u, 1)} of each week's base{actuals ? ' · gold dots = observed (synthetic)' : ''}.
      The model holds the half-width constant across all weeks; it does not widen with the horizon, so later weeks are probably more uncertain than shown.</p>
    <ChartTable caption={`Weekly forecast, ${unit}`} head={['Week', `Low (${unit})`, 'Base', 'High', ...(actuals ? ['Observed (synthetic)'] : [])]}
      rows={weeks.map(w => { const a = actuals?.find(x => x.week === w.week); return [`W${w.week}${w.hype ? ' (hype)' : ''}`, int(w.low * k), int(w.base * k), int(w.high * k), ...(actuals ? [a && a.cups > 0 ? int(a.cups * k) : '—'] : [])]; })} />
    </div>
  );
};

/* ---------- Provision: expected cost by litres ordered ---------- */
export const CostCurveChart: React.FC<{
  curve: { litres: number; waste: number; shortage: number; total: number }[];
  marks: { litres: number; total: number; label: string; color: string }[];
}> = ({ curve, marks }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  const H = 250, L = 58, R = 14, T = 16, B = 22;
  const xmax = curve[curve.length - 1].litres, ymax = Math.max(...curve.map(c => c.total)) * 1.05;
  const X = (v: number) => L + (W - L - R) * v / xmax, Y = (v: number) => T + (H - T - B) * (1 - v / ymax);
  const pickAt = (el: SVGSVGElement, clientX: number) => {           // nearest curve point to a pointer position
    const r = el.getBoundingClientRect(), x = (clientX - r.left) / r.width * W, l = (x - L) / (W - L - R) * xmax;
    let best = 0;
    curve.forEach((c, i) => { if (Math.abs(c.litres - l) < Math.abs(curve[best].litres - l)) best = i; });
    setHover(x >= L && x <= W - R ? best : null);
  };
  const path = (k: 'waste' | 'shortage' | 'total') => curve.map((c, i) => `${i ? 'L' : 'M'}${X(c.litres).toFixed(1)} ${Y(c[k]).toFixed(1)}`).join('');
  return (
    <div ref={box} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block focus-visible:outline-2 focus-visible:outline-[#B8860B]" role="group" tabIndex={0}
      aria-label="Expected cost of the opening milk order by litres ordered. Use left and right arrow keys to read values, or the data table."
      onKeyDown={e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setHover(h => Math.max(0, Math.min(curve.length - 1, (h ?? Math.floor(curve.length / 2)) + (e.key === 'ArrowRight' ? 1 : -1)))); }
        if (e.key === 'Escape') setHover(null);
      }} onBlur={() => setHover(null)}
      onPointerDown={e => pickAt(e.currentTarget, e.clientX)}
      onMouseMove={e => pickAt(e.currentTarget, e.clientX)} onMouseLeave={() => setHover(null)}>
      {ticks(ymax).map(v => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={GRID} /><text x={L - 6} y={Y(v) + 3.5} fontSize={10} fill={MUTED} textAnchor="end">{sgd0(v)}</text></g>)}
      {ticks(xmax, 6).map(v => <text key={v} x={X(v)} y={H - B + 14} fontSize={10} fill={MUTED} textAnchor="middle">{int(v)}</text>)}

      <path d={path('waste')} fill="none" stroke={COMPONENT_COLOR.labour} strokeWidth={2} strokeDasharray="6 4" />
      <path d={path('shortage')} fill="none" stroke={COMPONENT_COLOR.lost} strokeWidth={2} strokeDasharray="2 3" />
      <path d={path('total')} fill="none" stroke={INK} strokeWidth={2.5} />
      {marks.map((m, i) => (
        <g key={m.label}>
          <line x1={X(m.litres)} x2={X(m.litres)} y1={T} y2={H - B} stroke={m.color} strokeWidth={1.5} strokeDasharray={i ? '4 3' : undefined} />
          <circle cx={X(m.litres)} cy={Y(m.total)} r={6} fill="#fff" stroke={m.color} strokeWidth={3} />
          <text x={X(m.litres) + 6} y={T + 12 + i * 13} fontSize={10.5} fontWeight={700} fill={m.color}>{m.label}</text>
        </g>
      ))}
      {hover != null && (() => {
        const c = curve[hover];
        return <><line x1={X(c.litres)} x2={X(c.litres)} y1={T} y2={H - B} stroke={INK} strokeDasharray="3 3" />
          <Tip W={W} x={X(c.litres)} y={H - B - 70} lines={[`${int(c.litres)} L ordered`, `Total ${sgd0(c.total)}`, `Waste ${sgd0(c.waste)}`, `Shortage ${sgd0(c.shortage)}`]} /></>;
      })()}
    </svg>
    <p className="text-[11px] text-[#5B6E8C] mt-1" aria-live="polite">{hover != null ? `${int(curve[hover].litres)} L: total ${sgd0(curve[hover].total)} (waste ${sgd0(curve[hover].waste)}, shortage ${sgd0(curve[hover].shortage)}).` : 'Litres of fresh milk in the opening order. Hover, tap, or focus the chart and use arrow keys for the expected cost at any size.'}</p>
    <ChartTable caption="Expected cost by order size" head={['Order (L)', 'Waste (SGD)', 'Shortage (SGD)', 'Total (SGD)']}
      rows={[...marks.map(m => [`${m.label}`, '', '', sgd0(m.total)]), ...curve.filter((_, i) => i % 5 === 0).map(c => [int(c.litres), sgd0(c.waste), sgd0(c.shortage), sgd0(c.total)])]} />
    </div>
  );
};

/* ---------- Counter: stacked cost per cup ---------- */
export interface SetupCost { costPerCup: number; perCup: { labour: number; machine: number; lost: number } }
export const CostBars: React.FC<{ setups: Record<string, SetupCost>; winner: string; tie: boolean }> = ({ setups, winner, tie }) => {
  const [hover, setHover] = useState<string | null>(null);
  const keys = ['all_human', 'mixed', 'all_machine'];
  const [box, W] = useWidth();
  const rowH = 46, L = 112, R = 70, T = 6, H = T + keys.length * rowH + 4;
  const xmax = Math.max(...keys.map(k => setups[k].costPerCup)) * 1.05;
  const X = (v: number) => (W - L - R) * v / xmax;
  return (
    <div ref={box} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="group" aria-label="Cost per cup by counter setup, split into labour, machines and lost sales. Tab to each setup, or use the data table.">
      {keys.map((k, i) => {
        const s = setups[k], y = T + i * rowH + 8, segs: [string, number][] = [['labour', s.perCup.labour], ['machine', s.perCup.machine], ['lost', s.perCup.lost]];
        let x0 = L;
        return (
          <g key={k} {...pointProps(i, `${SETUP_LABEL[k]}: ${sgd(s.costPerCup)} per cup (labour ${sgd(s.perCup.labour)}, machines ${sgd(s.perCup.machine)}, lost sales ${sgd(s.perCup.lost)})${k === winner ? (tie ? ', tied' : ', cheapest') : ''}`, v => setHover(v == null ? null : keys[v]))}>
            <text x={L - 8} y={y + 18} fontSize={12} fontWeight={700} fill={INK} textAnchor="end">{SETUP_LABEL[k]}</text>
            {k === winner && <text x={L - 8} y={y + 31} fontSize={9.5} fill={tie ? '#7A5A0E' : '#0B6B60'} textAnchor="end" fontWeight={700}>{tie ? 'tied' : 'cheapest'}</text>}
            {segs.map(([c, v]) => {
              const w = Math.max(0, X(v)), el = w > 0.5 ? <rect key={c} x={x0} y={y} width={Math.max(0, w - 2)} height={26} rx={3} fill={COMPONENT_COLOR[c as keyof typeof COMPONENT_COLOR]} /> : null;
              x0 += w; return el;
            })}
            <text x={x0 + 6} y={y + 18} fontSize={12} fontWeight={700} fill={INK}>{sgd(s.costPerCup)}</text>
            <rect x={0} y={y - 6} width={W} height={rowH - 4} fill="transparent" stroke={hover === k ? GOLD : 'none'} strokeWidth={2} rx={6} />
          </g>
        );
      })}
      {hover && (() => {
        const s = setups[hover], i = keys.indexOf(hover);
        return <Tip W={W} x={W - 110} y={Math.min(T + i * rowH, H - 84)} w={190} lines={[SETUP_LABEL[hover], `Labour ${sgd(s.perCup.labour)}/cup`, `Machines ${sgd(s.perCup.machine)}/cup`, `Lost sales ${sgd(s.perCup.lost)}/cup`, `Total ${sgd(s.costPerCup)}/cup`]} />;
      })()}
    </svg>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#3E5375] mt-1">
      {(['labour', 'machine', 'lost'] as const).map(c => (
        <span key={c} className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COMPONENT_COLOR[c] }} />{c === 'labour' ? 'Labour' : c === 'machine' ? 'Machines' : 'Lost sales'} per cup</span>
      ))}
    </div>
    <ChartTable caption="Cost per cup by setup (SGD)" head={['Setup', 'Labour', 'Machines', 'Lost sales', 'Total']}
      rows={keys.map(k => [SETUP_LABEL[k], sgd(setups[k].perCup.labour), sgd(setups[k].perCup.machine), sgd(setups[k].perCup.lost), sgd(setups[k].costPerCup)])} />
    </div>
  );
};

/* ---------- Review: pipeline avoided cost by opening volume ---------- */
export interface PipelineBar { cupsPerDay: number; share: number; openings: number; perOpening: number; total: number; cheapest: string }
export const PipelineChart: React.FC<{ bars: PipelineBar[]; standard: string; lo: number; hi: number }> = ({ bars, standard, lo, hi }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  const H = 200, L = 58, R = 12, T = 14, B = 22;
  const v0 = bars[0].cupsPerDay, v1 = bars[bars.length - 1].cupsPerDay, pad = 22;
  const X = (v: number) => L + pad + (W - L - R - 2 * pad) * (v - v0) / (v1 - v0);
  const ymax = Math.max(1000, ...bars.map(b => b.total)) * 1.15, Y = (v: number) => T + (H - T - B) * (1 - v / ymax);
  const bw = (W - L - R) / bars.length * 0.62;
  return (
    <div ref={box} className="w-full min-w-0 overflow-hidden">
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="group" aria-label="Illustrative avoided cost by opening volume. Tab to each volume, or use the data table.">
      <rect x={X(lo)} y={T} width={Math.max(2, X(hi) - X(lo))} height={H - T - B} fill="#FDF5E1" />
      {ticks(ymax, 3).map(v => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={GRID} /><text x={L - 6} y={Y(v) + 3.5} fontSize={10} fill={MUTED} textAnchor="end">{sgdK(v)}</text></g>)}
      {bars.map((b, i) => {
        const on = b.share > 0, h = Math.max(0, Y(0) - Y(b.total));
        return (
          <g key={i} {...pointProps(i, `${int(b.cupsPerDay)} cups/day: cheapest ${SETUP_LABEL[b.cheapest]}; ${b.openings.toFixed(1)} openings; ${sgdK(b.total)} a year`, setHover)}>
            {on && b.total > 0.5 ? <rect x={X(b.cupsPerDay) - bw / 2} y={Y(b.total)} width={bw} height={h} rx={3} fill={SETUP_COLOR[b.cheapest]} />
              : <rect x={X(b.cupsPerDay) - bw / 2} y={Y(0) - 2} width={bw} height={2} fill={on ? '#9AA3AF' : '#E5E7EB'} />}
            <text x={X(b.cupsPerDay)} y={H - B + 13} fontSize={9.5} fill={on ? MUTED : '#C5CAD3'} textAnchor="middle">{int(b.cupsPerDay)}</text>
            <rect x={X(b.cupsPerDay) - bw / 2 - 3} y={T} width={bw + 6} height={H - T - B} fill="transparent" stroke={hover === i ? GOLD : 'none'} strokeWidth={2} rx={4} />
          </g>
        );
      })}

      {hover != null && (() => {
        const b = bars[hover];
        return <Tip W={W} x={X(b.cupsPerDay)} y={T} w={220} lines={[`${int(b.cupsPerDay)} cups/day`, `Cheapest: ${SETUP_LABEL[b.cheapest]}`, `Standard (${SETUP_LABEL[standard]}) costs ${sgd0(b.perOpening)} more/store/yr`, `${b.openings.toFixed(1)} openings here → ${sgdK(b.total)}/yr`]} />;
      })()}
    </svg>
    <p className="text-[11px] text-[#5B6E8C] mt-1">Steady cups/day at opening · bar colour = cheapest counter at that volume · shaded = your volume range.</p>
    <ChartTable caption="Illustrative avoided cost by opening volume" head={['Cups/day', 'Cheapest counter', 'Openings/year', `Standard (${SETUP_LABEL[standard]}) extra cost per store/yr`, 'Total/yr']}
      rows={bars.map(b => [int(b.cupsPerDay), SETUP_LABEL[b.cheapest], b.openings.toFixed(1), sgd0(b.perOpening), sgdK(b.total)])} />
    </div>
  );
};

export const Legend: React.FC<{ items: { label: string; color: string; dash?: string }[] }> = ({ items }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#3E5375]">
    {items.map(i => (
      <span key={i.label} className="inline-flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden><line x1="0" x2="18" y1="4" y2="4" stroke={i.color} strokeWidth="2.5" strokeDasharray={i.dash} /></svg>{i.label}
      </span>
    ))}
  </div>
);
