import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { A } from '../model/ctx';
import { ctx } from '../model/ctx';
import { inputMeta, membershipComparison, SETUPS, SETUP_LABEL } from '../model/engine.js';
import { NEW_MARKETS, EXISTING_MARKETS, FACTOR_CONFIGS, pairBaseline, similarityIndex, PAIR_GAP_PENALTY } from '../data/markets';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { Card, DecisionFrame, Explain, Flag, NumberField, Segmented, Slider, Stat, int, pct, num, sgd0 } from '../ui/kit';
import { ForecastChart } from '../ui/charts';

const META = inputMeta(A);

export const Predict: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const { active: sc, setInput, setInputs, update, targetMarket, benchmarkMarket } = store;
  const i = sc.inputs, pr = an.pr;
  const [perDay, setPerDay] = useState(false);
  const sim = useMemo(() => similarityIndex(sc.factors), [sc.factors]);
  const baseline = useMemo(() => pairBaseline(targetMarket, benchmarkMarket), [targetMarket, benchmarkMarket]);
  const edited = FACTOR_CONFIGS.some(c => sc.factors[c.id] !== baseline[c.id]);
  const cmp = useMemo(() => membershipComparison(ctx, i), [i]);
  const narrowing = pr.uNone - pr.u;
  const memberDaily = pr.memberImpliedWeek != null ? pr.memberImpliedWeek / 7 : null;

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 1 · Predict" when="Before committing the site" roles={['entry', 'crm']}
        decision="What demand should the whole store's inventory and counter planning assume?"
        evidence={[
          ['Base', `${int(pr.handed.base)} cups/week`],
          [`${pct(pr.coverage)} range`, `${int(pr.handed.low)}–${int(pr.handed.high)}`],
          ['Half-width', `±${pct(pr.u, 1)}`],
          ['Similarity (heuristic)', `${num(sim, 1)} / 100`],
        ]}
        action={<>Plan on about <b className="text-white">{int(pr.handed.base)} cups a week</b> ({int(pr.handed.base / 7)} a day), within an illustrative {pct(pr.coverage)} range
          of {int(pr.handed.low)} to {int(pr.handed.high)}; treat it as an assumption to test.
          {' '}Opening weeks run at about {int(pr.opening.base / 7)} cups a day for {pr.hypeWeeks} weeks.</>}
        tradeoff="Plan too low: stockouts, queues and lost sales. Plan too high: stock that expires or ties up cash, and machines or staff that sit idle."
        limitation="The range is assumed, not calibrated, and demand can fall outside it. It cannot approve a site or show that a store is viable. Similarity is a heuristic index, not a probability or accuracy measure."
        actions={[
          ['crm', 'Before the site is committed, open a pre-launch waitlist and tag each sign-up as new or already a Chagee member in another market.'],
          ['entry', 'Set the base from comparable stores; use sign-ups only to cross-check it. Send the range to Provision and Counter.'],
          ['entry', 'Widen the range where tourists or walk-ups matter, and back-test it on recent openings before narrowing it.'],
        ]}
        calc={[
          `Base = an assumed comparable-store volume, ${int(A.store.cups_per_store_per_year.value)} cups a year over ${A.store.open_days_per_year.value} open days (synthetic), × member uplift × tourist add-on (both 0% by default).`,
          `Range = base ± the half-width. The half-width moves in a straight line from ±${pct(pr.uNone)} with no signal to ±${pct(pr.uStrong)} with a strong one: an assumption to test, not evidence that membership data improves accuracy.`,
          'Proposed AI (not built here): a model trained on existing stores would set the base, with sign-ups as a cross-check. In this prototype the base is assumed.',
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- market matching ---------------- */}
        <Card kicker="Step 1 · Market matching" title="Target and benchmark market"
          right={<button onClick={store.resetFactors} disabled={!edited} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0047BA] hover:underline disabled:opacity-40 disabled:no-underline"><RotateCcw className="w-3.5 h-3.5" aria-hidden />Reset to pair baseline</button>}>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[#0A2146]">Target market (new store)
              <select value={sc.targetMarketId} onChange={e => store.setTargetMarket(NEW_MARKETS.find(m => m.id === e.target.value)!)}
                className="mt-1 w-full rounded-lg border border-[#D9D1BC] bg-white px-2 py-1.5 text-sm font-normal">
                {NEW_MARKETS.map(m => <option key={m.id} value={m.id}>{m.flag} {m.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#0A2146]">Benchmark market (existing stores)
              <select value={sc.benchmarkMarketId} onChange={e => store.setBenchmarkMarket(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D9D1BC] bg-white px-2 py-1.5 text-sm font-normal">
                {EXISTING_MARKETS.map(m => <option key={m.id} value={m.id}>{m.flag} {m.name}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs text-[#5B6E8C] mt-2">{targetMarket.marketContext} Benchmark: {benchmarkMarket.storeFormat}; {benchmarkMarket.notes}</p>
          <Flag tone="info" className="mt-2">
            Synthetic market-pair factors: each market has an invented 0–100 profile, and a pair's baseline factor is
            100 − {PAIR_GAP_PENALTY} × the profile gap. Changing either market reloads that pair's baseline; edits are yours to make and Reset restores the pair.
          </Flag>

          <div className="mt-4 space-y-3">
            {FACTOR_CONFIGS.map(c => (
              <Slider key={c.id}
                meta={{ label: `${c.name} · weight ${c.weightLabel}`, unit: '0–100, 100 = alike', range: [0, 100], step: 1, source: 'synthetic market-pair factor (app assumption)', rationale: c.description }}
                value={sc.factors[c.id]}
                onChange={x => update({ factors: { ...sc.factors, [c.id]: x } })}
                hint={<>{c.description} Pair baseline {baseline[c.id]}{sc.factors[c.id] !== baseline[c.id] ? ' (edited)' : ''}.</>} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-[#FBF8F1] border border-[#ECE5D3] p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0A2146] tabular-nums">{num(sim, 1)}</div>
              <div className="text-[10px] uppercase tracking-wide text-[#6B7C99]">of 100</div>
            </div>
            <div className="text-xs text-[#3E5375]">
              <b>Heuristic similarity index.</b> A weighted score to help choose a benchmark. It is not a probability, a forecast
              accuracy or a validated confidence measure, and it does not change any number in the model.
              {sim < 65 && <span className="block mt-1 text-[#7A5A0E]">Low match: treat the benchmark's volume as a weak proxy and keep the band wide (lower signal strength).</span>}
            </div>
          </div>
        </Card>

        {/* ---------------- membership signal ---------------- */}
        <Card kicker="Step 2 · Pre-launch member signal" title="Membership and waitlist">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0A2146]">
            <input type="checkbox" checked={i.memberDataAvailable} onChange={e => setInput('memberDataAvailable', e.target.checked)} className="w-4 h-4 accent-[#0A2558]" />
            Member data available for this market
          </label>
          {!i.memberDataAvailable && (
            <Flag className="mt-2">No member signal: the band uses the no-signal width (±{pct(pr.uNone)}), and member uplift is ignored. Missing data is not filled in.</Flag>
          )}
          <fieldset disabled={!i.memberDataAvailable} className={`mt-3 space-y-3 ${i.memberDataAvailable ? '' : 'opacity-50'}`}>
            <legend className="sr-only">Member signal inputs</legend>
            <p className="text-xs text-[#5B6E8C]">Registrations and waitlist sign-ups can be the same people, and neither guarantees a purchase.</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="App pre-registrations" unit="people" value={i.preRegistrations} min={0} step={100} onChange={x => setInput('preRegistrations', x)} />
              <NumberField label="Waitlist sign-ups" unit="people" value={i.waitlist} min={0} step={100} onChange={x => setInput('waitlist', x)} />
            </div>
            <Slider meta={META.overlapShare} value={i.overlapShare} onChange={x => setInput('overlapShare', x)} format={x => pct(x)} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Unique members" value={int(pr.uniqueMembers)} sub="registrations + waitlist, overlap removed" />
              <Stat label="Member-implied demand" value={memberDaily != null ? `${int(memberDaily)} cups/day` : '—'}
                sub={memberDaily != null ? `${pct(memberDaily / pr.baseCupsPerDay)} of base · a cross-check only` : 'no member data'} />
            </div>
            <Slider meta={META.conversionShare} value={i.conversionShare} onChange={x => setInput('conversionShare', x)} format={x => pct(x)} />
            <Slider meta={META.cupsPerMemberWeek} value={i.cupsPerMemberWeek} onChange={x => setInput('cupsPerMemberWeek', x)} />
            <div className="pt-2 border-t border-[#ECE5D3] space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A6715]">Illustrative assumptions, not validated statistical effects</div>
              <Slider meta={META.signalStrength} value={i.signalStrength} onChange={x => setInputs({ signalStrength: x, uOverride: null })}
                format={x => pct(x)} hint={<>Assumed straight line from ±{pct(pr.uNone)} (no signal) to ±{pct(pr.uStrong)} (strong signal, the floor).</>} />
              <div className="rounded-lg bg-[#FBF8F1] border border-[#ECE5D3] px-3 py-2 text-xs text-[#2D496E]" role="status">
                Uncertainty applied: <b>±{pct(pr.u, 1)}</b>, which is {pct(narrowing, 1).replace('%', '')} points ({pct(narrowing / pr.uNone)}) narrower than with no signal.
                {pr.uSource === 'observed' ? ' The band now comes from observed weeks, not from this slider.' : i.signalStrength >= 1 ? ' At the floor: the band cannot narrow further, because tourist and non-app demand stay invisible.' : ''}
              </div>
              <Slider meta={META.memberUpliftPct} value={i.memberUpliftPct} onChange={x => setInput('memberUpliftPct', x)} format={x => `${x > 0 ? '+' : ''}${x}%`}
                hint={`Limited to ${META.memberUpliftPct.range[0]}% to +${META.memberUpliftPct.range[1]}% of base; default 0%.`} />
            </div>
          </fieldset>
          <Explain title="How the signal inputs work: weights, limits and floor" className="mt-3">
            <p><b>No weighted signal index.</b> Counts are not combined into a score with weights or normalisation caps (the earlier prototype's 45/25/30 index with
              50,000 and 25,000 caps was removed). Signal strength is one input you set directly, from 0 to 1.</p>
            <p><b>Band:</b> half-width = {pct(pr.uNone)} − strength × ({pct(pr.uNone)} − {pct(pr.uStrong)}). The floor is ±{pct(pr.uStrong)} at full strength (assumptions.json
              demand.uncertainty_strong_signal). The figure shown above is the value actually used, after the floor.</p>
            <p><b>Uplift:</b> a percentage of base demand, limited to {META.memberUpliftPct.range[0]}%…+{META.memberUpliftPct.range[1]}%, default 0. It is not derived from member counts.</p>
            <p><b>Unique members</b> = pre-registrations + waitlist × (1 − overlap). <b>Member-implied demand</b> = unique members × conversion × cups per member per week ÷ 7, a cross-check only.</p>
          </Explain>
          <Explain title="Why sign-ups do not raise the forecast by themselves" className="mt-2">
            <p>A sign-up is interest, not a purchase, and one person can appear in both lists. The member-implied figure
              (unique members × conversion × cups per member) is shown beside the base so a planner can judge it; it only
              moves the forecast through the uplift you set, which defaults to 0%.</p>
            <p>More signal is assumed to narrow the band, not to make it accurate. Whether member data actually narrows the band is the
              thing the back-test must show (deck: "a method to test, not a result").</p>
          </Explain>
        </Card>
      </div>

      {/* ---------------- with / without member signal ---------------- */}
      <Card kicker="Same market pair and scenario" title="With and without the member signal">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Demand, uncertainty, opening milk order and planned staffing with and without the member signal</caption>
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
              <th scope="col" className="py-1.5 pr-3">Output</th><th scope="col" className="pr-3">Without signal</th><th scope="col" className="pr-3">With signal</th><th scope="col">Change</th>
            </tr></thead>
            <tbody>
              {(() => {
                const w = cmp.with, o = cmp.without;
                const row = (k: string, a: string, b: string | null, d: string | null) => (
                  <tr key={k} className="border-b border-[#F3EEE2]"><th scope="row" className="py-1.5 pr-3 text-left font-semibold text-[#0A2146]">{k}</th>
                    <td className="pr-3 tabular-nums">{a}</td><td className="pr-3 tabular-nums">{b ?? '—'}</td><td className="tabular-nums">{d ?? '—'}</td></tr>
                );
                const dv = (x: number, f: (v: number) => string) => (Math.abs(x) < 1e-9 ? 'no change' : `${x > 0 ? '+' : '−'}${f(Math.abs(x))}`);
                return [
                  row('Steady demand (cups/day)', int(o.steadyCupsPerDay), w && int(w.steadyCupsPerDay), w && dv(w.steadyCupsPerDay - o.steadyCupsPerDay, int)),
                  row('Uncertainty (80% half-width)', `±${pct(o.u, 1)}`, w && `±${pct(w.u, 1)}`, w && dv((w.u - o.u) * 100, v => `${num(v, 1)} pts`)),
                  row('Band (cups/day)', `${int(o.low)}–${int(o.high)}`, w && `${int(w.low)}–${int(w.high)}`, null),
                  row('Opening milk order', `${int(o.milkLitres)} L`, w && `${int(w.milkLitres)} L`, w && dv(w.milkLitres - o.milkLitres, v => `${int(v)} L`)),
                  row('Expected stock cost (waste + shortage)', sgd0(o.stockCost), w && sgd0(w.stockCost), w && dv(w.stockCost - o.stockCost, sgd0)),
                  ...SETUPS.map(k => row(`Planned staff at peak, ${SETUP_LABEL[k].toLowerCase()}`,
                    `${o.staffing[k].peakStaff} (${num(o.staffing[k].labourHoursPerDay, 1)} h/day)`,
                    w && `${w.staffing[k].peakStaff} (${num(w.staffing[k].labourHoursPerDay, 1)} h/day)`,
                    w && dv(w.staffing[k].labourHoursPerDay - o.staffing[k].labourHoursPerDay, v => `${num(v, 1)} h/day`))),
                ];
              })()}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#5B6E8C] mt-2">
          {cmp.active ? 'Both columns use the same market pair, base demand, hype, tourist and cost inputs; only the member signal differs (band width, plus any uplift you set).' : 'Member data is switched off for this market, so there is no "with signal" case to compare.'}
          {' '}Planned staffing is sized on forecast volume, not band width, so it can change only if a member uplift is set, and then only when the extra volume needs another whole worker in some hour. Counter costs for each case are on the Counter page.
        </p>
      </Card>

      {/* ---------------- demand components and forecast ---------------- */}
      <Card kicker="Step 3 · 12-week forecast" title="Demand components and band"
        right={<div className="flex flex-wrap gap-2">
          <Segmented label="Units" value={perDay ? 'day' : 'week'} onChange={v => setPerDay(v === 'day')} options={[{ v: 'week', t: 'Cups/week' }, { v: 'day', t: 'Cups/day' }]} />
        </div>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <Stat label="Expected steady demand" value={`${int(pr.steadyCupsPerDay)} cups/day`}
            sub={`${int(pr.steady.base)} cups/week · base ${int(pr.baseCupsPerDay)}${pr.memberUpliftCupsPerDay ? ` ${pr.memberUpliftCupsPerDay > 0 ? '+' : '−'} ${int(Math.abs(pr.memberUpliftCupsPerDay))} member uplift` : ''}`} strong />
          <Stat label="Forecast uncertainty" value={`±${pct(pr.u, 1)}`}
            sub={`80% band ${int(pr.steady.low / 7)}–${int(pr.steady.high / 7)} cups/day · ${pr.uSource === 'observed' ? 'from observed weeks' : pr.uSource === 'signal' ? 'from assumed signal' : 'no signal'}`} />
          <Stat label="Opening hype" value={`×${num(pr.hypeMultiplier, 2)} for ${pr.hypeWeeks} wk`} sub={`about ${int(pr.opening.base / 7)} cups/day, not steady demand`} />
          <Stat label="Tourist / non-member" value={pr.touristCupsPerDay > 0.5 ? `+${int(pr.touristCupsPerDay)} cups/day` : 'Not modelled'}
            sub={pr.touristCupsPerDay > 0.5 ? 'added to steady demand (app assumption)' : 'blind spot: likely understates demand'} />
        </div>
        <ForecastChart weeks={pr.weeks} perDay={perDay} coverage={pr.coverage} u={pr.u}
          bandNote={`Scenario “${sc.name}”: weeks 1–${pr.hypeWeeks} with opening hype ×${num(pr.hypeMultiplier, 2)}, then steady demand`} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <Slider meta={META.baseCupsPerDay} value={i.baseCupsPerDay} onChange={x => setInput('baseCupsPerDay', x)} format={x => int(x)}
            hint="Proxy from existing stores; default = assumptions.json reference store (200,000 cups/year ÷ 360 days)." />
          <Slider meta={META.touristUpliftPct} value={i.touristUpliftPct} onChange={x => setInput('touristUpliftPct', x)} format={x => `+${x}%`} />
          <Slider meta={META.hypeMultiplier} value={i.hypeMultiplier} onChange={x => setInput('hypeMultiplier', x)} format={x => `×${num(x, 2)}`} />
          <Slider meta={META.hypeWeeks} value={i.hypeWeeks} onChange={x => setInput('hypeWeeks', x)} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#FBF8F1] border border-[#ECE5D3] p-3">
          <span className="text-xs font-semibold text-[#0A2146]">Band handed to Counter and Review:</span>
          <Segmented label="Band handed on" value={i.removeHype ? 'steady' : 'hype'} onChange={v => setInput('removeHype', v === 'steady')}
            options={[{ v: 'steady', t: 'Steady demand (deck default)' }, { v: 'hype', t: 'Opening weeks, with hype' }]} />
          <span className="text-xs text-[#5B6E8C]">Weekly {int(pr.handed.low)}–{int(pr.handed.base)}–{int(pr.handed.high)} cups. The counter is sized and costed on steady demand; decide it after the hype.</span>
        </div>
        {i.uOverride != null && (
          <Flag tone="info" className="mt-3">Band width comes from observed weeks (±{pct(i.uOverride, 1)}), applied in Review. Moving the signal slider returns to the assumed signal.</Flag>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Explain title="Method and formulas (sim.js band)">
          <p>Band half-width u = u<sub>none</sub> − signal × (u<sub>none</sub> − u<sub>strong</sub>) = {pct(pr.uNone)} − {pct(pr.signalEffective)} × ({pct(pr.uNone)} − {pct(pr.uStrong)}) = ±{pct(pr.u, 1)}.</p>
          <p>Weekly base = 7 × steady cups/day ({pr.hypeWeeks ? `× ${num(pr.hypeMultiplier, 2)} in hype weeks` : ''}); low = base × (1 − u); high = base × (1 + u).
            The band is an {pct(pr.coverage)} interval: true demand = base × (1 + u·z / {num(pr.z, 4)}), z standard normal, floored at zero.</p>
          <p>Steady demand = base × (1 + member uplift) × (1 + tourist add-on). Both add-ons default to 0, so the deck's numbers are unchanged.</p>
        </Explain>
        <Explain title="Repeat demand before opening, and a back-testing plan">
          <p><b>Hype versus habit needs a proxy.</b> A new store has no repeat history. Use repeat rates from Chagee's existing overseas markets,
            nearby stores, and waitlist members who already order elsewhere. The deck's sanity check is Kuala Lumpur's reported 1,000+ cups on day one
            (secondary source; one store, one day).</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Pick recent openings with pre-launch sign-up data (for example Korea, launch planned for Q2 2026).</li>
            <li>For each, forecast weeks 3–12 using only data available before opening; freeze the forecast.</li>
            <li>Score: share of post-hype weeks inside the band (target about {pct(pr.coverage)}), bias of the base, and band width.</li>
            <li>Fit how band width actually falls with sign-ups per resident; replace the straight-line assumption only if the fit holds out of sample.</li>
            <li>Log tourist-area stores separately; widen their band if coverage falls short.</li>
          </ol>
        </Explain>
      </div>
    </div>
  );
};
