import React, { useEffect, useState } from 'react';
import { DIContainer } from '../../core/di';
import { FeatureFlagService } from '../../core/feature-flags';
import { ProviderComposer } from './ProviderComposer';

export function ServiceRegistry() {
  const [servicesReady, setServicesReady] = useState(false);
  console.log(
    '>>> [BOOT] ServiceRegistry rendering, servicesReady:',
    servicesReady,
  );

  useEffect(() => {
    const initServices = async () => {
      try {
        console.log('>>> [BOOT] resolving FeatureFlagService');
        const featureFlagService =
          DIContainer.resolve<FeatureFlagService>('FeatureFlagService');
        console.log('>>> [BOOT] refreshing feature flags');
        await featureFlagService.refreshFlags();
        console.log('>>> [BOOT] feature flags refreshed');
      } catch (err) {
        console.warn('>>> [BOOT] Failed to refresh feature flags', err);
      }
      setServicesReady(true);
    };

    initServices();
  }, []);

  if (!servicesReady) {
    console.log(
      '>>> [BOOT] ServiceRegistry: servicesReady is false, returning null',
    );
    return null;
  }

  return <ProviderComposer />;
}
