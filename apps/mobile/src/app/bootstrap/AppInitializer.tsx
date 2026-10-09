import React, { useEffect, useState } from 'react';
import { ServiceRegistry } from './ServiceRegistry';
import { initializeDI } from '../../core/di';

export function AppInitializer() {
  const [initialized, setInitialized] = useState(false);
  console.log('>>> [BOOT] AppInitializer rendering, initialized:', initialized);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('>>> [BOOT] initializeDI starting');
        initializeDI();
        console.log('>>> [BOOT] initializeDI finished');
        setInitialized(true);
      } catch (error) {
        console.error('>>> [BOOT] Initialization failed', error);
      }
    };
    initialize();
  }, []);

  if (!initialized) {
    console.log(
      '>>> [BOOT] AppInitializer: initialized is false, returning null',
    );
    return null;
  }

  return <ServiceRegistry />;
}
