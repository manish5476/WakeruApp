import { DIContainer } from './container';
import { DefaultFeatureFlagService } from '../feature-flags/FeatureFlagService';
import { HttpClient } from '../network/HttpClient';
import config from '../config';

export function registerServices() {
  DIContainer.register('FeatureFlagService', new DefaultFeatureFlagService());

  DIContainer.register(
    'HttpClient',
    new HttpClient({
      baseUrl: config.API_URL,
    }),
  );
}
