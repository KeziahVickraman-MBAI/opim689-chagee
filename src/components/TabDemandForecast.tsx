import React, { useState } from 'react';
import {
  NewMarket,
  ExistingMarket,
  Scenario,
  ForecastPoint,
  RecommendedOutputs,
  MembershipSignals
} from '../types';
import {
  PackageCheck,
  Users2,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface TabDemandForecastProps {
  newMarket: NewMarket;
  existingMarket: ExistingMarket;
  similarityScore: number;
  scenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  forecastPoints: ForecastPoint[];
  outputs: RecommendedOutputs;
  netUncertaintyPct: number;
  baseUncertaintyPct: number;
  membershipSignals: MembershipSignals;
  onNavigateToMembership: () => void;
}

export const TabDemandForecast: React.FC<TabDemandForecastProps> = ({
  newMarket,
  existingMarket,
  similarityScore,
  scenario,
  onSelectScenario,
  forecastPoints,
  outputs,
  netUncertaintyPct,
  baseUncertaintyPct,
  membershipSignals,
  onNavigateToMembership
}) => {
  const [hoveredWeek, setHoveredWeek] = useState<ForecastPoint | null>(null);

  // SVG Chart Geometry Calculations
  const chartWidth = 740;
  const chartHeight = 310;
  const padding = { top: 30, right: 35, bottom: 45, left: 60 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Max value calculation for Y axis
  const maxUpper = Math.max(...forecastPoints.map((p) => p.upperBound));
  const minLower = Math.min(...forecastPoints.map((p) => p.lowerBound));
  const yMax = Math.ceil((maxUpper * 1.12) / 1000) * 1000;
  const yMin = Math.max(0, Math.floor((minLower * 0.75) / 1000) * 1000);

  const getX = (index: number) => {
    return padding.left + (index / (forecastPoints.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin || 1);
    return padding.top + plotHeight - ratio * plotHeight;
  };

  // Generate SVG paths
  // Upper bound line
  const upperPath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.upperBound)}`)
    .join(' ');

  // Lower bound reversed line for closed area
  const lowerReversedPath = forecastPoints
    .slice()
    .reverse()
    .map((p, i) => {
      const originalIndex = forecastPoints.length - 1 - i;
      return `L ${getX(originalIndex)} ${getY(p.lowerBound)}`;
    })
    .join(' ');

  const areaShadingPath = `${upperPath} ${lowerReversedPath} Z`;

  // Main base trajectory path
  const basePath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.baseVolume)}`)
    .join(' ');

  // Y-axis tick steps (5 ticks)
  const yTicks = [
    yMin,
    Math.round(yMin + (yMax - yMin) * 0.25),
    Math.round(yMin + (yMax - yMin) * 0.5),
    Math.round(yMin + (yMax - yMin) * 0.75),
    yMax
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#D9E4F5] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAF0FA] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0047BA] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Step 2: Cold-Start 12-Week Demand Modeling</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0A2146]">
              12-Week Store Launch Demand Forecast
            </h1>
            <p className="text-sm text-[#465E7E] mt-1 max-w-2xl">
              Modeled launch trajectory for <strong>{newMarket.flag} {newMarket.name}</strong> based on
              benchmarking <strong>{existingMarket.flag} {existingMarket.name}</strong> ({similarityScore}% similarity).
            </p>
          </div>

          {/* Uncertainty badge & scenario toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#F3F7FD] border border-[#CADCF5] px-3.5 py-2 rounded-xl text-xs">
              <div className="text-[#5A779E] text-[10px] uppercase font-semibold">
                Uncertainty Range
              </div>
              <div className="font-bold text-[#0B254E] flex items-center gap-1.5 mt-0.5">
                <span>±{netUncertaintyPct}%</span>
                {netUncertaintyPct < baseUncertaintyPct && (
                  <span className="text-[10px] text-[#0047BA] bg-[#E5EFFF] px-1.5 py-0.5 rounded font-medium border border-[#BCD4F9]">
                    Tightened by Signal
                  </span>
                )}
              </div>
            </div>

            {/* Scenario toggle */}
            <div className="bg-[#EDF3FC] p-1 rounded-xl border border-[#CADCF5] flex items-center gap-1">
              {(['conservative', 'base', 'aggressive'] as Scenario[]).map((scen) => (
                <button
                  key={scen}
                  id={`scenario-${scen}-btn`}
                  onClick={() => onSelectScenario(scen)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    scenario === scen
                      ? 'bg-[#0047BA] text-[#FFFFFF] shadow-xs'
                      : 'text-[#486386] hover:text-[#0A2146] hover:bg-[#DDE7F6]'
                  }`}
                >
                  {scen === 'base' ? 'Base Case' : scen}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-[#0047BA] rounded-sm" />
                <span className="font-semibold text-[#0B254E]">Projected Weekly Sales (Base)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3 bg-[#0047BA]/20 rounded-xs border border-[#0047BA]/40" />
                <span className="text-[#506A8C]">Uncertainty Band (±{netUncertaintyPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                <span className="text-[#506A8C]">Break-Even Target</span>
              </div>
            </div>

            <div className="text-[11px] text-[#607C9F]">
              Tip: Hover any week along the curve for detailed units & revenue
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="relative w-full overflow-x-auto bg-[#FAFCFF] border border-[#D9E5F5] rounded-xl p-2 sm:p-4 shadow-inner">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[580px]"
              aria-label="12-Week Demand Forecast Chart"
            >
              <defs>
                {/* Gradient for uncertainty area in Chagee royal blue */}
                <linearGradient id="uncertaintyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0052CC" stopOpacity="0.22" />
                  <stop offset="50%" stopColor="#0047BA" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0047BA" stopOpacity="0.04" />
                </linearGradient>

                {/* Subtle vertical bar hover effect */}
                <linearGradient id="hoverColGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0047BA" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0047BA" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines & Y-axis labels */}
              {yTicks.map((val, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={chartWidth - padding.right}
                    y2={getY(val)}
                    stroke="#E2ECF8"
                    strokeDasharray={i === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={getY(val) + 4}
                    textAnchor="end"
                    className="text-[10px] fill-[#6480A3] font-medium"
                  >
                    {val.toLocaleString()}
                  </text>
                </g>
              ))}

              {/* Break-even horizontal line */}
              {outputs.financials.breakEvenUnits <= yMax && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(outputs.financials.breakEvenUnits)}
                    x2={chartWidth - padding.right}
                    y2={getY(outputs.financials.breakEvenUnits)}
                    stroke="#DC2626"
                    strokeDasharray="4 4"
                    strokeWidth="1.5"
                    opacity="0.75"
                  />
                  <text
                    x={chartWidth - padding.right}
                    y={getY(outputs.financials.breakEvenUnits) - 6}
                    textAnchor="end"
                    className="text-[9px] fill-[#B91C1C] font-bold"
                  >
                    Break-Even: {outputs.financials.breakEvenUnits.toLocaleString()} cups/wk
                  </text>
                </g>
              )}

              {/* Shaded Uncertainty Band */}
              <path
                d={areaShadingPath}
                fill="url(#uncertaintyGradient)"
                className="transition-all duration-300"
              />

              {/* Upper Bound dashed line */}
              <path
                d={upperPath}
                fill="none"
                stroke="#0052CC"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.65"
              />

              {/* Lower Bound dashed line */}
              <path
                d={lowerReversedPath.replace(/^L/, 'M')}
                fill="none"
                stroke="#0052CC"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.65"
              />

              {/* Base Forecast Curve in Chagee royal blue */}
              <path
                d={basePath}
                fill="none"
                stroke="#0047BA"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Data points & Interactive hover targets */}
              {forecastPoints.map((point, index) => {
                const cx = getX(index);
                const cy = getY(point.baseVolume);
                const isHovered = hoveredWeek?.week === point.week;
                const isLaunchWeek = point.week === 1;
                const isBreakEvenPoint = point.week === outputs.financials.breakEvenWeek;

                return (
                  <g
                    key={point.week}
                    onMouseEnter={() => setHoveredWeek(point)}
                    onMouseLeave={() => setHoveredWeek(null)}
                    className="cursor-pointer"
                  >
                    {/* Hover vertical column highlight */}
                    {isHovered && (
                      <rect
                        x={cx - 18}
                        y={padding.top}
                        width={36}
                        height={plotHeight}
                        fill="url(#hoverColGrad)"
                        rx={4}
                      />
                    )}

                    {/* Point halo on hover */}
                    {isHovered && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill="#0052CC"
                        opacity="0.3"
                      />
                    )}

                    {/* Main dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : isLaunchWeek ? 4.8 : 3.8}
                      fill={isBreakEvenPoint ? '#DC2626' : isLaunchWeek ? '#D4AF37' : '#0047BA'}
                      stroke="#FFFFFF"
                      strokeWidth={1.8}
                      className="transition-transform duration-150"
                    />

                    {/* X-axis label */}
                    <text
                      x={cx}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className={`text-[10px] ${
                        isHovered ? 'fill-[#0047BA] font-bold' : 'fill-[#6480A3] font-medium'
                      }`}
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text
                x={padding.left}
                y={18}
                className="text-[10px] fill-[#547399] font-semibold"
              >
                Weekly Cups
              </text>
              <text
                x={chartWidth - padding.right}
                y={chartHeight - 12}
                textAnchor="end"
                className="text-[10px] fill-[#547399] font-semibold"
              >
                Post-Launch Timeline
              </text>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredWeek && (
              <div className="mt-3 p-3 bg-[#09224E] text-[#F3F7FD] rounded-xl border border-[#1C4382] text-xs flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <span className="font-bold text-sm">{hoveredWeek.label} Projection:</span>
                  <span className="font-display text-base font-bold text-[#F3DE96]">
                    {hoveredWeek.baseVolume.toLocaleString()} cups
                  </span>
                  <span className="text-[#A2C4F2]">
                    (Range: {hoveredWeek.lowerBound.toLocaleString()} – {hoveredWeek.upperBound.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[#CFE2FA]">
                  <div>
                    Est. Revenue:{' '}
                    <strong className="text-[#FFFFFF]">
                      ${hoveredWeek.weeklyRevenue.toLocaleString()} USD
                    </strong>
                  </div>
                  <div>
                    Status:{' '}
                    <span className={hoveredWeek.isBreakEven ? 'text-[#85E1FF] font-bold' : 'text-[#F6B26B]'}>
                      {hoveredWeek.isBreakEven ? 'Cash Flow Positive' : 'Initial Payback Stage'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forecast Key Logic Banner */}
          <div className="mt-4 p-3 rounded-xl bg-[#F3F7FD] border border-[#D5E3F7] text-xs text-[#415C7F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0047BA] shrink-0" />
              <span>
                <strong>Launch Curve Dynamics:</strong> Weeks 1-2 reflect peak launch promotion spike (1.38x).
                Weeks 3-4 reflect post-hype normalization before steady loyalty repeat kicks in.
              </span>
            </div>
            <button
              onClick={onNavigateToMembership}
              className="text-xs font-semibold text-[#0047BA] hover:text-[#002D72] underline shrink-0 transition"
            >
              Adjust Membership Signals →
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Operational Outputs Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0A2146]">
              Three Recommended Operational Outputs
            </h2>
            <p className="text-xs text-[#506A8C]">
              Derived directly from the {scenario.toUpperCase()} 12-week launch curve & similarity score.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EDF3FC] text-[#0047BA] border border-[#CADCF5]">
            Scenario: {scenario === 'base' ? 'Base Case' : scenario.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Output 1: Recommended Opening Inventory */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#D9E4F5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#567295] mb-2">
                <span className="font-semibold uppercase tracking-wider">Output 1</span>
                <span className="px-2 py-0.5 rounded bg-[#EBF3FE] text-[#0047BA] font-semibold border border-[#D0E2FA]">
                  +{outputs.inventory.bufferPercentage}% Safety Buffer
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] flex items-center justify-center text-[#0047BA]">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0A2146]">
                  Opening Inventory Level
                </h3>
              </div>
              <p className="text-xs text-[#4E688A] mb-4">
                Recommended 2-week launch stock buffer based on estimated opening volume.
              </p>

              <div className="space-y-3 bg-[#F8FAFD] p-3.5 rounded-xl border border-[#DCE7F7]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#3E5C85]">Premium Loose-Leaf Tea:</span>
                  <span className="font-display text-base font-bold text-[#092552]">
                    {outputs.inventory.teaLeavesKg.toLocaleString()} kg
                  </span>
                </div>
                <div className="w-full bg-[#E2ECF8] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#003896] h-full" style={{ width: '82%' }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#3E5C85]">Fresh Dairy & Oat Milk:</span>
                  <span className="font-display text-base font-bold text-[#092552]">
                    {outputs.inventory.dairyLiters.toLocaleString()} L
                  </span>
                </div>
                <div className="w-full bg-[#E2ECF8] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0052CC] h-full" style={{ width: '74%' }} />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#3E5C85]">Insulated Cups & Straws:</span>
                  <span className="font-display text-base font-bold text-[#092552]">
                    {outputs.inventory.cupsAndStrawsUnits.toLocaleString()} units
                  </span>
                </div>
                <div className="w-full bg-[#E2ECF8] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2B7FFF] h-full" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF3FC] text-[11px] text-[#5A779E]">
              Covers peak rush demand for Weeks 1 & 2 without stockouts or transit delays.
            </div>
          </div>

          {/* Output 2: Recommended Opening Staffing */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#D9E4F5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#567295] mb-2">
                <span className="font-semibold uppercase tracking-wider">Output 2</span>
                <span className="px-2 py-0.5 rounded bg-[#FDF6E2] text-[#866311] font-semibold border border-[#EADBAC]">
                  2-3 Shifts / Day
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#FDF6E2] flex items-center justify-center text-[#866311]">
                  <Users2 className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0A2146]">
                  Opening-Week Staffing
                </h3>
              </div>
              <p className="text-xs text-[#4E688A] mb-4">
                Recommended team deployment to manage opening day queues and beverage handoffs.
              </p>

              <div className="space-y-3 bg-[#F8FAFD] p-3.5 rounded-xl border border-[#DCE7F7]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#3E5C85]">Total Store Roster:</span>
                  <span className="font-display text-xl font-bold text-[#092552]">
                    {outputs.staffing.totalOpeningStaff} Persons
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#D9E5F5]">
                    <div className="text-[10px] text-[#5D7B9F]">Peak Baristas/Shift</div>
                    <div className="font-bold text-sm text-[#0047BA] mt-0.5">
                      {outputs.staffing.peakBaristasPerShift} Baristas
                    </div>
                  </div>
                  <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#D9E5F5]">
                    <div className="text-[10px] text-[#5D7B9F]">Prep Leads & QC</div>
                    <div className="font-bold text-sm text-[#0047BA] mt-0.5">
                      {outputs.staffing.prepAndLeadCount} Shift Leads
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#44628B] pt-1">
                  <span>Weekly Labor Hours:</span>
                  <span className="font-semibold text-[#0B254E]">
                    ~{outputs.staffing.estimatedShiftHoursWeekly} Hours
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF3FC] text-[11px] text-[#5A779E]">
              Calibrated for ~32 cups/hour/barista speed during rush-hour order surges.
            </div>
          </div>

          {/* Output 3: Projected Break-Even Week */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#D9E4F5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#567295] mb-2">
                <span className="font-semibold uppercase tracking-wider">Output 3</span>
                <span className="px-2 py-0.5 rounded bg-[#EBF3FE] text-[#0047BA] font-semibold border border-[#D0E2FA]">
                  Financial Payback
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#EBF3FE] flex items-center justify-center text-[#0047BA]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold text-[#0A2146]">
                  Projected Break-Even
                </h3>
              </div>
              <p className="text-xs text-[#4E688A] mb-4">
                Estimated milestone when cumulative retail revenue surpasses all opening operational costs.
              </p>

              <div className="bg-[#F8FAFD] p-3.5 rounded-xl border border-[#DCE7F7] text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#0047BA]">
                  Cumulative Cash Flow Positive
                </div>
                <div className="font-display text-3xl font-extrabold text-[#092552] mt-1">
                  {outputs.financials.breakEvenWeek <= 12
                    ? `Week ${outputs.financials.breakEvenWeek}`
                    : '> Week 12'}
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE7F7] flex justify-between text-xs text-[#3E5C85]">
                  <span>Weekly Hurdle:</span>
                  <span className="font-bold text-[#0B254E]">
                    {outputs.financials.breakEvenUnits.toLocaleString()} cups/wk
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#3E5C85]">
                  <span>Month 1 Projected:</span>
                  <span className="font-bold text-[#0B254E]">
                    {outputs.financials.projectedFirstMonthCups.toLocaleString()} cups
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EDF3FC] text-[11px] text-[#5A779E]">
              Based on 68% gross margin and ${newMarket.typicalTicketUSD.toFixed(2)} average cup ticket.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
