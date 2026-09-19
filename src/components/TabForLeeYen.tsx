import React from 'react';
import { TabId } from '../types';
import {
  MessageSquare,
  Truck,
  Layers,
  Database,
  ArrowUpRight,
  HelpCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  Info
} from 'lucide-react';

interface TabForLeeYenProps {
  onNavigateTab: (tab: TabId) => void;
}

export const TabForLeeYen: React.FC<TabForLeeYenProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ══════════════════════════════════════════════════════════
          PROJECT PRIMER SECTION (Top of Tab 4)
          Softer background tone, scannable in under 30s
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#F6F9FE] rounded-2xl p-6 sm:p-8 border border-[#CCE0F7] shadow-xs relative overflow-hidden">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0047BA]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Label Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E7F0FD] text-[#0047BA] border border-[#BFD8FA]">
              <GraduationCap className="w-3.5 h-3.5 text-[#0047BA]" />
              Project Primer
            </span>
            <span className="text-xs text-[#5C799D] hidden sm:inline">•</span>
            <span className="text-xs text-[#5C799D] hidden sm:inline">SMU MBAI Course Project Context</span>
          </div>

          {/* Header */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2146] mb-4">
            Quick Context — What This Project Is
          </h1>

          {/* Body Text */}
          <div className="space-y-3.5 text-sm sm:text-[15px] text-[#2D496E] leading-relaxed">
            <p>
              This is a group project for an <strong>MBAI (Master of Business Administration in AI)</strong> course at <strong>SMU</strong>, focused on online marketplaces and intelligent retail operations. The assignment asks us to pick a company with an online presence, identify a core operational problem that AI could meaningfully enhance, and propose a solution with a sized business benefit.
            </p>
            <p>
              We're looking at Chagee through the lens of <strong>online marketplace dynamics</strong> — membership, loyalty, and demand signal — but applied to what's fundamentally a <strong>brick-and-mortar expansion problem</strong>: opening physical stores in brand-new markets. That combination is what makes it interesting — Chagee has digital/membership infrastructure (an 'online' layer) but the actual expansion risk lives in the physical world (site selection, staffing, inventory for a store that doesn't exist yet).
            </p>
            <p className="text-xs sm:text-sm text-[#4E6C92] pt-1">
              This prototype is an early, illustrative mockup — not built on real Chagee data — meant to spark discussion about whether we're circling a real operational challenge, not a finished proposal.
            </p>
          </div>

          {/* Companion Quick Links Bar */}
          <div className="mt-5 pt-4 border-t border-[#D6E5F8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#426189]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0047BA]" />
              <span className="font-medium">3 discussion modules below link directly into the prototype tabs:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('market-entry')}
                className="px-2.5 py-1 rounded-md bg-[#FFFFFF] hover:bg-[#EBF3FE] text-[#0047BA] font-medium border border-[#CCE0F7] transition"
              >
                Tab 1: Market Entry
              </button>
              <button
                onClick={() => onNavigateTab('demand-forecast')}
                className="px-2.5 py-1 rounded-md bg-[#FFFFFF] hover:bg-[#EBF3FE] text-[#0047BA] font-medium border border-[#CCE0F7] transition"
              >
                Tab 2: Forecast
              </button>
              <button
                onClick={() => onNavigateTab('membership-signal')}
                className="px-2.5 py-1 rounded-md bg-[#FFFFFF] hover:bg-[#EBF3FE] text-[#0047BA] font-medium border border-[#CCE0F7] transition"
              >
                Tab 3: Membership
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — Supply Chain (links to "Market Entry" tab)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAF0FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2FE] border border-[#CADCF5] flex items-center justify-center text-[#0047BA]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0047BA]">
                Section 1 • Sourcing & Distribution
              </div>
              <h2 className="font-display text-xl font-bold text-[#0A2146]">
                Supply Chain — Physical Inventory Meets New-Market Risk
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('market-entry')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0F5FD] text-[#0047BA] hover:bg-[#E1ECFB] transition border border-[#CDE0F9] self-start sm:self-auto"
          >
            <span>Refer to Tab 1 (Market Entry)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Header Note */}
        <div className="mt-5 p-4 rounded-xl bg-[#09224E] text-[#F3F7FD] border border-[#193F7D] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3DE96] mb-1">
            Prompted by Tab 1 Mechanics:
          </div>
          <p className="text-sm font-serif-body italic text-[#FFFFFF] leading-relaxed">
            "The Market Entry tab assumes ingredient sourcing/inventory gets pre-planned based on market similarity — is that close to reality?"
          </p>
        </div>

        {/* Questions List */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              1
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                When entering a brand-new market, how is initial ingredient sourcing and inventory level decided before there's local sales history?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: Is it purely benchmarked against existing mature store averages (like Singapore or Malaysia), or do regional franchisee agreements dictate the opening supply quota?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              2
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Are ingredients sourced centrally and shipped out, or more locally per market/region — does that change for newer markets?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: How is the balance struck between proprietary Yunnan tea leaf exports vs. localized fresh dairy/oat milk partnerships and packaging customs compliance?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              3
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Have there been supply hiccups (stockouts, over-ordering, spoilage) especially in newer markets?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: What happens when an opening week viral rush doubles projected throughput, or conversely, if cold-chain delays impact dairy shelf-life?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — Operations (links to "Demand Forecast" tab)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAF0FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2FE] border border-[#CADCF5] flex items-center justify-center text-[#0047BA]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0047BA]">
                Section 2 • Store Dynamics & Economics
              </div>
              <h2 className="font-display text-xl font-bold text-[#0A2146]">
                Operations — Opening a Store With No Local Track Record
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('demand-forecast')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0F5FD] text-[#0047BA] hover:bg-[#E1ECFB] transition border border-[#CDE0F9] self-start sm:self-auto"
          >
            <span>Refer to Tab 2 (Demand Forecast)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Header Note */}
        <div className="mt-5 p-4 rounded-xl bg-[#09224E] text-[#F3F7FD] border border-[#193F7D] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3DE96] mb-1">
            Prompted by Tab 2 Mechanics:
          </div>
          <p className="text-sm font-serif-body italic text-[#FFFFFF] leading-relaxed">
            "The Demand Forecast tab outputs a recommended opening inventory, staffing level, and break-even week — curious how close that is to how these decisions actually get made."
          </p>
        </div>

        {/* Questions List */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              1
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                How are site selection and opening-day staffing/stocking decided for a market Chagee hasn't operated in before?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: How do teams determine the initial barista shift size (e.g., 6–10 baristas per shift) to buffer against peak opening congestion without inflating early labor cost?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              2
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Mature overseas stores reportedly outperform China stores per store — is that mainly pricing/positioning, less competition, or something else?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: Is premium cup pricing ($4–$6+ USD) sustainable across emerging Southeast Asian markets, or is volume driven by novelty and gift-bag blind box activations?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              3
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Has the shift to GMV-based revenue sharing with franchisees changed day-to-day operational decisions, or is it mostly a finance/contracts change?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: Does tying corporate cut directly to top-line throughput shift corporate's incentive to assist franchisees with predictive staffing and waste minimization?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — Data Available for Forecasting (links to "Membership Signal" tab)
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAF0FA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2FE] border border-[#CADCF5] flex items-center justify-center text-[#0047BA]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#0047BA]">
                Section 3 • Digital Infrastructure & Signals
              </div>
              <h2 className="font-display text-xl font-bold text-[#0A2146]">
                Membership Data — The 'Online' Signal Behind a Brick-and-Mortar Decision
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('membership-signal')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0F5FD] text-[#0047BA] hover:bg-[#E1ECFB] transition border border-[#CDE0F9] self-start sm:self-auto"
          >
            <span>Refer to Tab 3 (Membership Signal)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Header Note */}
        <div className="mt-5 p-4 rounded-xl bg-[#09224E] text-[#F3F7FD] border border-[#193F7D] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3DE96] mb-1">
            Prompted by Tab 3 Mechanics:
          </div>
          <p className="text-sm font-serif-body italic text-[#FFFFFF] leading-relaxed">
            "The Membership Signal tab assumes pre-launch app/loyalty data can sharpen a forecast before a store even opens — wanted to check if that kind of data actually exists and gets used this way."
          </p>
        </div>

        {/* Questions List */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              1
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                What consumer data does the membership side actually track (app usage, purchase frequency, loyalty tiers) — is any of it used for demand planning or new-store decisions?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: Are app metrics strictly used for CRM coupons and marketing pushes, or do supply chain planners have visibility into active user counts?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              2
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Is member/loyalty data pooled globally or siloed per market — would a brand-new market have any of this before it even opens?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: If a Singaporean or Malaysian member visits Seoul or Manila, is their profile recognized cross-border or treated as a clean slate?
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2ECF8] flex items-start gap-4">
            <span className="w-7 h-7 rounded-lg bg-[#EAF2FE] text-[#0047BA] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[#BFD7FA]">
              3
            </span>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-[#0B254E]">
                Are there early signals (app sign-ups, social buzz, waitlist activity) the team looks at before or right after a new-market opening?
              </p>
              <p className="text-xs text-[#5D7B9F] leading-relaxed">
                Probe: Which pre-opening signals have the strongest correlation with 3-month store survival or repeat ordering behavior?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
