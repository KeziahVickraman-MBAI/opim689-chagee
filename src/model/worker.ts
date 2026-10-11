/* Runs the counter model off the main thread. Stages are posted as they finish; a newer request
 * makes the remaining stages of an older one stop. */
import { ctx } from './ctx';
import { counter, thresholds, volumeCurve } from './engine.js';

let latest = 0;
const tick = () => new Promise(r => setTimeout(r, 0));

self.onmessage = async (e: MessageEvent) => {
  const { seq, key, inputs } = e.data;
  latest = seq;
  const post = (part: string, data: unknown) => (self as unknown as Worker).postMessage({ key, part, data });
  try {
    await tick(); if (seq !== latest) return;
    const c = counter(ctx, inputs);
    post('counter', c);
    await tick(); if (seq !== latest) return;
    post('thresholds', thresholds(ctx, inputs, c.verdict.winner, c.verdict.runnerUp));
    await tick(); if (seq !== latest) return;
    post('volume', volumeCurve(ctx, inputs));
  } catch (err) {
    post('error', err instanceof Error ? err.message : String(err));
  }
};
