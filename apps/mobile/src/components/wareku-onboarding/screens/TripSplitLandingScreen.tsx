import React, { useState, useRef } from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import { LandingNavBar } from '../components/LandingNavBar';
import { PremiumHeroSection } from '../components/PremiumHeroSection';
import { StatRibbon } from '../components/StatRibbon';
import { ProblemTransformationSection } from '../components/ProblemTransformationSection';
import { ExpenseSplittingShowcase } from '../components/ExpenseSplittingShowcase';
import { MultiCurrencyShowcase } from '../components/MultiCurrencyShowcase';
import { ItineraryShowcase } from '../components/ItineraryShowcase';
import { AiReceiptShowcase } from '../components/AiReceiptShowcase';
import { SettlementShowcase } from '../components/SettlementShowcase';
import { TripWrappedShowcase } from '../components/TripWrappedShowcase';
import { FeatureDirectorySection } from '../components/FeatureDirectorySection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FinalCtaBanner } from '../components/FinalCtaBanner';
import { LandingFooter } from '../components/LandingFooter';
import { FeatureDetailModal } from '../components/FeatureDetailModal';

export default function TripSplitLandingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeModalFeature, setActiveModalFeature] = useState<string | null>(
    null,
  );

  const handleStartTrip = () => {
    router.push('/(auth)/login');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleGetApp = () => {
    router.push('/(auth)/login');
  };

  const handleOpenDemo = () => {
    setActiveModalFeature('all');
  };

  const handleNavigateSection = (section: string) => {
    if (section === 'pricing' || section === 'features') {
      setActiveModalFeature('all');
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Sticky-Style Top Navigation Bar */}
      <LandingNavBar
        onLogin={handleLogin}
        onGetApp={handleGetApp}
        onNavigateSection={handleNavigateSection}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* 1. Hero Section (Launchpad) */}
        <PremiumHeroSection onStartTrip={handleStartTrip} />

        {/* 2. Stats / Trust Ribbon */}
        <StatRibbon />

        {/* 3. The Core Philosophy / Problem & Transformation */}
        <ProblemTransformationSection />

        {/* 4. Primary Core 1: Expense Splitting Showcase */}
        <ExpenseSplittingShowcase />

        {/* 5. Primary Core 2: Multi-Currency FX Engine */}
        <MultiCurrencyShowcase />

        {/* 6. Secondary 1: Smart Itinerary & Travel Planning */}
        <ItineraryShowcase />

        {/* 7. Secondary 2: AI Receipt OCR Itemizer */}
        <AiReceiptShowcase />

        {/* 8. Primary Core 3: Graph Debt Reduction & 1-Tap UPI */}
        <SettlementShowcase />

        {/* 9. Emotional Climax: Trip Stories & Wrapped */}
        <TripWrappedShowcase />

        {/* 10. Typographic Capability Directory (No card walls) */}
        <FeatureDirectorySection onOpenDemo={handleOpenDemo} />

        {/* 11. Social Proof: Traveler Testimonials */}
        <TestimonialsSection />

        {/* 12. Final CTA Banner */}
        <FinalCtaBanner onStartTrip={handleStartTrip} />

        {/* 13. Minimalist Footer */}
        <LandingFooter onNavigateSection={handleNavigateSection} />
      </ScrollView>

      {/* Interactive Feature Deep Dive Simulator */}
      <FeatureDetailModal
        visible={!!activeModalFeature}
        featureId={activeModalFeature}
        onClose={() => setActiveModalFeature(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
