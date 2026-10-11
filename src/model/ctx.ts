/* The deck's model, loaded once. The vendored files are UMD: run as native ESM (dev server, Node) they register
 * globalThis.ChageeSim / ChageeStore; wrapped as CommonJS by the production bundler they export instead. */
import * as simModule from './vendor/sim.js';
import * as storeModule from './vendor/store.js';
import A from './vendor/assumptions.json';
import D from './vendor/data.json';
import SOURCE from './vendor/source.json';

const pick = (m: any, name: string) => { const d = m?.default; return d && (d.params || d.create) ? d : (globalThis as any)[name]; };
export const Sim: any = pick(simModule, 'ChageeSim');
export const Store: any = pick(storeModule, 'ChageeStore');
if (!Sim || !Store) throw new Error('Missing dependency: vendored sim.js / store.js did not load (run npm run sync-model)');
export { A, D, SOURCE };
export const ctx = { Sim, A, D };
export const MODEL_VERSION = `deck ${SOURCE.deckCommit} · data.json ${D.generated.slice(0, 10)}`;
