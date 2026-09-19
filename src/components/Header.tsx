import React from 'react';
import { TabId, NewMarket, ExistingMarket, Scenario } from '../types';
import { Compass, TrendingUp, Smartphone, Sparkles, ArrowRightLeft } from 'lucide-react';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  newMarket: NewMarket;
  existingMarket: ExistingMarket;
  similarityScore: number;
  scenario: Scenario;
  membershipAvailable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  newMarket,
  existingMarket,
  similarityScore,
  scenario,
  membershipAvailable
}) => {
  return (
    <header className="border-b border-[#1A3D80] bg-[#0A2558] text-[#F9FBFF] shadow-sm sticky top-0 z-30">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#002D72] flex items-center justify-center shadow-md border border-[#4C82E6]/50 text-[#FFFFFF] font-bold text-xl">
            <span className="font-display">茶</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-wider font-semibold text-[#FFFFFF]">
                CHAGEE EXPANSION LAB
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-[#D4AF37]/25 text-[#F3DE96] border border-[#D4AF37]/50 rounded">
                Prototype
              </span>
            </div>
            <p className="text-xs text-[#A8C4ED] font-light">
              Cold-Start Demand & Market Proximity Intelligence
            </p>
          </div>
        </div>

        {/* Active Context Snapshot Pills */}
        <div className="hidden md:flex items-center gap-2.5 text-xs bg-[#0F3577] px-3.5 py-1.5 rounded-full border border-[#214D9E]">
          <div className="flex items-center gap-1.5 text-[#FFFFFF]">
            <span className="text-base leading-none">{newMarket.flag}</span>
            <span className="font-medium">{newMarket.name.split(' ')[0]}</span>
            <ArrowRightLeft className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-base leading-none">{existingMarket.flag}</span>
            <span className="font-medium">{existingMarket.name.split(' ')[0]}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[#3D6EBF]" />
          <div className="flex items-center gap-1">
            <span className="text-[#A8C4ED]">Similarity:</span>
            <span className="font-semibold text-[#F3DE96]">{similarityScore}%</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[#3D6EBF]" />
          <div className="flex items-center gap-1">
            <span className="text-[#A8C4ED]">Signal:</span>
            <span className={`font-semibold ${membershipAvailable ? 'text-[#85E1FF]' : 'text-[#F6B26B]'}`}>
              {membershipAvailable ? 'Online' : 'Cold'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-[#071D45] border-t border-[#133775]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
            <button
              id="tab-market-entry-btn"
              onClick={() => onSelectTab('market-entry')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'market-entry'
                  ? 'bg-[#0047BA] text-[#FFFFFF] shadow border border-[#7BA4F5]/60'
                  : 'text-[#B8D0F3] hover:text-[#FFFFFF] hover:bg-[#0D2E68]'
              }`}
            >
              <Compass className={`w-4 h-4 ${activeTab === 'market-entry' ? 'text-[#F3DE96]' : 'text-[#7D9ECB]'}`} />
              <span>1. Market Entry</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded ${
                activeTab === 'market-entry' ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]' : 'bg-[#0D2D63] text-[#A6C2ED]'
              }`}>
                {similarityScore}% Match
              </span>
            </button>

            <button
              id="tab-demand-forecast-btn"
              onClick={() => onSelectTab('demand-forecast')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'demand-forecast'
                  ? 'bg-[#0047BA] text-[#FFFFFF] shadow border border-[#7BA4F5]/60'
                  : 'text-[#B8D0F3] hover:text-[#FFFFFF] hover:bg-[#0D2E68]'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'demand-forecast' ? 'text-[#F3DE96]' : 'text-[#7D9ECB]'}`} />
              <span>2. Demand Forecast</span>
              <span className="capitalize px-1.5 py-0.2 text-[10px] bg-[#0D2D63] text-[#A6C2ED] rounded">
                12-Wk Curve
              </span>
            </button>

            <button
              id="tab-membership-signal-btn"
              onClick={() => onSelectTab('membership-signal')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'membership-signal'
                  ? 'bg-[#0047BA] text-[#FFFFFF] shadow border border-[#7BA4F5]/60'
                  : 'text-[#B8D0F3] hover:text-[#FFFFFF] hover:bg-[#0D2E68]'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${activeTab === 'membership-signal' ? 'text-[#F3DE96]' : 'text-[#7D9ECB]'}`} />
              <span>3. Membership Signal</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded font-medium ${
                membershipAvailable ? 'bg-[#0060DF] text-[#FFFFFF]' : 'bg-[#4B3012] text-[#FBD38D]'
              }`}>
                {membershipAvailable ? 'Active Signals' : 'Cold Start'}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
