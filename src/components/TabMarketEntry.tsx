import React from 'react';
import { NewMarket, ExistingMarket, SimilarityFactors } from '../types';
import { NEW_MARKETS, EXISTING_MARKETS, FACTOR_CONFIGS } from '../data/markets';
import { RotateCcw, ArrowRight, ShieldCheck, Scale, MapPin, Building2, Store, Info } from 'lucide-react';

interface TabMarketEntryProps {
  newMarket: NewMarket;
  existingMarket: ExistingMarket;
  onSelectNewMarket: (market: NewMarket) => void;
  onSelectExistingMarket: (market: ExistingMarket) => void;
  factors: SimilarityFactors;
  onUpdateFactor: (key: keyof SimilarityFactors, value: number) => void;
  onResetFactors: () => void;
  similarityScore: number;
  onNavigateToForecast: () => void;
}

export const TabMarketEntry: React.FC<TabMarketEntryProps> = ({
  newMarket,
  existingMarket,
  onSelectNewMarket,
  onSelectExistingMarket,
  factors,
  onUpdateFactor,
  onResetFactors,
  similarityScore,
  onNavigateToForecast
}) => {
  // Score interpretation
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: 'High Structural Similarity',
        subtext: 'Demand patterns closely mirror benchmark market; low operational variance.',
        color: 'text-[#0043A8] bg-[#EAF2FF] border-[#B8D5FD]'
      };
    } else if (score >= 65) {
      return {
        label: 'Moderate Similarity',
        subtext: 'Good consumer alignment with minor purchasing power or density divergence.',
        color: 'text-[#8A6715] bg-[#FDF7E8] border-[#EAD8AC]'
      };
    } else {
      return {
        label: 'Divergent Market Profile',
        subtext: 'Higher cold-start variance; wider demand uncertainty bands required.',
        color: 'text-[#8C3A27] bg-[#FCEEEA] border-[#F1BCAF]'
      };
    }
  };

  const scoreBadge = getScoreBadge(similarityScore);

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAF0FA] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0047BA] mb-1">
              <Scale className="w-4 h-4" />
              <span>Step 1: Market Pairing & Structural Proximity</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2146]">
              Market Entry & Cold-Start Matching
            </h1>
            <p className="text-sm sm:text-base text-[#465E7E] mt-1.5 max-w-3xl">
              Solve the tea chain cold-start challenge: benchmark an unentered territory against an established
              operating market to model baseline demand before launching store construction or supply chains.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-[#F1F6FD] border border-[#D5E3F7] px-4 py-2 rounded-xl text-xs text-[#30507B]">
            <Store className="w-4 h-4 text-[#0047BA]" />
            <span>Benchmark: <strong>{existingMarket.matureWeeklyCups.toLocaleString()}</strong> mature cups/wk</span>
          </div>
        </div>

        {/* Market Selectors Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* New Market Dropdown */}
          <div className="space-y-2">
            <label htmlFor="new-market-select" className="block text-xs font-semibold uppercase tracking-wider text-[#1C3B66]">
              Target "New Market" (Cold Start)
            </label>
            <div className="relative">
              <select
                id="new-market-select"
                value={newMarket.id}
                onChange={(e) => {
                  const selected = NEW_MARKETS.find((m) => m.id === e.target.value);
                  if (selected) onSelectNewMarket(selected);
                }}
                className="w-full bg-[#FAFBFD] border border-[#CADCF5] hover:border-[#8BB3EA] focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl px-4 py-3.5 text-sm sm:text-base font-semibold text-[#0B254E] transition-all cursor-pointer appearance-none shadow-xs"
              >
                {NEW_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.flag} {m.name} — {m.cityTier}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#5D80B0]">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-[#F4F8FD] p-3 rounded-lg border border-[#D9E6F8] text-xs text-[#3E5C85] flex items-start gap-2">
              <span className="font-semibold text-[#0B254E] shrink-0">Context:</span>
              <span>{newMarket.marketContext}</span>
            </div>
          </div>

          {/* Existing Market Dropdown */}
          <div className="space-y-2">
            <label htmlFor="existing-market-select" className="block text-xs font-semibold uppercase tracking-wider text-[#1C3B66]">
              Benchmark "Existing Market" (Historical Anchor)
            </label>
            <div className="relative">
              <select
                id="existing-market-select"
                value={existingMarket.id}
                onChange={(e) => {
                  const selected = EXISTING_MARKETS.find((m) => m.id === e.target.value);
                  if (selected) onSelectExistingMarket(selected);
                }}
                className="w-full bg-[#FAFBFD] border border-[#CADCF5] hover:border-[#8BB3EA] focus:border-[#0047BA] focus:ring-2 focus:ring-[#0047BA]/20 rounded-xl px-4 py-3.5 text-sm sm:text-base font-semibold text-[#0B254E] transition-all cursor-pointer appearance-none shadow-xs"
              >
                {EXISTING_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.flag} {m.name} ({m.brandMaturityYears} yrs established)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#5D80B0]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-[#F4F8FD] p-3 rounded-lg border border-[#D9E6F8] text-xs text-[#3E5C85] flex items-start gap-2">
              <span className="font-semibold text-[#0B254E] shrink-0">Profile:</span>
              <span>{existingMarket.notes} Average Ticket: ${existingMarket.avgTicketUSD.toFixed(2)} USD.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similarity Score Dashboard & Factors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Score Gauge & Mathematical Formula */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Score Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#D9E4F5] shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5A779E]">
                  Composite Metric
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#F0F5FD] text-[#0047BA] font-medium border border-[#D3E2F9]">
                  0 - 100% Index
                </span>
              </div>

              <div className="mt-4 text-center py-5 bg-gradient-to-b from-[#F7FAFE] to-[#EEF5FD] rounded-2xl border border-[#D4E3F8]">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#0047BA]">
                  Market Similarity Score
                </div>
                <div className="mt-1 font-display text-6xl font-extrabold text-[#092552] tracking-tight">
                  {similarityScore}%
                </div>

                <div className="mt-3 inline-block px-3 py-1 text-xs font-semibold rounded-full border border-dashed border-current max-w-xs">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBadge.color}`}>
                    {scoreBadge.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#4A6488] px-4 leading-relaxed">
                  {scoreBadge.subtext}
                </p>
              </div>

              {/* Formula Callout as requested */}
              <div className="mt-5 p-4 rounded-xl bg-[#09224E] text-[#F3F7FD] border border-[#193F7D] space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F3DE96]">
                  <Info className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>Formula Callout</span>
                </div>
                <p className="text-xs font-serif-body italic text-[#FFFFFF] leading-relaxed">
                  "Similarity Score = weighted average of demographic, competitive, and economic proximity to existing markets"
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] border-t border-[#183E7A] text-[#BFD4F2]">
                  <div>• Demographic Fit: <strong className="text-[#F3DE96]">30%</strong></div>
                  <div>• Competitive Density: <strong className="text-[#F3DE96]">25%</strong></div>
                  <div>• Income Level: <strong className="text-[#F3DE96]">25%</strong></div>
                  <div>• Urban Density: <strong className="text-[#F3DE96]">20%</strong></div>
                </div>
              </div>

              {/* Proximity Insight */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#F4F8FD] border border-[#D9E5F6] text-xs text-[#32527C] flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#0047BA] shrink-0 mt-0.5" />
                <p>
                  <strong>Forecast Guidance:</strong> The higher the similarity, the more confidently the new market's demand can be forecast from the matched existing market with tighter uncertainty boundaries in Tab 2.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8F0FB]">
              <button
                id="proceed-to-forecast-btn"
                onClick={onNavigateToForecast}
                className="w-full bg-[#0047BA] hover:bg-[#003B9E] text-[#FFFFFF] font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all border border-[#5289ED]/40"
              >
                <span>View 12-Week Demand Forecast</span>
                <ArrowRight className="w-4 h-4 text-[#F3DE96]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Factor Sliders with Live Customization */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#D9E4F5] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF0FA] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0A2146]">
                  Illustrative Structural Factors
                </h3>
                <p className="text-xs text-[#4F6889]">
                  Adjust factors to simulate custom expansion assumptions or localized site conditions.
                </p>
              </div>
              <button
                id="reset-factors-btn"
                onClick={onResetFactors}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F0F5FD] text-[#244574] hover:bg-[#E3ECFB] hover:text-[#0A2554] transition border border-[#CDE0F9]"
                title="Reset sliders to default baseline for this market pair"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0047BA]" />
                <span>Reset to Market Baseline</span>
              </button>
            </div>

            {/* Sliders List */}
            <div className="divide-y divide-[#EDF3FC] mt-2">
              {FACTOR_CONFIGS.map((config) => {
                const value = factors[config.id as keyof SimilarityFactors];
                const weightedContribution = Math.round(value * config.weight * 10) / 10;

                return (
                  <div key={config.id} className="py-4 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0B254E]">{config.name}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF2FE] text-[#0047BA] border border-[#BFD7FA]">
                          Weight: {config.weightLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5D799F]">
                          Contribution: <strong>+{weightedContribution}%</strong>
                        </span>
                        <span className="font-display font-bold text-base text-[#092552] w-12 text-right">
                          {value}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#4E688A]">
                      {config.description}
                    </p>

                    {/* Range Input Slider */}
                    <div className="space-y-1 pt-1">
                      <input
                        id={`slider-${config.id}`}
                        type="range"
                        min="10"
                        max="100"
                        step="1"
                        value={value}
                        onChange={(e) => onUpdateFactor(config.id as keyof SimilarityFactors, parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-[#DDE7F6] rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#6985A9] font-medium">
                        <span>{config.lowLabel} (10%)</span>
                        <span>{config.highLabel} (100%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Factor Proportional Bar */}
            <div className="mt-5 pt-4 border-t border-[#EDF3FC]">
              <div className="text-xs font-semibold text-[#486386] mb-2 flex justify-between">
                <span>Weighted Score Composition</span>
                <span className="text-[#0B254E] font-bold">{similarityScore}% Total</span>
              </div>
              <div className="h-3 w-full bg-[#E5EEF9] rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${factors.demographicFit * 0.30}%` }}
                  className="bg-[#003896] h-full transition-all duration-300"
                  title={`Demographic Fit: ${(factors.demographicFit * 0.30).toFixed(1)}%`}
                />
                <div
                  style={{ width: `${factors.competitiveDensity * 0.25}%` }}
                  className="bg-[#0052CC] h-full transition-all duration-300"
                  title={`Competitive Density: ${(factors.competitiveDensity * 0.25).toFixed(1)}%`}
                />
                <div
                  style={{ width: `${factors.incomeLevel * 0.25}%` }}
                  className="bg-[#2B7FFF] h-full transition-all duration-300"
                  title={`Income Level: ${(factors.incomeLevel * 0.25).toFixed(1)}%`}
                />
                <div
                  style={{ width: `${factors.urbanDensity * 0.20}%` }}
                  className="bg-[#D4AF37] h-full transition-all duration-300"
                  title={`Urban Density: ${(factors.urbanDensity * 0.20).toFixed(1)}%`}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-[#476387]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#003896]" />
                  <span>Demographics</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0052CC]" />
                  <span>Competition</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2B7FFF]" />
                  <span>Income Proximity</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#D4AF37]" />
                  <span>Urban Density</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
