import React from 'react';
import { MODEL_VERSION } from '../model/ctx';

export const Footer: React.FC = () => (
  <footer className="mt-12 border-t border-[#E3DCC8] bg-[#F1EBDD] text-[#44628B] py-8 text-xs print:hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="font-display font-bold text-sm tracking-wider text-[#0A2146]">茶 CHAGEE EXPANSION LAB</span>
        <span className="text-[#5D7C9F]">Model: {MODEL_VERSION} · runs in your browser · scenarios saved on this device only</span>
      </div>
      <div className="bg-white border border-[#E3DCC8] rounded-xl p-3.5 text-center text-[#3E5D87]">
        <p className="font-medium">Illustrative prototype using synthetic data and illustrative assumptions — not affiliated with, or using real data from, Chagee or any company.</p>
        <p className="text-[11px] text-[#607D9F] mt-0.5">Figures are modelled estimates in SGD for discussion; they are not forecasts, quotes or demonstrated savings. No live data connections.</p>
      </div>
    </div>
  </footer>
);
