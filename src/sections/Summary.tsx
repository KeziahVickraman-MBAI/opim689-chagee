/* Printable decision summary: readable without interaction. Printed from any section (print CSS hides the rest). */
import React from 'react';
import { A, D, MODEL_VERSION, SOURCE } from '../model/ctx';
import { inputMeta, modelFacts, SETUP_LABEL, SETUPS } from '../model/engine.js';
import { changedInputs, type ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { int, pct, num, sgd, sgd0, sgdK, secToMin } from '../ui/kit';
import { fmtLever, leverDistance, verdictText } from './Counter';
import { similarityIndex } from '../data/markets';

const META: Record<string, any> = inputMeta(A);
const FACTS = modelFacts({ A, D });

export const LIMITATIONS = [
  'All inputs are illustrative assumptions (assumptions.json) or synthetic; none are Chagee figures.',
  'Band narrowing with member signal is an assumed straight line, not an estimated relationship; back-test before use.',
  'Tourist and non-app demand is not modelled unless an add-on is entered.',
  `Staffing uses a pooled bucket-brigade formula that misses its Week 5 validation (${FACTS.week5.gaps.map((g: number) => num(g, 1) + '%').join(', ')} vs ±${FACTS.week5.tolerancePct}%).`,
  'Machine breakdowns are not modelled, which flatters automation.',
  'Milk replenishment within the stock horizon and carry-over past expiry are not modelled.',
  'Thresholds are one-at-a-time sensitivities; live thresholds use 20 simulated stores and are estimates.',
  'Avoided cost is modelled against a named standard counter, not a demonstrated saving; no payback is computed (no cash-flow model).',
];

const H: React.FC<{ n: string; t: string }> = ({ n, t }) => (
  <h3 className="mt-5 mb-2 text-sm font-bold uppercase tracking-wider text-[#0A2146] border-b-2 border-[#D4AF37] pb-1 break-after-avoid">{n} · {t}</h3>
);
const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <tr className="border-b border-[#EEE7D6] align-top"><th className="text-left font-semibold py-1 pr-4 w-[38%] text-[#3E5375]">{k}</th><td className="py-1">{v}</td></tr>
);

export const Summary: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const sc = store.active, i = sc.inputs, pr = an.pr, p = an.prov, c = an.counter.data, th = an.thresholds.data, bn = an.benefit.data;
  const changed = changedInputs(sc);
  const vt = verdictText(c);
  const pending = an.overall !== 'current';
  const nearest = th ? [...th].filter(t => t.x != null).sort((a, b) => leverDistance(a) - leverDistance(b)).slice(0, 3) : [];

  return (
    <article className="bg-white rounded-2xl border border-[#E3DCC8] p-6 sm:p-8 text-[13px] text-[#0F2137] print:border-0 print:p-0 print:rounded-none max-w-4xl mx-auto">
      <div className="border-b-2 border-[#0A2558] pb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">Chagee Expansion Lab · decision summary · illustrative prototype, synthetic data</div>
        <h2 className="font-display text-2xl font-bold text-[#0A2146] mt-1">{sc.name}</h2>
        <div className="text-xs text-[#3E5375] mt-1 space-x-3">
          <span>Target: {store.targetMarket.name}</span><span>Benchmark: {store.benchmarkMarket.name}</span>
          <span>Currency: SGD</span><span>Printed {new Date().toLocaleString('en-SG')}</span>
        </div>
        <div className="text-xs text-[#3E5375] mt-0.5">
          Model: {MODEL_VERSION} (sim.js and assumptions.json vendored unchanged{SOURCE.deckDirty ? '; deck had uncommitted changes' : ''}) ·
          Data status: {sc.origin === 'observed' ? 'observed inputs applied (entered by hand)' : changed.length ? `${changed.length} inputs changed from deck defaults` : 'deck defaults'}
          {sc.actualsSynthetic ? ' · Review uses the synthetic example' : ''}
        </div>
      </div>

      {pending && (
        <p className="mt-3 rounded border border-[#EAD8AC] bg-[#FDF5E1] px-3 py-2 text-xs text-[#6B4E0B]">
          Some results are still computing{an.overall === 'stale' ? '; figures marked with † are from the previous inputs' : ''}. Wait for “Up to date” before printing.
        </p>
      )}

      <H n="Recommendation" t="Opening decisions at a glance" />
      <table className="w-full"><tbody>
        <Row k="Gate 1 · Predict (before committing the site)" v={<>Steady demand <b>{int(pr.steadyCupsPerDay)} cups/day</b>, 80% band {int(pr.steady.low / 7)}–{int(pr.steady.high / 7)} (±{pct(pr.u, 1)}); opening weeks about {int(pr.opening.base / 7)} cups/day for {pr.hypeWeeks} weeks.</>} />
        <Row k="Gate 2 · Provision (before the first order)" v={<>Order <b>{int(p.recommended.litres)} L</b> fresh milk for {p.horizon} days; expected cost {sgd0(p.recommended.total)} (waste {sgd0(p.recommended.waste)}, shortage {sgd0(p.recommended.shortage)}).</>} />
        <Row k="Gate 3 · Counter (before fit-out)" v={vt ? <><b>{vt.head}</b>{an.counter.status !== 'current' && ' †'}: {vt.sub}.</> : 'computing'} />
        <Row k="Gate 4 · Review (after opening)" v={<>Measure steady volume after the hype, then rerun the counter on observed inputs. Comparator: {SETUP_LABEL[i.standardSetup]} standard counter.</>} />
      </tbody></table>

      <H n="1" t="Predict" />
      <table className="w-full"><tbody>
        <Row k="Base steady demand" v={`${int(i.baseCupsPerDay)} cups/day (proxy from existing stores)`} />
        <Row k="Member uplift · tourist add-on" v={`${i.memberDataAvailable ? `${i.memberUpliftPct}%` : 'n/a (no member data)'} · ${i.touristUpliftPct}%${i.touristUpliftPct ? '' : ' (blind spot, not modelled)'}`} />
        <Row k="Uncertainty" v={`±${pct(pr.u, 1)} 80% half-width; ${pr.uSource === 'observed' ? 'from observed weeks' : pr.uSource === 'signal' ? `assumed signal strength ${pct(i.signalStrength)}` : 'no member signal'}`} />
        <Row k="Weekly band handed on" v={`${int(pr.handed.low)} – ${int(pr.handed.base)} – ${int(pr.handed.high)} cups/week (${i.removeHype ? 'steady' : 'with hype'})`} />
        <Row k="Members" v={i.memberDataAvailable ? `${int(pr.uniqueMembers)} unique (overlap removed); member-implied ${int((pr.memberImpliedWeek ?? 0) / 7)} cups/day at ${pct(i.conversionShare)} conversion — a cross-check, not a forecast` : 'No member data for this market'} />
        <Row k="Similarity (heuristic index)" v={`${num(similarityIndex(sc.factors), 1)} / 100 — not a probability or accuracy measure`} />
      </tbody></table>

      <H n="2" t="Provision" />
      <table className="w-full"><tbody>
        <Row k="Recommended order" v={`${int(p.recommended.litres)} L (${num(p.recommended.days, 1)} days of ${p.basis === 'steady' ? 'steady' : 'opening'} demand, ${int(p.daily)} cups/day × ${num(p.milkPerCup, 2)} L/cup)`} />
        <Row k="Rule" v={`Order until the expected waste cost of another litre (${sgd(p.wasteCost)}) equals the shortage cost it avoids (${sgd(p.shortCostPerLitre)}/L): the ${pct(p.criticalRatio)} point of demand.`} />
        <Row k="Expected cost: recommended vs base order" v={`${sgd0(p.recommended.total)} vs ${sgd0(p.naive.total)} (ordering ${int(p.naive.litres)} L)`} />
        <Row k="Horizon · shelf life" v={`${p.horizon} days · ${i.milkShelfLife} days; replenishment not modelled`} />
        {p.flags.length > 0 && <Row k="Flags" v={<ul className="list-disc pl-4">{p.flags.map((f: string) => <li key={f}>{f}</li>)}</ul>} />}
        <Row k="Tea and packaging" v="Shelf-stable; ordered separately (grams and units per cup not available)." />
      </tbody></table>

      <H n="3" t="Counter" />
      {c ? <>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left border-b border-[#0A2558]"><th className="py-1">Setup</th><th>Cost/cup</th><th>Labour · machine · lost</th><th>Peak serve median · p90</th><th>Lost orders (day · peak)</th><th>Peak util.</th></tr></thead>
          <tbody>{SETUPS.map(k => {
            const s = c.setups[k];
            return <tr key={k} className="border-b border-[#EEE7D6]"><td className="py-1 font-semibold">{SETUP_LABEL[k]}{k === c.verdict.winner ? ' ★' : ''}</td><td>{sgd(s.costPerCup)}</td>
              <td>{sgd(s.perCup.labour)} · {sgd(s.perCup.machine)} · {sgd(s.perCup.lost)}</td><td>{secToMin(s.serve.median)} · {secToMin(s.serve.p90)}</td>
              <td>{pct(s.lostShare, 1)} · {pct(s.peakLostShare, 1)}</td><td>{pct(s.peakUtilisation)}</td></tr>;
          })}</tbody>
        </table></div>
        <table className="w-full mt-2"><tbody>
          <Row k="Inputs" v={`${int(pr.steadyCupsPerDay)} cups/day, ±${pct(pr.u, 1)}, ${i.surge} surge, wage ${sgd(i.wage)}/h, machine ${sgd0(i.machineMonth)}/unit/month, ${pct(i.newShare)} new staff`} />
          <Row k="Verdict rule" v={`Cheapest cost per cup with all inputs together, ${c.draws} simulated stores; tie if within ${sgd(c.tol)} a cup.`} />
          <Row k="Nearest one-variable thresholds" v={nearest.length ? nearest.map(t => `${t.label} ${fmtLever(t.lever, t.x!)} (now ${fmtLever(t.lever, t.now)})`).join('; ') : 'No crossover in tested ranges'} />
          <Row k="Confidence" v={`Close call when the margin is a few cents. Staffing formula fails its Week 5 check; breakdowns not modelled.`} />
        </tbody></table>
      </> : <p>Computing…</p>}

      <H n="4" t="Review and benefit" />
      <table className="w-full"><tbody>
        <Row k="Comparator" v={`${SETUP_LABEL[i.standardSetup]} counter at every store${i.standardSetup === 'mixed' ? ' (modelled stand-in for Chagee’s semi-automated counter)' : ''}`} />
        <Row k="Illustrative avoided cost, recurring, this store" v={bn.recurring ? (bn.recurring.withinTolerance ? 'Within tie tolerance (≈ 0)' : `${sgd0(bn.recurring.perStoreYear)} a year (${SETUP_LABEL[bn.recurring.selected]} vs standard; ${sgd(bn.recurring.perCup, 3)}/cup × ${int(bn.recurring.cupsPerDay)} cups/day × ${bn.days} days)`) : 'computing'} />
        <Row k="Illustrative avoided cost, recurring, pipeline" v={bn.pipeline ? `${sgdK(bn.pipeline.total)} a year: ${int(bn.pipeline.openings)} openings evenly spread over ${int(bn.pipeline.lo)}–${int(bn.pipeline.hi)} cups/day, cheapest counter per volume` : 'computing'} />
        <Row k="One-time, opening stock" v={bn.oneTime ? `${sgd0(bn.oneTime.perOpeningVsNaive)} per opening vs ordering the base; signal value ${sgd0(bn.oneTime.perOpeningSignal)} per opening` : '—'} />
        <Row k="Not reported" v="Payback / break-even week: no complete cash-flow model (capex, rent, franchise terms)." />
      </tbody></table>

      <H n="Inputs" t="All scenario inputs" />
      <div className="overflow-x-auto"><table className="w-full text-[11px]">
        <thead><tr className="text-left border-b border-[#0A2558]"><th className="py-1">Input</th><th>Value</th><th>Unit</th><th>Source</th></tr></thead>
        <tbody>{Object.keys(META).map(k => {
          const m = META[k], val = i[k as keyof typeof i], ch = changed.includes(k as keyof typeof i);
          return <tr key={k} className={`border-b border-[#F3EEE2] ${ch ? 'font-semibold' : ''}`}><td className="py-0.5">{m.label}{ch ? ' (changed)' : ''}</td><td>{typeof val === 'number' ? num(val, Math.abs(val) < 10 ? 2 : 0) : String(val)}</td><td>{m.unit}</td><td className="text-[#5B6E8C]">{m.source}</td></tr>;
        })}
          <tr className="border-b border-[#F3EEE2]"><td className="py-0.5">Surge · standard · selected</td><td>{i.surge} · {i.standardSetup} · {i.selectedSetup}</td><td></td><td className="text-[#5B6E8C]">scenario</td></tr>
        </tbody>
      </table></div>
      <p className="text-[11px] text-[#5B6E8C] mt-1">USD-approved assumptions converted at {FACTS.fx} SGD per USD (assumptions.json _meta). {FACTS.currency}.</p>

      <H n="Limits" t="Remaining model limitations" />
      <ul className="list-disc pl-5 space-y-0.5 text-xs">{LIMITATIONS.map(l => <li key={l}>{l}</li>)}</ul>
    </article>
  );
};
