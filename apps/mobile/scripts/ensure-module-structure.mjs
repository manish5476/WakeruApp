import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const features = [
  'analytics',
  'authentication',
  'budget',
  'dashboard',
  'expenses',
  'finance',
  'friends',
  'leaderboard',
  'notifications',
  'profile',
  'reminders',
  'settlements',
  'stops',
  'templates',
  'transactions',
  'trip',
];
const featureFolders = [
  'presentation/screens',
  'presentation/components',
  'presentation/hooks',
  'presentation/styles',
  'application/services',
  'application/state',
  'application/useCases',
  'domain/models',
  'domain/repositories',
  'infrastructure/api',
  'infrastructure/storage',
  'constants',
  'types',
  'utils',
  'widgets',
  'tests',
];
const topLevelFolders = [
  'app/bootstrap',
  'app/providers',
  'app/routes',
  'assets/fonts',
  'assets/icons',
  'assets/images',
  'assets/lottie',
  'core/analytics',
  'core/authentication',
  'core/config',
  'core/errors',
  'core/feature-flags',
  'core/network',
  'core/offline',
  'core/security',
  'core/storage',
  'design-system/animations',
  'design-system/components',
  'design-system/icons',
  'design-system/layouts',
  'design-system/theme',
  'design-system/tokens',
  'localization',
  'native/android',
  'native/ios',
  'shared/components',
  'shared/constants',
  'shared/hooks',
  'shared/types',
  'shared/utils',
  'shared/widgets',
  'testing/e2e',
  'testing/factories',
  'testing/mocks',
  'testing/renderers',
];

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const sourceRoot = resolve(scriptDirectory, '..', 'src');
for (const directory of topLevelFolders)
  mkdirSync(resolve(sourceRoot, directory), { recursive: true });
for (const feature of features) {
  for (const folder of featureFolders)
    mkdirSync(resolve(sourceRoot, 'features', feature, folder), {
      recursive: true,
    });
}
