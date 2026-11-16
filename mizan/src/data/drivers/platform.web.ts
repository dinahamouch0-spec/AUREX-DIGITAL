import { WebStorageDriver } from './web';

export function createPlatformDriver() {
  return new WebStorageDriver();
}
