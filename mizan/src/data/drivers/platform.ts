import { SQLiteDriver } from './sqlite';

export function createPlatformDriver() {
  return new SQLiteDriver();
}
