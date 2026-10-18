import { createStorage } from './storage';
import type { EchoStorage } from './types';

/**
 * Point d'entrée unique de la persistance.
 *
 * `./storage` est résolu par Metro selon la plateforme :
 *   - iOS / Android → storage.ts       (expo-sqlite)
 *   - web           → storage.web.ts   (localStorage)
 * TypeScript, lui, type-checke storage.ts : le contrat `EchoStorage` est
 * identique dans les deux cas.
 */

let instance: EchoStorage | null = null;
let initPromise: Promise<EchoStorage> | null = null;

export async function getStorage(): Promise<EchoStorage> {
  if (instance) return instance;
  if (!initPromise) {
    initPromise = (async () => {
      const storage = createStorage();
      await storage.init();
      instance = storage;
      return storage;
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export function peekStorage(): EchoStorage | null {
  return instance;
}

/** Test uniquement : réinitialise le singleton. */
export function __resetStorageForTests(): void {
  instance = null;
  initPromise = null;
}

export type {
  AnswerRow,
  CoupleProfileRow,
  EchoStorage,
  SessionRow,
  SettingsRow,
} from './types';
export { DEFAULT_SETTINGS, isNightSession, newCoupleId } from './types';
export { SCHEMA_VERSION, MIGRATIONS, migrationsToApply } from './schema';
export { createMemoryStorage } from './storage.memory';
