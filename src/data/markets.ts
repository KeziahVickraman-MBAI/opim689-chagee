import type { NewMarket, ExistingMarket, MarketProfile, SimilarityFactors } from '../types';

/* Benchmark and target markets: SYNTHETIC, illustrative profiles (not measured data). They inform the similarity
 * heuristic and the pre-launch member counts only; demand volume and costs come from the deck's assumptions.json.
 * Each market has a profile of four 0-100 scores; a pair's baseline similarity factors compare the two profiles
 * (see pairBaseline below), so the same target scores differently against different benchmarks. */

export const EXISTING_MARKETS: ExistingMarket[] = [
  {
    id: 'singapore',
    name: 'Singapore (Orchard / CBD)',
    country: 'Singapore',
    flag: '🇸🇬',
    storeFormat: 'High-Street Flagship & Transit Hub',
    brandMaturityYears: 4,
    profile: { youthAffinity: 72, competitiveIntensity: 88, incomeLevel: 92, urbanDensity: 90 },
    notes: 'High disposable income, high specialty milk tea adoption, dense mall retail footprint.'
  },
  {
    id: 'kuala-lumpur',
    name: 'Kuala Lumpur (Bukit Bintang)',
    country: 'Malaysia',
    flag: '🇲🇾',
    storeFormat: 'Lifestyle Mall Concept',
    brandMaturityYears: 5,
    profile: { youthAffinity: 80, competitiveIntensity: 78, incomeLevel: 60, urbanDensity: 82 },
    notes: 'Established tea culture, high viral tear-and-win cup mechanic adoption, strong repeat rate.'
  },
  {
    id: 'bangkok',
    name: 'Bangkok (Siam Paragon / Sukhumvit)',
    country: 'Thailand',
    flag: '🇹🇭',
    storeFormat: 'Mall & Boulevard Kiosk',
    brandMaturityYears: 3,
    profile: { youthAffinity: 82, competitiveIntensity: 80, incomeLevel: 55, urbanDensity: 86 },
    notes: 'Hot climate year-round, preference for iced fresh milk tea, heavy food delivery volume.'
  },
  {
    id: 'shanghai',
    name: 'Shanghai (Jingan / Xintiandi)',
    country: 'China',
    flag: '🇨🇳',
    storeFormat: 'Flagship Cultural Concept Store',
    brandMaturityYears: 6,
    profile: { youthAffinity: 75, competitiveIntensity: 95, incomeLevel: 70, urbanDensity: 94 },
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
    initialAppPreRegs: 28500,
    initialWaitlist: 14200,
    marketContext: 'Cold winters with strong indoor café culture, rapid Instagrammable beverage trends, sophisticated consumer palate.',
    profile: { youthAffinity: 78, competitiveIntensity: 90, incomeLevel: 85, urbanDensity: 92 }
  },
  {
    id: 'manila',
    name: 'Manila (BGC / Makati)',
    country: 'Philippines',
    flag: '🇵🇭',
    defaultExistingMarketId: 'kuala-lumpur',
    membershipAvailableDefault: false,
    cityTier: 'High-Growth Emerging Capital',
    initialAppPreRegs: 8200,
    initialWaitlist: 4500,
    marketContext: 'Immense youth demographic, strong sweet-profile and milk tea passion, social-first word of mouth.',
    profile: { youthAffinity: 88, competitiveIntensity: 70, incomeLevel: 55, urbanDensity: 82 }
  },
  {
    id: 'ho-chi-minh-city',
    name: 'Ho Chi Minh City (District 1)',
    country: 'Vietnam',
    flag: '🇻🇳',
    defaultExistingMarketId: 'bangkok',
    membershipAvailableDefault: true,
    cityTier: 'Dynamic Southeast Asian Hub',
    initialAppPreRegs: 22000,
    initialWaitlist: 9800,
    marketContext: 'Deep indigenous tea/coffee drinking rituals, scooter-friendly pickup culture, high premiumization demand.',
    profile: { youthAffinity: 85, competitiveIntensity: 75, incomeLevel: 50, urbanDensity: 85 }
  },
  {
    id: 'tokyo',
    name: 'Tokyo (Shibuya / Omotesando)',
    country: 'Japan',
    flag: '🇯🇵',
    defaultExistingMarketId: 'singapore',
    membershipAvailableDefault: true,
    cityTier: 'Global Metropolis',
    initialAppPreRegs: 34000,
    initialWaitlist: 16500,
    marketContext: 'Extreme quality standards, aesthetic packaging affinity, high foot-traffic transit retail.',
    profile: { youthAffinity: 70, competitiveIntensity: 92, incomeLevel: 90, urbanDensity: 96 }
  },
  {
    id: 'jakarta',
    name: 'Jakarta (PIK / Senopati)',
    country: 'Indonesia',
    flag: '🇮🇩',
    defaultExistingMarketId: 'kuala-lumpur',
    membershipAvailableDefault: false,
    cityTier: 'Rapid Urban Growth Hub',
    initialAppPreRegs: 11500,
    initialWaitlist: 6100,
    marketContext: 'Massive Gen-Z consumer base, air-conditioned mall lifestyle, viral TikTok food culture.',
    profile: { youthAffinity: 86, competitiveIntensity: 68, incomeLevel: 52, urbanDensity: 80 }
  }
];

/* Similarity factors. Each is a CLOSENESS score between the target and benchmark market (100 = same conditions),
 * not an attractiveness score: a target with much more competition than its benchmark scores LOW on
 * competitive-conditions similarity, just as one with much less would. */
export const FACTOR_CONFIGS: readonly {
  id: keyof SimilarityFactors; profileKey: keyof MarketProfile; name: string; weight: number; weightLabel: string;
  description: string; lowLabel: string; highLabel: string;
}[] = [
  {
    id: 'demographicFit',
    profileKey: 'youthAffinity',
    name: 'Demographic similarity',
    weight: 0.30,
    weightLabel: '30%',
    description: 'How closely the target matches the benchmark on the Gen-Z/Millennial share and tea-drinking frequency.',
    lowLabel: 'Very different',
    highLabel: 'Same profile'
  },
  {
    id: 'competitiveDensity',
    profileKey: 'competitiveIntensity',
    name: 'Competitive-conditions similarity',
    weight: 0.25,
    weightLabel: '25%',
    description: 'How closely the density of specialty tea and coffee competitors matches the benchmark. More competition is not better or worse here; a gap in either direction lowers the score.',
    lowLabel: 'Very different',
    highLabel: 'Same conditions'
  },
  {
    id: 'incomeLevel',
    profileKey: 'incomeLevel',
    name: 'Income similarity',
    weight: 0.25,
    weightLabel: '25%',
    description: 'How closely purchasing power for a premium freshly brewed cup matches the benchmark.',
    lowLabel: 'Very different',
    highLabel: 'Same level'
  },
  {
    id: 'urbanDensity',
    profileKey: 'urbanDensity',
    name: 'Urban and transit similarity',
    weight: 0.20,
    weightLabel: '20%',
    description: 'How closely foot traffic, transit access and mall density match the benchmark.',
    lowLabel: 'Very different',
    highLabel: 'Same density'
  }
];

/* Points of similarity lost per point of profile gap: a 10-point gap gives a factor of 80; a gap of 50+ gives 0. */
export const PAIR_GAP_PENALTY = 2;

/* Baseline factors for one market pair: 100 - PAIR_GAP_PENALTY x |target profile - benchmark profile|, clamped to 0-100. */
export function pairBaseline(target: NewMarket, benchmark: ExistingMarket): SimilarityFactors {
  const out = {} as SimilarityFactors;
  for (const f of FACTOR_CONFIGS) {
    const gap = Math.abs(target.profile[f.profileKey] - benchmark.profile[f.profileKey]);
    out[f.id] = Math.max(0, Math.min(100, Math.round(100 - PAIR_GAP_PENALTY * gap)));
  }
  return out;
}

/* Weighted sum of the four factors, one decimal. A ranking aid for choosing a benchmark; changes no model number. */
export function similarityIndex(f: SimilarityFactors): number {
  return Math.round(FACTOR_CONFIGS.reduce((a, c) => a + f[c.id] * c.weight, 0) * 10) / 10;
}

export const findTarget = (id: string): NewMarket => NEW_MARKETS.find(m => m.id === id) || NEW_MARKETS[0];
export const findBenchmark = (id: string): ExistingMarket => EXISTING_MARKETS.find(m => m.id === id) || EXISTING_MARKETS[0];
