import React, { useEffect, useState } from 'react';
import { DIContainer } from '../../core/di';
import { FeatureFlagService } from '../../core/feature-flags';
import { ProviderComposer } from './ProviderComposer';

export function ServiceRegistry() {
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    const initServices = async () => {
      try {
        const featureFlagService =
          DIContainer.resolve<FeatureFlagService>('FeatureFlagService');
        await featureFlagService.refreshFlags();
      } catch (err) {
        console.warn('Failed to refresh feature flags', err);
      }
      setServicesReady(true);
    };

    initServices();
  }, []);

  if (!servicesReady) {
    return null;
  }

  return <ProviderComposer />;
}
