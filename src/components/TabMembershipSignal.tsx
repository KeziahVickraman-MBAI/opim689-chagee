import React from 'react';
import { NewMarket, MembershipSignals } from '../types';
import {
  Smartphone,
  Sparkles,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface TabMembershipSignalProps {
  newMarket: NewMarket;
  signals: MembershipSignals;
  onUpdateSignal: (key: keyof MembershipSignals, value: any) => void;
  similarityScore: number;
  demandUpliftPct: number;
  uncertaintyReductionPct: number;
  netUncertaintyPct: number;
  baseUncertaintyPct: number;
  onNavigateToForecast: () => void;
}

export const TabMembershipSignal: React.FC<TabMembershipSignalProps> = ({
  newMarket,
  signals,
  onUpdateSignal,
  similarityScore,
  demandUpliftPct,
  uncertaintyReductionPct,
  netUncertaintyPct,
  baseUncertaintyPct,
  onNavigateToForecast
}) => {
  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAF0FA] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0047BA] mb-1">
              <Smartphone className="w-4 h-4" />
              <span>Step 3: Pre-Launch Loyalty & App Intelligence</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2146]">
              Pre-Launch Membership Signals
            </h1>
            <p className="text-sm sm:text-base text-[#465E7E] mt-1.5 max-w-3xl">
              Turn cold-start uncertainty into quantifiable customer demand. Pre-launch app downloads,
              loyalty registrations, and digital waitlist campaigns indicate pre-committed buyer intent.
            </p>
          </div>

          {/* Simple Data Status Indicator per Market as required */}
          <div className="bg-[#FAFBFD] border border-[#CADCF5] p-3 rounded-2xl flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#0047BA]">
                Data Status ({newMarket.name.split(' ')[0]})
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    signals.dataAvailable ? 'bg-[#0052CC] animate-pulse' : 'bg-[#D97706]'
                  }`}
                />
                <span
                  id="membership-data-status-badge"
                  className={`text-xs font-bold ${
                    signals.dataAvailable ? 'text-[#0047BA]' : 'text-[#8A5112]'
                  }`}
                >
                  Membership data: {signals.dataAvailable ? 'Available' : 'Not yet available'}
                </span>
              </div>
            </div>

            <button
              id="toggle-data-availability-btn"
              onClick={() => onUpdateSignal('dataAvailable', !signals.dataAvailable)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                signals.dataAvailable
                  ? 'bg-[#EBF3FE] text-[#0047BA] border-[#BFD7FA] hover:bg-[#DCE9FC]'
                  : 'bg-[#0047BA] text-[#FFFFFF] border-[#0047BA] hover:bg-[#003B9E]'
              }`}
            >
              {signals.dataAvailable ? 'Simulate No Data' : 'Activate Mock Signal'}
            </button>
          </div>
        </div>

        {/* Short Explanatory Note Callout as required */}
        <div className="mt-6 p-4 rounded-xl bg-[#09224E] text-[#F3F7FD] border border-[#193F7D] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F3DE96]">
            <Sparkles className="w-4 h-4 shrink-0 text-[#D4AF37]" />
            <span>Core Concept: Cold-Start Resolution</span>
          </div>
          <p className="text-sm font-serif-body italic text-[#FFFFFF] leading-relaxed">
            "Early membership signal (app interest, waitlist activity) can sharpen demand forecasts before a store has even opened — reducing reliance on market-similarity alone."
          </p>
          <p className="text-xs text-[#BFD4F2] leading-relaxed pt-1 border-t border-[#183E7A]">
            New markets typically launch with zero historical POS transactions. Without local sales history,
            supply chain planners risk massive opening-day shortages or spoiled stock. By measuring digital pre-launch
            interest, the chain can dial in tea leaf sourcing and roster staffing with confidence.
          </p>
        </div>
      </div>

      {/* Main Signal Controls & Impact Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Mock Signal Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#D9E4F5] shadow-xs">
            <div className="flex items-center justify-between border-b border-[#EAF0FA] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0A2146]">
                  Pre-Launch Signal Indicators
                </h3>
                <p className="text-xs text-[#4F6889]">
                  Simulate marketing campaign performance leading up to Grand Opening Day.
                </p>
              </div>

              {!signals.dataAvailable && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Currently Inactive
                </span>
              )}
            </div>

            {signals.dataAvailable ? (
              <div className="divide-y divide-[#EDF3FC] mt-2">
                {/* Signal 1: App Pre-Registrations */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EAF2FE] flex items-center justify-center text-[#0047BA]">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#0B254E]">App Pre-Registrations</span>
                        <div className="text-[11px] text-[#5D7B9F]">
                          Users who downloaded the mobile order app & registered an account
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-bold text-lg text-[#092552]">
                      {signals.appPreRegistrations.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2">
                    <input
                      id="slider-app-preregs"
                      type="range"
                      min="0"
                      max="50000"
                      step="500"
                      value={signals.appPreRegistrations}
                      onChange={(e) => onUpdateSignal('appPreRegistrations', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#DDE7F6] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6985A9] font-medium pt-1">
                      <span>0 Sign-ups (Cold)</span>
                      <span>25,000 (Strong Target)</span>
                      <span>50,000 (Viral Surge)</span>
                    </div>
                  </div>
                </div>

                {/* Signal 2: Social Media Interest Score */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F0F5FD] flex items-center justify-center text-[#0047BA]">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#0B254E]">Social Media Interest Score</span>
                        <div className="text-[11px] text-[#5D7B9F]">
                          Geo-targeted TikTok, Instagram & localized food community buzz index
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-bold text-lg text-[#092552]">
                      {signals.socialInterestScore} / 100
                    </span>
                  </div>

                  <div className="pt-2">
                    <input
                      id="slider-social-score"
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={signals.socialInterestScore}
                      onChange={(e) => onUpdateSignal('socialInterestScore', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#DDE7F6] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6985A9] font-medium pt-1">
                      <span>0 (No Buzz)</span>
                      <span>50 (Moderate Organic Reach)</span>
                      <span>100 (Peak Viral Virality)</span>
                    </div>
                  </div>
                </div>

                {/* Signal 3: VIP Waitlist Sign-ups */}
                <div className="py-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EAF0FC] flex items-center justify-center text-[#003896]">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#0B254E]">VIP Waitlist Sign-ups</span>
                        <div className="text-[11px] text-[#5D7B9F]">
                          Pre-registered consumers claiming opening-day blind-box tea vouchers
                        </div>
                      </div>
                    </div>
                    <span className="font-display font-bold text-lg text-[#092552]">
                      {signals.waitlistSignups.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2">
                    <input
                      id="slider-waitlist-signups"
                      type="range"
                      min="0"
                      max="25000"
                      step="250"
                      value={signals.waitlistSignups}
                      onChange={(e) => onUpdateSignal('waitlistSignups', parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#DDE7F6] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#6985A9] font-medium pt-1">
                      <span>0 Claims</span>
                      <span>12,500 Claims</span>
                      <span>25,000 Capacity Limit</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-6 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#92400E] border border-[#FDE68A]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-[#0A2146]">
                    No Pre-Launch Membership Base Available
                  </h4>
                  <p className="text-xs text-[#4F6889] max-w-md mx-auto mt-1">
                    When entering a completely unannounced territory with no pre-registration campaign,
                    the forecast in Tab 2 relies 100% on Market Similarity Proximity alone with a wider uncertainty range (±{baseUncertaintyPct}%).
                  </p>
                </div>
                <button
                  id="enable-mock-signals-btn"
                  onClick={() => onUpdateSignal('dataAvailable', true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0047BA] text-[#FFFFFF] rounded-xl text-xs font-semibold hover:bg-[#003B9E] transition shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-[#F3DE96]" />
                  <span>Simulate Pre-Launch Campaign Data</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Impact on Tab 2 Forecast */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#D9E4F5] shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between border-b border-[#EAF0FA] pb-3">
                <h3 className="font-display text-base font-bold text-[#0A2146]">
                  Live Forecast Impact
                </h3>
                <span className="text-[11px] font-semibold text-[#5D7B9F]">
                  Connected to Tab 2
                </span>
              </div>

              {/* Stat 1: Uplift */}
              <div className="mt-4 p-4 rounded-xl bg-[#F8FAFD] border border-[#DCE7F7] space-y-1">
                <div className="text-xs text-[#5C799D] flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-wider">Demand Volume Uplift</span>
                  <span className="text-[#0047BA] font-bold">Volume Shift</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-[#092552]">
                    {signals.dataAvailable ? `+${demandUpliftPct}%` : '0%'}
                  </span>
                  <span className="text-xs text-[#44628B]">
                    {signals.dataAvailable
                      ? 'Nudges baseline launch curve upward'
                      : 'Unadjusted baseline'}
                  </span>
                </div>
                <p className="text-[11px] text-[#4F6D94] pt-1">
                  Higher app pre-registrations represent captured customer intent that directly boosts opening week throughput.
                </p>
              </div>

              {/* Stat 2: Uncertainty Tightening */}
              <div className="mt-3 p-4 rounded-xl bg-[#F8FAFD] border border-[#DCE7F7] space-y-1">
                <div className="text-xs text-[#5C799D] flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-wider">Uncertainty Reduction</span>
                  <span className="text-[#0052CC] font-bold">Confidence Boost</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-[#0047BA]">
                    {signals.dataAvailable ? `-${uncertaintyReductionPct}%` : '0%'}
                  </span>
                  <span className="text-xs text-[#44628B]">
                    Narrower forecast spread
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[#516E93]">Net Uncertainty Band:</span>
                  <span className="font-bold text-[#0B254E]">
                    ±{netUncertaintyPct}%
                  </span>
                  {signals.dataAvailable && (
                    <span className="text-[10px] text-[#718DAF] line-through">
                      ±{baseUncertaintyPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Before vs After Callout Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#F3F7FD] border border-[#D5E3F7] text-xs text-[#3E5C85] space-y-1.5">
                <div className="font-bold text-[#0B254E] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0047BA]" />
                  <span>How Tab 2 Reacts to This Signal:</span>
                </div>
                <p className="leading-relaxed">
                  As you move these sliders, the <strong>Demand Forecast in Tab 2</strong> updates in real time:
                  the uncertainty band contracts from a broad range into a focused operational target, and recommended
                  inventory is automatically scaled up to avoid opening week stockouts.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EDF3FC]">
              <button
                id="view-sharpened-forecast-btn"
                onClick={onNavigateToForecast}
                className="w-full bg-[#0047BA] hover:bg-[#003B9E] text-[#FFFFFF] font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all border border-[#5289ED]/40"
              >
                <span>View Sharpened Forecast in Tab 2</span>
                <ArrowRight className="w-4 h-4 text-[#F3DE96]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
