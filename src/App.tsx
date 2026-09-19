import React, { useState, useMemo } from 'react';
import {
  TabId,
  NewMarket,
  ExistingMarket,
  SimilarityFactors,
  MembershipSignals,
  Scenario
} from './types';
import { NEW_MARKETS, EXISTING_MARKETS } from './data/markets';
import {
  calculateSimilarityScore,
  calculateMembershipSignalIndex,
  generateForecast
} from './utils/calculations';
import { Header } from './components/Header';
import { TabMarketEntry } from './components/TabMarketEntry';
import { TabDemandForecast } from './components/TabDemandForecast';
import { TabMembershipSignal } from './components/TabMembershipSignal';
import { TabForLeeYen } from './components/TabForLeeYen';
import { Footer } from './components/Footer';

export default function App() {
  // Navigation state
  const [activeTab, setActiveTab] = useState<TabId>('market-entry');

  // Market Selection state
  const [newMarket, setNewMarket] = useState<NewMarket>(NEW_MARKETS[0]); // Default: Seoul
  const [existingMarket, setExistingMarket] = useState<ExistingMarket>(
    EXISTING_MARKETS.find((m) => m.id === NEW_MARKETS[0].defaultExistingMarketId) || EXISTING_MARKETS[0]
  );

  // Structural Similarity Factors (customizable via sliders)
  const [factors, setFactors] = useState<SimilarityFactors>({
    ...NEW_MARKETS[0].baselineFactors
  });

  // Demand Forecast Scenario Toggle
  const [scenario, setScenario] = useState<Scenario>('base');

  // Pre-Launch Membership Signals
  const [membershipSignals, setMembershipSignals] = useState<MembershipSignals>({
    dataAvailable: NEW_MARKETS[0].membershipAvailableDefault,
    appPreRegistrations: NEW_MARKETS[0].initialAppPreRegs,
    socialInterestScore: NEW_MARKETS[0].initialSocialScore,
    waitlistSignups: NEW_MARKETS[0].initialWaitlist
  });

  // Handler when user selects a different target new market
  const handleSelectNewMarket = (market: NewMarket) => {
    setNewMarket(market);
    // Find matched default existing market
    const defaultExisting = EXISTING_MARKETS.find((m) => m.id === market.defaultExistingMarketId);
    if (defaultExisting) {
      setExistingMarket(defaultExisting);
    }
    // Update factors to this market's baseline
    setFactors({ ...market.baselineFactors });
    // Update default membership signal state
    setMembershipSignals({
      dataAvailable: market.membershipAvailableDefault,
      appPreRegistrations: market.initialAppPreRegs,
      socialInterestScore: market.initialSocialScore,
      waitlistSignups: market.initialWaitlist
    });
  };

  const handleSelectExistingMarket = (market: ExistingMarket) => {
    setExistingMarket(market);
  };

  const handleUpdateFactor = (key: keyof SimilarityFactors, value: number) => {
    setFactors((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFactors = () => {
    setFactors({ ...newMarket.baselineFactors });
  };

  const handleUpdateSignal = (key: keyof MembershipSignals, value: any) => {
    setMembershipSignals((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Computations
  const similarityScore = useMemo(() => {
    return calculateSimilarityScore(factors);
  }, [factors]);

  const signalMetrics = useMemo(() => {
    return calculateMembershipSignalIndex(membershipSignals);
  }, [membershipSignals]);

  const forecastData = useMemo(() => {
    return generateForecast(
      newMarket,
      existingMarket,
      similarityScore,
      membershipSignals,
      scenario
    );
  }, [newMarket, existingMarket, similarityScore, membershipSignals, scenario]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC] text-[#0A2146]">
      {/* Brand Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        newMarket={newMarket}
        existingMarket={existingMarket}
        similarityScore={similarityScore}
        scenario={scenario}
        membershipAvailable={membershipSignals.dataAvailable}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'market-entry' && (
          <TabMarketEntry
            newMarket={newMarket}
            existingMarket={existingMarket}
            onSelectNewMarket={handleSelectNewMarket}
            onSelectExistingMarket={handleSelectExistingMarket}
            factors={factors}
            onUpdateFactor={handleUpdateFactor}
            onResetFactors={handleResetFactors}
            similarityScore={similarityScore}
            onNavigateToForecast={() => setActiveTab('demand-forecast')}
          />
        )}

        {activeTab === 'demand-forecast' && (
          <TabDemandForecast
            newMarket={newMarket}
            existingMarket={existingMarket}
            similarityScore={similarityScore}
            scenario={scenario}
            onSelectScenario={setScenario}
            forecastPoints={forecastData.points}
            outputs={forecastData.outputs}
            netUncertaintyPct={forecastData.netUncertaintyPct}
            baseUncertaintyPct={forecastData.baseUncertaintyPct}
            membershipSignals={membershipSignals}
            onNavigateToMembership={() => setActiveTab('membership-signal')}
          />
        )}

        {activeTab === 'membership-signal' && (
          <TabMembershipSignal
            newMarket={newMarket}
            signals={membershipSignals}
            onUpdateSignal={handleUpdateSignal}
            similarityScore={similarityScore}
            demandUpliftPct={signalMetrics.demandUpliftPct}
            uncertaintyReductionPct={signalMetrics.uncertaintyReductionPct}
            netUncertaintyPct={forecastData.netUncertaintyPct}
            baseUncertaintyPct={forecastData.baseUncertaintyPct}
            onNavigateToForecast={() => setActiveTab('demand-forecast')}
          />
        )}

        {activeTab === 'for-lee-yen' && (
          <TabForLeeYen onNavigateTab={setActiveTab} />
        )}
      </main>

      {/* Global Disclaimer Footer */}
      <Footer />
    </div>
  );
}
