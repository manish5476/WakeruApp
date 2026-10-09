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

  console.log(
    '>>> [BOOT] EnvironmentLoader rendering, config:',
    !!config,
    'error:',
    error,
  );

  useEffect(() => {
    try {
      console.log('>>> [BOOT] createRuntimeConfig starting');
      const cfg = createRuntimeConfig();
      console.log('>>> [BOOT] createRuntimeConfig result:', cfg);
      setConfig(cfg);
    } catch (err: any) {
      console.error(
        '>>> [BOOT] createRuntimeConfig error, falling back to onrender:',
        err,
      );
      setConfig({ apiBaseUrl: 'https://wakeru.onrender.com/api/v1' });
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
    console.log('>>> [BOOT] EnvironmentLoader: config is null, returning null');
    return null;
  }

  return (
    <EnvironmentContext.Provider value={config}>
      <AppInitializer />
    </EnvironmentContext.Provider>
  );
}
