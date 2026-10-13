/* Shared results for the active scenario.
 * Predict and Provision are cheap and computed synchronously. The counter model, its thresholds and the
 * volume curve run in a Web Worker; each result is tagged with the inputs that produced it, so a result
 * from earlier inputs is shown as stale, never as current. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ctx } from '../model/ctx';
import { predict, provision, benefit, bandU, steadyCupsPerDay, COUNTER_KEYS } from '../model/engine.js';
import type { Inputs } from '../types';
import type { CounterResult, ThresholdRow, VolumeCurveResult } from '../model/engine.js';

export type PartStatus = 'current' | 'stale' | 'computing' | 'error';
type Part = 'counter' | 'thresholds' | 'volume';
interface Parts { counter?: CounterResult; thresholds?: ThresholdRow[]; volume?: VolumeCurveResult; error?: string }

export function counterKey(i: Inputs): string {
  const o: Record<string, unknown> = { cpd: +steadyCupsPerDay(i).toFixed(6), u: +bandU(ctx, i).toFixed(8) };
  for (const k of COUNTER_KEYS) o[k] = i[k as keyof Inputs];
  return JSON.stringify(o);
}

let worker: Worker | null = null;
const listeners = new Set<(m: { key: string; part: Part | 'error'; data: unknown }) => void>();
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../model/worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = e => listeners.forEach(f => f(e.data));
  }
  return worker;
}

const cache = new Map<string, Parts>();
let seq = 0;

/* Counter result for any inputs already computed this session (e.g. the original plan), without starting a run. */
export function cachedCounter(i: Inputs): CounterResult | null {
  return cache.get(counterKey(i))?.counter ?? null;
}

export function useAnalysis(inputs: Inputs) {
  const pr = useMemo(() => predict(ctx, inputs), [inputs]);
  const prov = useMemo(() => provision(ctx, inputs, pr), [inputs, pr]);

  const key = useMemo(() => counterKey(inputs), [inputs]);
  const [, bump] = useState(0);
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    const f = (m: { key: string; part: Part | 'error'; data: unknown }) => {
      const p = cache.get(m.key) || {};
      if (m.part === 'error') p.error = String(m.data); else (p as Record<Part, unknown>)[m.part] = m.data;
      cache.set(m.key, p);
      bump(x => x + 1);
    };
    listeners.add(f);
    return () => { listeners.delete(f); };
  }, []);

  useEffect(() => {
    const have = cache.get(key);
    if (have?.counter && have.thresholds && have.volume) return;
    // Short debounce so dragging a slider does not queue a run per pixel.
    const t = setTimeout(() => getWorker().postMessage({ seq: ++seq, key, inputs }), 180);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = cache.get(key) || {};
  if (cur.counter) lastShown.current = key;
  const prev = lastShown.current ? cache.get(lastShown.current) : undefined;

  function pick<K extends Part>(p: K): { data: NonNullable<Parts[K]> | null; status: PartStatus } {
    if (cur.error) return { data: prev?.[p] ?? null, status: 'error' };
    if (cur[p]) return { data: cur[p] ?? null, status: 'current' };
    if (prev?.[p]) return { data: prev[p] ?? null, status: 'stale' };
    return { data: null, status: 'computing' };
  }
  const counter = pick('counter'), thresholds = pick('thresholds'), volume = pick('volume');

  const bn = useMemo(
    () => benefit(ctx, inputs, { pr, prov, ctr: counter.data, vc: volume.data }),
    [inputs, pr, prov, counter.data, volume.data]
  );
  const benefitStatus: PartStatus =
    counter.status === 'current' && volume.status === 'current' ? 'current'
      : counter.status === 'error' || volume.status === 'error' ? 'error'
      : counter.data || volume.data ? 'stale' : 'computing';

  const overall: PartStatus =
    [counter, thresholds, volume].some(x => x.status === 'error') ? 'error'
      : [counter, thresholds, volume].every(x => x.status === 'current') ? 'current'
      : [counter, thresholds, volume].some(x => x.status === 'stale') ? 'stale' : 'computing';

  return { pr, prov, counter, thresholds, volume, benefit: { data: bn, status: benefitStatus }, overall, error: cur.error };
}

export type Analysis = ReturnType<typeof useAnalysis>;
