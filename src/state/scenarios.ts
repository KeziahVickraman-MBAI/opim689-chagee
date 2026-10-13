/* One shared scenario state for every section: named scenarios, duplicate/reset, local persistence. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { A } from '../model/ctx';
import { defaultInputs } from '../model/engine.js';
import { findTarget, findBenchmark } from '../data/markets';
import * as Ops from './scenarioOps';
import type { Inputs, Scenario, SectionId, NewMarket } from '../types';

const KEY = 'chagee-expansion-lab:v2';
const BASE = defaultInputs(A);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

export const newScenario = (m?: NewMarket, name?: string) => Ops.newScenario(BASE, m, name);
export const changedInputs = (sc: Scenario) => Ops.changedInputs(BASE, sc);

interface Stored { scenarios: Scenario[]; activeId: string; section: SectionId }

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    if (!Array.isArray(s.scenarios) || !s.scenarios.length) return null;
    // Fill fields added since the scenario was saved, so older saves still load.
    s.scenarios = s.scenarios.map(x => ({ ...newScenario(), ...x, inputs: { ...BASE, ...x.inputs } }));
    return s;
  } catch {
    return null;
  }
}

export function useScenarioStore() {
  const [state, setState] = useState<Stored>(() => {
    const s = load();
    if (s) return s;
    const first = newScenario();
    return { scenarios: [first], activeId: first.id, section: 'context' };
  });
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); setSaveError(false); } catch { setSaveError(true); }
  }, [state]);

  const active = useMemo(
    () => state.scenarios.find(s => s.id === state.activeId) || state.scenarios[0],
    [state]
  );

  const update = useCallback((patch: Partial<Scenario> | ((s: Scenario) => Partial<Scenario>)) => {
    setState(st => ({
      ...st,
      scenarios: st.scenarios.map(s => {
        if (s.id !== st.activeId) return s;
        const p = typeof patch === 'function' ? patch(s) : patch;
        return { ...s, ...p, updatedAt: now() };
      }),
    }));
  }, []);

  const setInput = useCallback(<K extends keyof Inputs>(k: K, val: Inputs[K]) => {
    update(s => ({ inputs: { ...s.inputs, [k]: val } }));
  }, [update]);

  const setInputs = useCallback((patch: Partial<Inputs>) => {
    update(s => ({ inputs: { ...s.inputs, ...patch } }));
  }, [update]);

  const setSection = useCallback((section: SectionId) => setState(st => ({ ...st, section })), []);
  const select = useCallback((id: string) => setState(st => ({ ...st, activeId: id })), []);

  const add = useCallback((sc: Scenario) => setState(st => ({ ...st, scenarios: [...st.scenarios, sc], activeId: sc.id })), []);

  const duplicate = useCallback((name?: string, patch?: Partial<Scenario>) => {
    setState(st => {
      const src = st.scenarios.find(s => s.id === st.activeId)!;
      const copy: Scenario = { ...structuredClone(src), ...patch, id: uid(), name: name || `${src.name} (copy)`, updatedAt: now() };
      return { ...st, scenarios: [...st.scenarios, copy], activeId: copy.id };
    });
  }, []);

  const reset = useCallback(() => {
    update(s => Ops.resetScenario(BASE, s));
  }, [update]);

  const remove = useCallback(() => {
    setState(st => {
      if (st.scenarios.length <= 1) return st;
      const rest = st.scenarios.filter(s => s.id !== st.activeId);
      return { ...st, scenarios: rest, activeId: rest[0].id };
    });
  }, []);

  const rename = useCallback((name: string) => update({ name }), [update]);

  const setTargetMarket = useCallback((m: NewMarket) => update(s => Ops.withTargetMarket(s, m)), [update]);
  const setBenchmarkMarket = useCallback((id: string) => update(s => Ops.withBenchmark(s, id)), [update]);
  const resetFactors = useCallback(() => update(s => Ops.withFactorsReset(s)), [update]);

  const targetMarket = findTarget(active.targetMarketId);
  const benchmarkMarket = findBenchmark(active.benchmarkMarketId);

  return {
    scenarios: state.scenarios, active, section: state.section, saveError,
    targetMarket, benchmarkMarket,
    update, setInput, setInputs, setSection, select, add, duplicate, reset, remove, rename, setTargetMarket, setBenchmarkMarket, resetFactors,
  };
}

export type ScenarioStore = ReturnType<typeof useScenarioStore>;
