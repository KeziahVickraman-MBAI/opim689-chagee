/* Movement illustration: two counters side by side, stepped by the deck's sim/store.js (vendored, unchanged).
 * Starts paused; nothing here feeds the cost model. */
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { ctx, Sim, Store, A, D } from '../model/ctx';
import { paramsFor } from '../model/engine.js';
import { SETUP_COLOR, INK, MUTED, GOLD, pct } from './kit';
import type { Inputs } from '../types';

const OPTS: [string, string, string, string][] = [
  ['human_slow', 'People, slowest first (Week 5)', 'all_human', 'slow_first'],
  ['mixed', 'Mixed: machines + people', 'mixed', 'slow_first'],
  ['all_machine', 'All-machine', 'all_machine', 'slow_first'],
  ['human_fast', 'People, fastest first', 'all_human', 'fast_first'],
];
/* The parts of a sim/store.js store state this view reads (store.js is untyped vendored JS). */
interface ReplicaWorker { i: number; v: number; x: number; mode: string; cup: unknown; blocked: boolean; busyTime: number }
interface ReplicaStation { id: string; machine: boolean; units: number; sec: number; queue: unknown[]; ready: unknown[] }
interface ReplicaState { t: number; measureFrom: number; done: unknown[]; lost: number; stations: ReplicaStation[]; workers: ReplicaWorker[]; step(dt: number): void }

const NAME: Record<string, string> = { ticket: 'Order', cup_ice: 'Cup & ice', tea_milk: 'Tea & milk', topping_finish: 'Topping', shake_seal: 'Shake & seal', handover: 'Hand over' };
const WB = A.illustration.walk_back_speed.value;

export default function StoreReplica({ inputs }: { inputs: Inputs }) {
  const P = useRef(paramsFor(ctx, inputs));
  const [lanes, setLanes] = useState(['human_slow', 'mixed']);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [, frame] = useState(0);
  const S = useRef<ReplicaState[]>([]);

  const fresh = (key: string): ReplicaState => {
    const o = OPTS.find(x => x[0] === key)!;
    const st = Store.create(Sim, P.current, o[2], { surge: inputs.surge, seed: P.current.seed, walkBack: WB, order: o[3] });
    const end = st.t + D.storePrintMinute * 60; while (st.t < end - 1e-9) st.step(0.5);   // open on the deck's print minute
    return st;
  };
  const reset = () => { P.current = paramsFor(ctx, inputs); S.current = lanes.map(fresh); frame(x => x + 1); };
  useEffect(reset, [lanes, inputs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    let last: number | null = null, raf = 0;
    const loop = (ts: number) => {
      if (last != null) {
        const sec = Math.min(0.1, (ts - last) / 1000) * speed;
        S.current = S.current.map((st, j) => {
          const end = st.t + sec; while (st.t < end - 1e-9) st.step(Math.min(0.1, end - st.t));
          return (st.t - st.measureFrom) / 60 >= 60 ? fresh(lanes[j]) : st;
        });
        frame(x => x + 1);
      }
      last = ts; raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, lanes]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setPlaying(p => !p)} aria-pressed={playing} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#B8860B] text-white">
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}{playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D9D1BC]"><RotateCcw className="w-3.5 h-3.5" />Restart</button>
        {[10, 60].map(v => (
          <button key={v} onClick={() => setSpeed(v)} aria-pressed={speed === v}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${speed === v ? 'bg-[#0A2558] text-white border-[#0A2558]' : 'border-[#D9D1BC]'}`}>×{v}</button>
        ))}
        <span className="text-xs text-[#5B6E8C]">Peak hour, {inputs.surge} surge. Same customers in both lanes.</span>
      </div>
      {S.current.map((st, j) => (
        <div key={j} className="rounded-xl border border-[#E3DCC8] bg-[#FBF8F1] p-2">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-1">
            <select aria-label={`Counter ${j + 1}`} value={lanes[j]} onChange={e => setLanes(l => l.map((x, k) => (k === j ? e.target.value : x)))}
              className="rounded-md border border-[#D9D1BC] bg-white px-2 py-1">
              {OPTS.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
            </select>
            <span>Minute <b>{Math.max(0, Math.min(60, (st.t - st.measureFrom) / 60)).toFixed(0)}</b></span>
            <span>Handed over <b>{st.done.length}</b></span>
            <span>Waiting to order <b>{st.stations[0].queue.length}</b></span>
            <span>Lost <b>{st.lost}</b></span>
            {st.workers.map(w => <span key={w.i}>{w.v.toFixed(1)}× busy <b>{pct(w.busyTime / Math.max(1, st.t - st.measureFrom))}</b></span>)}
          </div>
          <Lane st={st} />
        </div>
      ))}
      <p className="text-[11px] text-[#5B6E8C]">Number = worker speed · gold cup = drink in hand · faded = walking back · red ring = held back by the colleague ahead · teal box = machine station.</p>
    </div>
  );
}

function Lane({ st }: { st: ReplicaState }) {
  const n = st.stations.length, W = 1000, XL = 60, XR = 940, X = (x: number) => XR - x * (XR - XL) / n, BW = (XR - XL) / n - 10;
  return (
    <svg viewBox={`0 0 ${W} 130`} className="w-full h-auto" role="img" aria-label="Store replica lane">
      <text x={X(n) - 4} y={14} fontSize={11} fontWeight={700} fill={INK}>PICK UP</text>
      <text x={X(0) - 4} y={14} fontSize={11} fontWeight={700} fill={INK} textAnchor="end">ORDER</text>
      {st.stations.map((o, k) => {
        const cx = X(k + 0.5);
        return (
          <g key={o.id}>
            <rect x={cx - BW / 2} y={22} width={BW} height={40} rx={6} fill="#fff" stroke={o.machine ? SETUP_COLOR.all_machine : '#B89870'} strokeWidth={o.machine ? 2 : 1.2} />
            <text x={cx} y={39} fontSize={11} fontWeight={700} fill={INK} textAnchor="middle">{NAME[o.id] || o.id}</text>
            <text x={cx} y={54} fontSize={9.5} fill={o.machine ? SETUP_COLOR.all_machine : MUTED} textAnchor="middle">{o.machine ? `machine${o.units > 1 ? ' ×' + o.units : ''}` : 'by hand'} · {Math.round(o.sec)} s</text>
            {o.machine && o.queue.length > 0 && <text x={cx} y={76} fontSize={9.5} fill={MUTED} textAnchor="middle">{o.queue.length} queued · {o.ready.length} ready</text>}
          </g>
        );
      })}
      {st.workers.map(w => {
        const near = st.workers.filter(o => o.i < w.i && Math.abs(o.x - w.x) < 0.15).length, x = X(w.x) + near * 24;
        return (
          <g key={w.i} opacity={w.mode !== 'work' ? 0.45 : 1}>
            {w.cup != null && <path d={`M${x - 5} ${80}h10l-1.6 12h-6.8z`} fill={GOLD} />}
            <circle cx={x} cy={104} r={10} fill={SETUP_COLOR.all_human} />
            {w.blocked && <circle cx={x} cy={104} r={14} fill="none" stroke="#C2410C" strokeWidth={3} />}
            <text x={x} y={108} fontSize={9.5} fontWeight={700} fill="#fff" textAnchor="middle">{w.v.toFixed(1)}</text>
          </g>
        );
      })}
      {!st.workers.length && <text x={W / 2} y={108} fontSize={11} fill={MUTED} textAnchor="middle">No staff at the line: an attendant restocks and handles exceptions</text>}
    </svg>
  );
}
