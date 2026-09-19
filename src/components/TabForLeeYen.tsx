import React from 'react';
import { TabId } from '../types';
import {
  MessageSquare,
  Truck,
  Layers,
  Database,
  ArrowUpRight,
  HelpCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface TabForLeeYenProps {
  onNavigateTab: (tab: TabId) => void;
}

export const TabForLeeYen: React.FC<TabForLeeYenProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Discussion Overview Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAF0FA] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0047BA] mb-1">
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              <span>Industry Discussion Companion</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2146]">
              Discussion Guide: For Lee Yen
            </h1>
            <p className="text-sm sm:text-base text-[#465E7E] mt-1.5 max-w-3xl leading-relaxed">
              This discussion companion bridges our prototype's quantitative modeling mechanics with
              grounded operational reality — outlining focal inquiries across supply chain, store operations,
              and consumer intelligence for a conversation with an industry insider.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F1F6FD] border border-[#D5E3F7] px-4 py-2.5 rounded-xl text-xs text-[#244574] self-start md:self-auto shrink-0">
            <BookOpen className="w-4 h-4 text-[#0047BA]" />
            <span className="font-medium">3 Core Modules • 9 Field Questions</span>
          </div>
        </div>

        {/* Framing callout */}
        <div className="mt-5 p-4 rounded-xl bg-[#F8FAFD] border border-[#DCE7F7] flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-[#0047BA] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#3E5C85] leading-relaxed">
            <strong>Companion Objective:</strong> Use each section below to cross-examine how the theoretical cold-start
            algorithms implemented in Tabs 1–3 align with actual enterprise practices in new country expansions.
          </p>
        </div>
      </div>

      {/* SECTION 1 — Supply Chain (links to "Market Entry" tab) */}
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
                Supply Chain & Inventory Pre-Planning
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

      {/* SECTION 2 — Operations (links to "Demand Forecast" tab) */}
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
                Operations, Staffing & Unit Economics
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

      {/* SECTION 3 — Data Available for Forecasting (links to "Membership Signal" tab) */}
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
                Data Available for Cold-Start Forecasting
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
