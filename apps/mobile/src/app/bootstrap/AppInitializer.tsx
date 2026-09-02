import React, { useEffect, useState } from 'react';
import { ServiceRegistry } from './ServiceRegistry';
import { initializeDI } from '../../core/di';

export function AppInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        initializeDI();
        setInitialized(true);
      } catch (error) {
        console.error('Initialization failed', error);
      }
    };
    initialize();
  }, []);

  if (!initialized) {
    return null;
  }

  return <ServiceRegistry />;
}
