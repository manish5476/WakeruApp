import React, { useEffect, useState } from 'react';
import {
  createRuntimeConfig,
  RuntimeConfig,
} from '../../core/config/runtimeConfig';
import { AppInitializer } from './AppInitializer';
import { Text, View } from 'react-native';

export const EnvironmentContext = React.createContext<RuntimeConfig | null>(
  null,
);

export function EnvironmentLoader() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cfg = createRuntimeConfig();
      setConfig(cfg);
    } catch (err: any) {
      setError(err.message || 'Failed to load environment configuration');
    }
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Configuration Error: {error}</Text>
      </View>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <EnvironmentContext.Provider value={config}>
      <AppInitializer />
    </EnvironmentContext.Provider>
  );
}
