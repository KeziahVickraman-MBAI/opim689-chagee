/* Overview: the deck's Context slide. One new store with no local sales history, the three layers (proposed AI,
 * what this prototype calculates, who decides), and where AI enters each step of an opening. */
import React, { useRef, useState } from 'react';
import { ArrowRight, Box, Smartphone, TrendingUp, Users } from 'lucide-react';
import { A } from '../model/ctx';
import { AI_STEPS } from '../content/deck';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { Card, int, pct } from '../ui/kit';

const GATES = [
  { id: 'predict', n: 1, name: 'Predict', when: 'Before committing the site', out: 'A demand estimate for the whole store: a range to test, back-tested on past openings.' },
  { id: 'provision', n: 2, name: 'Provision', when: 'Before the first order', out: 'An opening inventory and replenishment plan, item by item; fresh milk sized with newsvendor logic.' },
  { id: 'counter', n: 3, name: 'Counter', when: 'Before fit-out', out: 'A counter compared on demand and local costs, all inputs together; a candidate to pilot.' },
  { id: 'review', n: 4, name: 'Review', when: 'After opening', out: 'Compare sales, stockouts, waste and service with the plan; rerun with observed inputs.' },
] as const;

export const Overview: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const [step, setStep] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = AI_STEPS[step];
  const points: { I: typeof TrendingUp; t: string; b: React.ReactNode }[] = [
    { I: TrendingUp, t: 'Why it matters for Chagee', b: <>{int(A.facts.overseas_stores.value)} overseas stores in {A.facts.overseas_markets.value} markets and about {int(A.benefit.overseas_stores_per_year.value)} openings planned a year; each commits stock and a counter before local sales exist.</> },
    { I: Smartphone, t: 'Proposed AI (not built here)', b: 'Forecast the whole store’s demand from comparable stores, cross-checked by pre-launch app sign-ups, and validate it against actual sales.' },
    { I: Box, t: 'What this prototype calculates', b: 'Synthetic inputs: a demand range, one inventory worked example (fresh milk) and a counter simulation. Tea, other ingredients and packaging are planned qualitatively. No trained model.' },
    { I: Users, t: 'Who decides', b: 'People: teams set the inventory plan and choose the counter from these outputs and local constraints.' },
  ];
  const onKey = (e: React.KeyboardEvent, k: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -k : e.key === 'End' ? AI_STEPS.length - 1 - k : 0;
    if (!d) return;
    e.preventDefault();
    const n = (k + d + AI_STEPS.length) % AI_STEPS.length;
    setStep(n); tabs.current[n]?.focus();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[#0A2558] text-white p-5 sm:p-7 border border-[#1A3D80]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3DE96]">Context and problem</div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1 leading-tight">One new store, no local sales history: estimate demand, plan the inventory, choose a counter, then update</h1>
        <p className="font-serif-body text-[15px] text-[#DCE7F8] mt-3 max-w-4xl">
          We are opening a store with no local sales history. We need to estimate demand, translate that demand into an inventory plan, choose a counter
          configuration, and update those decisions after opening.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {points.map(({ I, t, b }) => (
          <section key={t} className="min-w-0 bg-white rounded-2xl p-4 border border-[#E3DCC8]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-7 h-7 rounded-lg bg-[#FBF3DC] text-[#8A6715] flex items-center justify-center" aria-hidden><I className="w-4 h-4" /></span>
              <h2 className="text-sm font-bold text-[#0A2146]">{t}</h2>
            </div>
            <p className="text-xs text-[#3E5375] leading-relaxed">{b}</p>
          </section>
        ))}
      </div>

      <Card kicker="Interactive explainer" title="Where AI enters a new store's opening">
        <p className="text-xs text-[#5B6E8C] -mt-2 mb-3">Choose a step. &ldquo;Today&rdquo; is the deck&rsquo;s reading of public sources and one industry conversation, not a Chagee statement.</p>
        <div role="tablist" aria-label="Steps of a new store's opening" className="flex flex-wrap items-center gap-1.5">
          {AI_STEPS.map((x, k) => (
            <React.Fragment key={x.id}>
              <button ref={el => { tabs.current[k] = el; }} role="tab" id={`aistep-${x.id}`} aria-selected={k === step} aria-controls="aistep-panel"
                tabIndex={k === step ? 0 : -1} onClick={() => setStep(k)} onKeyDown={e => onKey(e, k)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition ${k === step ? 'bg-[#0A2558] text-white border-[#0A2558]' : 'bg-white text-[#0A2146] border-[#D9D1BC] hover:bg-[#FBF8F1]'}`}>
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center ${k === step ? 'bg-[#D4AF37] text-[#0A2146]' : 'bg-[#EEF2F8]'}`}>{k + 1}</span>{x.name}
              </button>
              {k < AI_STEPS.length - 1 && <span className="text-[#B8A983]" aria-hidden>→</span>}
            </React.Fragment>
          ))}
        </div>
        <div id="aistep-panel" role="tabpanel" aria-labelledby={`aistep-${s.id}`} className="mt-3 rounded-xl border border-[#ECE5D3] bg-[#FBF8F1] p-4">
          <h3 className="font-bold text-[#0A2146]">{step + 1} · {s.name}</h3>
          <dl className="mt-2 grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-[#6B7C99] pt-0.5">Today</dt><dd className="text-[#2D496E]">{s.today}</dd>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-[#6B7C99] pt-0.5">What AI adds</dt><dd className="text-[#0047BA] font-semibold">{s.aiAdds}</dd>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-[#6B7C99] pt-0.5">Who decides</dt><dd className="text-[#2D496E]">{s.who}</dd>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-[#6B7C99] pt-0.5">In this app</dt>
            <dd><button onClick={() => store.setSection(s.section)} className="inline-flex items-center gap-1 text-[#0047BA] font-semibold hover:underline">{s.where}<ArrowRight className="w-3.5 h-3.5" aria-hidden /></button></dd>
          </dl>
        </div>
      </Card>

      <Card kicker="Four gates" title="Predict → Provision → Counter → Review">
        <p className="text-sm text-[#2D496E] -mt-2 mb-3">Scope: the whole store. Each gate states the decision, its evidence, a suggested action, the trade-off and what the model cannot establish.
          Figures are illustrative assumptions.</p>
        <ol className="grid gap-3 md:grid-cols-4">
          {GATES.map(g => (
            <li key={g.id} className="min-w-0">
              <button onClick={() => store.setSection(g.id)} className="w-full h-full text-left rounded-xl border border-[#E3DCC8] bg-white p-3 hover:border-[#0A2558] transition">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">{g.n} · {g.when}</div>
                <div className="font-display font-bold text-[#0A2146]">{g.name}</div>
                <p className="text-xs text-[#3E5375] mt-1">{g.out}</p>
              </button>
            </li>
          ))}
        </ol>
        <p className="text-xs text-[#5B6E8C] mt-3">Current scenario “{store.active.name}”: {int(an.pr.steadyCupsPerDay)} steady cups/day, ±{pct(an.pr.u, 1)} range; first milk delivery {int(an.prov.recommended.litres)} L.</p>
      </Card>
    </div>
  );
};
