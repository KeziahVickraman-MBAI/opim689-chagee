import React from 'react';
import { Coffee, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-[#D5E2F5] bg-[#EEF4FD] text-[#44628B] py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wider text-[#0A2146]">
              茶 CHAGEE EXPANSION LAB
            </span>
            <span className="text-[#89A8D4]">|</span>
            <span className="text-xs text-[#4F6D96]">
              Cold-Start Retail Beverage Demand Forecasting Model
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#5D7C9F]">
            <span>Model Version: 2.4-Synth</span>
            <span>•</span>
            <span>Client-Side Reactive Simulator</span>
          </div>
        </div>

        {/* Clear Required Disclaimer Banner */}
        <div className="bg-[#FFFFFF] border border-[#CADCF5] rounded-xl p-3.5 text-center text-[#3E5D87] shadow-xs">
          <p className="font-medium">
            Illustrative prototype using synthetic data for demonstration purposes — not affiliated with or using real data from any specific company
          </p>
          <p className="text-[11px] text-[#607D9F] mt-0.5">
            Designed to illustrate how digital membership pre-commitments mitigate the cold-start forecasting dilemma in rapid cross-border tea chain expansion.
          </p>
        </div>
      </div>
    </footer>
  );
};
