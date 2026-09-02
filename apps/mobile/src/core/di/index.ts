export * from './container';
export * from './registerServices';
export * from './registerRepositories';
export * from './registerUseCases';

import { registerServices } from './registerServices';
import { registerRepositories } from './registerRepositories';
import { registerUseCases } from './registerUseCases';

export function initializeDI() {
  registerServices();
  registerRepositories();
  registerUseCases();
}
