import { NewMarket, ExistingMarket } from '../types';

export const EXISTING_MARKETS: ExistingMarket[] = [
  {
    id: 'singapore',
    name: 'Singapore (Orchard / CBD)',
    country: 'Singapore',
    flag: '🇸🇬',
    matureWeeklyCups: 8800,
    avgTicketUSD: 5.8,
    storeFormat: 'High-Street Flagship & Transit Hub',
    operatingCostWeeklyUSD: 9400,
    brandMaturityYears: 4,
    notes: 'High disposable income, high specialty milk tea adoption, dense mall retail footprint.'
  },
  {
    id: 'kuala-lumpur',
    name: 'Kuala Lumpur (Bukit Bintang)',
    country: 'Malaysia',
    flag: '🇲🇾',
    matureWeeklyCups: 9600,
    avgTicketUSD: 3.9,
    storeFormat: 'Lifestyle Mall Concept',
    operatingCostWeeklyUSD: 6800,
    brandMaturityYears: 5,
    notes: 'Established tea culture, high viral tear-and-win cup mechanic adoption, strong repeat rate.'
  },
  {
    id: 'bangkok',
    name: 'Bangkok (Siam Paragon / Sukhumvit)',
    country: 'Thailand',
    flag: '🇹🇭',
    matureWeeklyCups: 8200,
    avgTicketUSD: 3.4,
    storeFormat: 'Mall & Boulevard Kiosk',
    operatingCostWeeklyUSD: 5900,
    brandMaturityYears: 3,
    notes: 'Hot climate year-round, preference for iced fresh milk tea, heavy food delivery volume.'
  },
  {
    id: 'shanghai',
    name: 'Shanghai (Jingan / Xintiandi)',
    country: 'China',
    flag: '🇨🇳',
    matureWeeklyCups: 11500,
    avgTicketUSD: 4.2,
    storeFormat: 'Flagship Cultural Concept Store',
    operatingCostWeeklyUSD: 10200,
    brandMaturityYears: 6,
    notes: 'Mature premium tea landscape, high mobile ordering app penetration (90%+).'
  }
];

export const NEW_MARKETS: NewMarket[] = [
  {
    id: 'seoul',
    name: 'Seoul (Gangnam / Hongdae)',
    country: 'South Korea',
    flag: '🇰🇷',
    defaultExistingMarketId: 'singapore',
    membershipAvailableDefault: true,
    cityTier: 'Global Tier 1 Megacity',
    typicalTicketUSD: 5.2,
    initialAppPreRegs: 28500,
    initialSocialScore: 84,
    initialWaitlist: 14200,
    marketContext: 'Cold winters with strong indoor café culture, rapid Instagrammable beverage trends, sophisticated consumer palate.',
    baselineFactors: {
      demographicFit: 82,
      competitiveDensity: 88, // high coffee/tea café concentration
      incomeLevel: 86,
      urbanDensity: 92
    }
  },
  {
    id: 'manila',
    name: 'Manila (BGC / Makati)',
    country: 'Philippines',
    flag: '🇵🇭',
    defaultExistingMarketId: 'kuala-lumpur',
    membershipAvailableDefault: false,
    cityTier: 'High-Growth Emerging Capital',
    typicalTicketUSD: 3.6,
    initialAppPreRegs: 8200,
    initialSocialScore: 68,
    initialWaitlist: 4500,
    marketContext: 'Immense youth demographic, strong sweet-profile and milk tea passion, social-first word of mouth.',
    baselineFactors: {
      demographicFit: 88,
      competitiveDensity: 74,
      incomeLevel: 62,
      urbanDensity: 84
    }
  },
  {
    id: 'ho-chi-minh-city',
    name: 'Ho Chi Minh City (District 1)',
    country: 'Vietnam',
    flag: '🇻🇳',
    defaultExistingMarketId: 'bangkok',
    membershipAvailableDefault: true,
    cityTier: 'Dynamic Southeast Asian Hub',
    typicalTicketUSD: 3.2,
    initialAppPreRegs: 22000,
    initialSocialScore: 78,
    initialWaitlist: 9800,
    marketContext: 'Deep indigenous tea/coffee drinking rituals, scooter-friendly pickup culture, high premiumization demand.',
    baselineFactors: {
      demographicFit: 79,
      competitiveDensity: 82,
      incomeLevel: 60,
      urbanDensity: 88
    }
  },
  {
    id: 'tokyo',
    name: 'Tokyo (Shibuya / Omotesando)',
    country: 'Japan',
    flag: '🇯🇵',
    defaultExistingMarketId: 'singapore',
    membershipAvailableDefault: true,
    cityTier: 'Global Metropolis',
    typicalTicketUSD: 5.6,
    initialAppPreRegs: 34000,
    initialSocialScore: 89,
    initialWaitlist: 16500,
    marketContext: 'Extreme quality standards, aesthetic packaging affinity, high foot-traffic transit retail.',
    baselineFactors: {
      demographicFit: 84,
      competitiveDensity: 76,
      incomeLevel: 92,
      urbanDensity: 95
    }
  },
  {
    id: 'jakarta',
    name: 'Jakarta (PIK / Senopati)',
    country: 'Indonesia',
    flag: '🇮🇩',
    defaultExistingMarketId: 'kuala-lumpur',
    membershipAvailableDefault: false,
    cityTier: 'Rapid Urban Growth Hub',
    typicalTicketUSD: 3.5,
    initialAppPreRegs: 11500,
    initialSocialScore: 72,
    initialWaitlist: 6100,
    marketContext: 'Massive Gen-Z consumer base, air-conditioned mall lifestyle, viral TikTok food culture.',
    baselineFactors: {
      demographicFit: 86,
      competitiveDensity: 70,
      incomeLevel: 58,
      urbanDensity: 80
    }
  }
];

export const FACTOR_CONFIGS = [
  {
    id: 'demographicFit',
    name: 'Demographic Fit',
    weight: 0.30,
    weightLabel: '30%',
    description: 'Alignment of target Gen-Z/Millennial age bracket, tea beverage consumption frequency, and lifestyle affinity.',
    lowLabel: 'Low Affinity',
    highLabel: 'Ideal Target Match'
  },
  {
    id: 'competitiveDensity',
    name: 'Competitive Density',
    weight: 0.25,
    weightLabel: '25%',
    description: 'Concentration of established specialty coffee & bubble tea brands within a 1km radius (market education vs. clutter).',
    lowLabel: 'Uncontested / Low Awareness',
    highLabel: 'Dense Specialty Hub'
  },
  {
    id: 'incomeLevel',
    name: 'Income Level Proximity',
    weight: 0.25,
    weightLabel: '25%',
    description: 'Purchasing power parity and willingness to pay premium price tiers ($3.50 – $6.00+ per freshly brewed cup).',
    lowLabel: 'Budget Constrained',
    highLabel: 'High Disposable Discretionary'
  },
  {
    id: 'urbanDensity',
    name: 'Urban & Transit Density',
    weight: 0.20,
    weightLabel: '20%',
    description: 'Pedestrian foot-traffic volume, proximity to metro/transit nodes, and grade-A shopping mall density.',
    lowLabel: 'Suburban / Dispersed',
    highLabel: 'Dense Transit Corridor'
  }
] as const;
