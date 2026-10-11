import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Milk, Users, ClipboardCheck, MessageSquare, Printer, Copy, RotateCcw, Plus, Trash2, Pencil, FileText } from 'lucide-react';
import type { SectionId } from '../types';
import { changedInputs, newScenario, type ScenarioStore } from '../state/scenarios';
import type { Analysis } from '../state/analysis';
import { StatusBadge, int, pct } from '../ui/kit';
import { MODEL_VERSION } from '../model/ctx';

const GATES: { id: SectionId; n: string; t: string; when: string; I: LucideIcon }[] = [
  { id: 'predict', n: '1', t: 'Predict', when: 'Before committing the site', I: TrendingUp },
  { id: 'provision', n: '2', t: 'Provision', when: 'Before the first stock order', I: Milk },
  { id: 'counter', n: '3', t: 'Counter', when: 'Before fit-out', I: Users },
  { id: 'review', n: '4', t: 'Review', when: 'After opening', I: ClipboardCheck },
];

export const Header: React.FC<{ store: ScenarioStore; an: Analysis; onPrint: () => void }> = ({ store, an, onPrint }) => {
  const { active: sc, section, setSection } = store;
  const [editing, setEditing] = useState(false);
  const changed = changedInputs(sc);
  const status = sc.origin === 'observed' ? { t: 'Observed inputs (manual)', c: 'text-[#9FF0E1]' }
    : changed.length ? { t: `Synthetic · ${changed.length} input${changed.length > 1 ? 's' : ''} edited`, c: 'text-[#F3DE96]' }
    : { t: 'Synthetic · deck defaults', c: 'text-[#C9D8F2]' };

  return (
    <header className="bg-[#0A2558] text-white shadow-sm sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0052CC] to-[#002D72] flex items-center justify-center border border-[#D4AF37]/50 font-bold text-xl"><span className="font-display">茶</span></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-wider font-semibold">CHAGEE EXPANSION LAB</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-[#D4AF37]/25 text-[#F3DE96] border border-[#D4AF37]/50 rounded">Illustrative prototype · synthetic data</span>
            </div>
            <p className="text-xs text-[#A8C4ED]">Store-opening decisions: predict demand → provision opening stock → choose the counter → review after opening</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={an.overall} dark label="Model" />
          <button onClick={onPrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-[#0A2146] hover:bg-[#E3C352]">
            <Printer className="w-3.5 h-3.5" />Print summary
          </button>
        </div>
      </div>

      {/* persistent scenario bar */}
      <div className="bg-[#0F2E68] border-t border-[#1D4389]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 max-w-full">
            <label htmlFor="scn" className="text-[#A8C4ED]">Scenario</label>
            {editing ? (
              <input autoFocus defaultValue={sc.name} aria-label="Scenario name"
                onBlur={e => { store.rename(e.target.value.trim() || sc.name); setEditing(false); }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
                className="rounded bg-white text-[#0A2146] px-2 py-1 text-xs w-44 sm:w-56" />
            ) : (
              <select id="scn" value={sc.id} onChange={e => store.select(e.target.value)} className="rounded bg-[#0A2558] border border-[#2C5299] px-2 py-1 min-w-0 max-w-[11rem] sm:max-w-[16rem]">
                {store.scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <IconBtn title="Rename scenario" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn title="Duplicate scenario" onClick={() => store.duplicate()}><Copy className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn title="New scenario (deck defaults)" onClick={() => store.add(newScenario(store.targetMarket, `${store.targetMarket.name.split(' (')[0]} · scenario ${store.scenarios.length + 1}`))}><Plus className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn title="Reset this scenario to deck defaults" onClick={() => { if (confirm(`Reset “${sc.name}” to deck defaults?`)) store.reset(); }}><RotateCcw className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn title="Delete scenario" disabled={store.scenarios.length < 2} onClick={() => { if (confirm(`Delete “${sc.name}”?`)) store.remove(); }}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
          </div>
          <Pill k="Market" v={`${store.targetMarket.flag} ${store.targetMarket.name.split(' (')[0]}`} />
          <Pill k="Currency" v="SGD" />
          <Pill k="Forecast" v={`${int(an.pr.steadyCupsPerDay)} cups/day ±${pct(an.pr.u)}`} />
          <span className="text-[#A8C4ED]">Data: <span className={`font-semibold ${status.c}`}>{status.t}</span></span>
          {store.saveError && <span className="text-[#FBD38D]">Not saved: browser storage unavailable</span>}
        </div>
      </div>

      {/* navigation: four gates, then secondary */}
      <nav className="bg-[#071D45] border-t border-[#133775]" aria-label="Sections">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1 overflow-x-auto">
          {GATES.map((g, k) => (
            <React.Fragment key={g.id}>
              <button onClick={() => setSection(g.id)} aria-current={section === g.id ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left whitespace-nowrap transition ${section === g.id ? 'bg-[#0047BA] border border-[#7BA4F5]/60' : 'hover:bg-[#0D2E68]'}`}>
                <g.I className={`w-4 h-4 ${section === g.id ? 'text-[#F3DE96]' : 'text-[#7D9ECB]'}`} />
                <span>
                  <span className="block text-sm font-semibold leading-tight">{g.n}. {g.t}</span>
                  <span className="block text-[10px] text-[#A8C4ED] leading-tight">{g.when}</span>
                </span>
              </button>
              {k < GATES.length - 1 && <span className="text-[#3D6EBF] px-0.5" aria-hidden>→</span>}
            </React.Fragment>
          ))}
          <span className="mx-2 h-6 w-px bg-[#24488C]" aria-hidden />
          <SecBtn on={section === 'summary'} onClick={() => setSection('summary')} I={FileText} t="Decision summary" />
          <SecBtn on={section === 'questions'} onClick={() => setSection('questions')} I={MessageSquare} t="Validation questions" />
        </div>
      </nav>
      <div className="sr-only" role="status" aria-live="polite">Active scenario: {sc.name}. {status.t}. Model version {MODEL_VERSION}.</div>
    </header>
  );
};

const IconBtn: React.FC<{ title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ title, onClick, disabled, children }) => (
  <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
    className="p-1.5 rounded hover:bg-[#1D4389] disabled:opacity-30 disabled:hover:bg-transparent">{children}</button>
);
const Pill: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <span className="text-[#A8C4ED]">{k}: <span className="font-semibold text-white">{v}</span></span>
);
const SecBtn: React.FC<{ on: boolean; onClick: () => void; I: LucideIcon; t: string }> = ({ on, onClick, I, t }) => (
  <button onClick={onClick} aria-current={on ? 'page' : undefined}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${on ? 'bg-[#0047BA] text-white' : 'text-[#B8D0F3] hover:bg-[#0D2E68]'}`}>
    <I className="w-3.5 h-3.5" />{t}
  </button>
);
