import React, { lazy, Suspense, useState } from 'react';
import { A, D } from '../model/ctx';
import { inputMeta, modelFacts, SETUP_LABEL, SETUPS, steadyCupsPerDay } from '../model/engine.js';
import type { ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import type { CounterResult, ThresholdRow } from '../model/engine.js';
import { Card, DecisionFrame, Explain, Flag, Segmented, Slider, Stale, StatusBadge, SetupSwatch, int, pct, num, sgd, sgd0, secToMin } from '../ui/kit';
import { CostBars } from '../ui/charts';

const StoreReplica = lazy(() => import('../ui/StoreReplica'));
const META = inputMeta(A);
const FACTS = modelFacts({ A, D });
const [V_LO, V_HI] = META.baseCupsPerDay.range;
const STATION_LABEL: Record<string, string> = { ticket: 'order & ticket', cup_ice: 'cup & ice', tea_milk: 'tea & milk',
  topping_finish: 'toppings', shake_seal: 'shake & seal', handover: 'hand-over' };
const MIXED_STATIONS = (A.stations.mixed_machine_stations.value as string[]).map(x => STATION_LABEL[x] || x).join(', ');

export const fmtLever = (lever: string, x: number) =>
  lever === 'cupsPerDay' ? `${int(x)} cups/day` : lever === 'wage' ? `${sgd(x)}/h` : lever === 'machineMonth' ? `${sgd0(x)}/month`
    : lever === 'u' ? `±${pct(x, 1)}` : lever === 'newShare' ? pct(x) : lever === 'machineMult' ? `×${num(x, 2)}` : num(x, 2);

/* Relative distance from today's value to a threshold; levers with no crossover sort last. */
export const leverDistance = (t: ThresholdRow) => (t.x == null ? Infinity : Math.abs(t.x - t.now) / Math.abs(t.now || 1));

export function verdictText(c: CounterResult | null) {
  if (!c) return null;
  const v = c.verdict;
  return v.tie
    ? { head: 'Too close to call', sub: `${SETUP_LABEL[v.winner]} and ${SETUP_LABEL[v.runnerUp]} are within ${sgd(c.tol)} a cup (${sgd(v.margin, 3)}); decide on service, risk or brand` }
    : { head: SETUP_LABEL[v.winner], sub: `cheapest by ${sgd(v.margin, 3)} a cup over ${SETUP_LABEL[v.runnerUp]}` };
}

export const Counter: React.FC<{ store: ScenarioStore; an: Analysis }> = ({ store, an }) => {
  const { active: sc, setInput } = store;
  const i = sc.inputs, pr = an.pr;
  const c = an.counter.data, cs = an.counter.status;
  const th = an.thresholds.data, ts = an.thresholds.status;
  const vt = verdictText(c);
  const [showAnim, setShowAnim] = useState(false);
  const factor = steadyCupsPerDay(i) / i.baseCupsPerDay;

  return (
    <div className="space-y-6">
      <DecisionFrame
        gate="Gate 3 · Counter" when="Before fit-out" roles={['format', 'ops']} status={cs}
        decision="Which counter should this store install: all-human, mixed, or full automation?"
        evidence={c ? [
          ['Cost per cup', `all-human ${sgd(c.setups.all_human.costPerCup)} · mixed ${sgd(c.setups.mixed.costPerCup)} · all-robot ${sgd(c.setups.all_machine.costPerCup)}`],
          ['All-robot machines busy', c.setups.all_machine.machineBusy == null ? '—' : `${pct(c.setups.all_machine.machineBusy)} of open hours`],
          ['Inputs', `${int(pr.steadyCupsPerDay)} cups/day · ±${pct(pr.u, 1)} · ${i.surge} surge`],
        ] : [['Cost per cup', 'computing…']]}
        action={vt && c ? (c.verdict.tie
          ? <><b className="text-white">Too close to call</b>: {vt.sub}. Choose using all current inputs together.</>
          : <><b className="text-white">{vt.head}</b> is cheaper by {sgd(c.verdict.margin, 3)} a cup at these inputs{c.verdict.margin < 0.05 ? ': close, but above the ' + sgd(c.tol) + ' tie line' : ''}. Choose using all current inputs together.</>)
          : 'Computing the cost model…'}
        tradeoff="All-human: cheapest at low volume, but depends on trained staff. Machines: faster in the peak, but idle and costly when volume is low."
        limitation={`Small gap on a simplified staffing model that misses its Week 5 check (${FACTS.week5.gaps.map((g: number) => num(g, 1) + '%').join(' and ')} against ±${FACTS.week5.tolerancePct}%). No measured service times: a candidate to test in a pilot, not an instruction to install.`}
        actions={[
          ['format', 'Enter the store\u2019s expected steady volume, local wage and machine quote (inputs below; SGD).'],
          ['format', `Install the setup the full comparison favours. If the margin is under ${sgd(FACTS.tieTolerance)} a cup, treat it as a tie and decide on service, staffing risk or brand.`],
          ['format', `Mixed means machines at ${MIXED_STATIONS} with ${c ? c.setups.mixed.peakStaff : '…'} person at the peak; all-human means ${c ? c.setups.all_human.peakStaff : '…'} staff at the peak (model staffing).`],
          ['ops', 'Put the thresholds closest to your inputs on a watch list for Review.'],
        ]}
        calc={[
          `Cost per cup = (labour + machines + lost sales) ÷ cups served, summed over ${FACTS.draws} simulated stores at this scenario\u2019s range and surge.`,
          'One-variable thresholds move one input at a time with the rest held: they show which assumptions deserve closer attention, not a rule to switch setups.',
          'Faster service does not mean a lower cost per cup: at low volume, machine capacity sits unused.',
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card kicker="Inputs" title="Store and costs">
          <div className="space-y-3">
            <Slider meta={{ ...META.baseCupsPerDay, label: 'Steady demand', source: 'Linked to Predict (base × member uplift × tourist add-on)' }}
              value={pr.steadyCupsPerDay} min={V_LO} max={V_HI} format={x => int(x)}
              onChange={x => setInput('baseCupsPerDay', x / factor)}
              hint={<>Shared with Predict. Band ±{pct(pr.u, 1)} comes from Predict's signal setting.</>} />
            <div>
              <div className="text-xs font-semibold text-[#0A2146] mb-1">Unplanned surge in the two busiest hours</div>
              <Segmented label="Surge" value={i.surge} onChange={v => setInput('surge', v)}
                options={(['none', 'moderate', 'large'] as const).map(g => ({ v: g, t: `${g[0].toUpperCase() + g.slice(1)} ×${(A.surge.surge_multiplier.value as Record<string, number>)[g]}` }))} />
            </div>
            <Slider meta={META.wage} value={i.wage} onChange={x => setInput('wage', x)} format={x => sgd(x)} />
            <Slider meta={META.machineMonth} value={i.machineMonth} onChange={x => setInput('machineMonth', x)} format={x => sgd0(x)} />
            <Explain title="Staffing and service assumptions">
              <div className="space-y-3 text-[#0A2146]">
                <Slider meta={META.coordHuman} value={i.coordHuman} onChange={x => setInput('coordHuman', x)} />
                <Slider meta={META.coordMixed} value={i.coordMixed} onChange={x => setInput('coordMixed', x)} />
                <Slider meta={META.newShare} value={i.newShare} onChange={x => setInput('newShare', x)} format={x => pct(x)} />
                <Slider meta={META.newSpeed} value={i.newSpeed} onChange={x => setInput('newSpeed', x)} format={x => `×${num(x, 2)}`} />
                <Slider meta={META.flex} value={i.flex} onChange={x => setInput('flex', x)} format={x => pct(x)} />
                <Slider meta={META.attendant} value={i.attendant} onChange={x => setInput('attendant', x)} format={x => num(x, 1)} />
                <Slider meta={META.margin} value={i.margin} onChange={x => setInput('margin', x)} format={x => `×${num(x, 2)}`} />
                <Slider meta={META.targetWait} value={i.targetWait} onChange={x => setInput('targetWait', x)} format={x => `${num(x, 1)} min`} />
                <Slider meta={META.lostCost} value={i.lostCost} onChange={x => setInput('lostCost', x)} format={x => sgd(x)} />
              </div>
            </Explain>
          </div>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card kicker="Cost model verdict" title={vt ? vt.head : 'Computing…'} right={<StatusBadge status={cs} />}>
            {c ? (
              <Stale status={cs}>
                <p className="text-sm text-[#2D496E] -mt-2 mb-3">{vt!.sub}. Ranking: {c.verdict.order.map(k => `${SETUP_LABEL[k]} ${sgd(c.setups[k].costPerCup)}`).join(' · ')} per cup.</p>
                <CostBars setups={c.setups} winner={c.verdict.winner} tie={c.verdict.tie} />
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Flag>
                    <b>Staffing approximation.</b> People are modelled as a pooled bucket brigade. That formula misses its own Week 5 check
                    ({FACTS.week5.gaps.map((g: number) => `${num(g, 1)}%`).join(' and ')} gap against a ±{FACTS.week5.tolerancePct}% tolerance), and with walking modelled people reach only
                    {' '}{pct(FACTS.replicaCapacity.all_human)} of the assumed capacity ({pct(FACTS.replicaCapacity.mixed)} in the mixed line).
                  </Flag>
                  <Flag tone="info">
                    Tie tolerance: under {sgd(FACTS.tieTolerance)} a cup the setups are called a tie. Results from {c.draws} simulated stores
                    (seed {FACTS.seed}); service times from {c.seeds} simulated peak hours. Breakdowns not modelled.
                  </Flag>
                </div>
              </Stale>
            ) : <p className="text-sm text-[#5B6E8C]">Running {FACTS.draws} simulated stores…</p>}
          </Card>
        </div>
      </div>

      {c && (
        <Stale status={cs}>
          <div className="grid gap-4 md:grid-cols-3">
            {SETUPS.map(k => {
              const s = c.setups[k], win = k === c.verdict.winner;
              return (
                <section key={k} className={`bg-white rounded-2xl p-4 border ${win ? 'border-[#0A2558] ring-2 ring-[#D4AF37]/50' : 'border-[#E3DCC8]'}`} aria-label={`${SETUP_LABEL[k]} counter`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-[#0A2146]"><SetupSwatch setup={k} />{SETUP_LABEL[k]}</h4>
                    {win && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0A2558] text-[#F3DE96]">{c.verdict.tie ? 'Tied' : 'Cheapest'}</span>}
                  </div>
                  <div className="text-2xl font-bold text-[#0A2146] mt-1">{sgd(s.costPerCup)} <span className="text-xs font-normal text-[#5B6E8C]">per cup served</span></div>
                  <dl className="mt-2 text-xs grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[#3E5375]">
                    <dt>Labour · machines · lost sales</dt><dd className="tabular-nums text-right">{sgd(s.perCup.labour)} · {sgd(s.perCup.machine)} · {sgd(s.perCup.lost)}</dd>
                    <dt>Machine units · staff at peak</dt><dd className="text-right">{s.machineUnits} · {k === 'all_machine' ? `${i.attendant} attendant` : s.peakStaff}</dd>
                    <dt>Labour hours a day</dt><dd className="text-right tabular-nums">{num(s.labourHoursPerDay, 1)} h</dd>
                    <dt className="pt-1 border-t border-[#EEE7D6] font-semibold text-[#0A2146]">Peak hour ({i.surge} surge)</dt><dd className="pt-1 border-t border-[#EEE7D6]" />
                    <dt>Capacity vs orders</dt><dd className="text-right tabular-nums">{int(s.capacityPerHour)} vs {int(s.serve.ordersPerHour)} cups/h</dd>
                    <dt>Served (throughput)</dt><dd className="text-right tabular-nums">{int(s.serve.servedPerHour)} cups/h</dd>
                    <dt>Time to serve, median · p90</dt><dd className="text-right tabular-nums">{secToMin(s.serve.median)} · {secToMin(s.serve.p90)}</dd>
                    <dt>Peak utilisation</dt><dd className="text-right tabular-nums">{pct(s.peakUtilisation)}</dd>
                    <dt>Lost orders, peak hours</dt><dd className="text-right tabular-nums">{pct(s.peakLostShare, 1)}</dd>
                    <dt className="pt-1 border-t border-[#EEE7D6]">Lost orders, whole day</dt><dd className="pt-1 border-t border-[#EEE7D6] text-right tabular-nums">{pct(s.lostShare, 1)}</dd>
                    <dt>Machines busy (open hours)</dt><dd className="text-right tabular-nums">{s.machineBusy == null ? '—' : pct(s.machineBusy)}</dd>
                  </dl>
                </section>
              );
            })}
          </div>
          <p className="text-[11px] text-[#5B6E8C] mt-2">Service estimates come from the cost model (sim.js serveTimes, the busiest hour of a base-demand day). Utilisation = forecast peak arrivals × surge ÷ nominal capacity, before noise.</p>
        </Stale>
      )}

      <Card kicker="Sensitivity, not the verdict" title="One-variable thresholds: which assumptions deserve a closer look"
        right={<StatusBadge status={ts} />}>
        <p className="text-sm text-[#2D496E] -mt-2 mb-3">
          {c ? <>Where {SETUP_LABEL[c.verdict.runnerUp]} would overtake {SETUP_LABEL[c.verdict.winner]} if <b>only that input</b> moved, every other input held at this scenario.
            Several inputs moving at once can cancel or compound: the verdict above is what counts.</> : 'Waiting for the cost model.'}
        </p>
        {th && c && (
          <Stale status={ts}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#6B7C99] border-b border-[#ECE5D3]">
                  <th className="py-1.5 pr-3">Input</th><th className="pr-3">Now</th><th className="pr-3">Threshold</th><th className="pr-3">Distance</th><th>Basis</th>
                </tr></thead>
                <tbody>
                  {[...th].sort((a, b) => leverDistance(a) - leverDistance(b)).map(t => (
                    <tr key={t.lever} className="border-b border-[#F3EEE2]">
                      <td className="py-1.5 pr-3 font-semibold text-[#0A2146]">{t.label}</td>
                      <td className="pr-3 tabular-nums">{fmtLever(t.lever, t.now)}</td>
                      <td className="pr-3 tabular-nums">{t.x != null ? <>{fmtLever(t.lever, t.x)}{t.step && <span className="text-[#7A5A0E]" title="The gap jumps here (whole machine units), not a smooth crossing"> (step)</span>}</>
                        : <span className="text-[#5B6E8C]">No crossover in tested range ({fmtLever(t.lever, t.range[0])}–{fmtLever(t.lever, t.range[1])})</span>}</td>
                      <td className="pr-3 tabular-nums">{t.x != null ? `${t.x > t.now ? '+' : '−'}${pct(leverDistance(t))}` : '—'}</td>
                      <td className="text-[11px] text-[#5B6E8C]">{t.source === 'precomputed' ? `deck data.json, ${t.draws} stores` : `live estimate, ${t.draws} stores`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[#5B6E8C] mt-2">Search: 13-point grid over each input's approved range, refined by bisection (sim.js breakEven). Cups/day searches a trigger range up to 3,000, not a new-store forecast.</p>
          </Stale>
        )}
      </Card>

      <Card kicker="Optional movement illustration" title="Store replica: how people and machines move"
        right={<button onClick={() => setShowAnim(s => !s)} aria-expanded={showAnim} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A2558] text-white hover:bg-[#13357A]">{showAnim ? 'Hide' : 'Show'} illustration</button>}>
        <p className="text-sm text-[#2D496E] -mt-2">An illustration of movement only (sim/store.js): workers pass cups like a bucket brigade; machines stay put.
          It does not set any cost or service figure above. Its times can differ from the cost model's because walking and blocking are simulated here.</p>
        {showAnim && <Suspense fallback={<p className="text-sm mt-3">Loading…</p>}><StoreReplica inputs={i} /></Suspense>}
      </Card>
    </div>
  );
};
