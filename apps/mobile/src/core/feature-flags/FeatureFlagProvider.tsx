import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  FeatureFlagService,
  DefaultFeatureFlagService,
} from './FeatureFlagService';

interface FeatureFlagContextValue {
  service: FeatureFlagService;
  isReady: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(
  undefined,
);

export function FeatureFlagProvider({
  children,
  service = new DefaultFeatureFlagService(),
}: {
  children: React.ReactNode;
  service?: FeatureFlagService;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    service
      .refreshFlags()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true));
  }, [service]);

  return (
    <FeatureFlagContext.Provider value={{ service, isReady }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error(
      'useFeatureFlags must be used within a FeatureFlagProvider',
    );
  }
  return context;
}
