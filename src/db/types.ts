import type { Card, Deck, TriggerCategory } from '../content/types';
import type { PointTotals } from '../gamification/points';
import type { ConsentTier, LevelId } from '../theme/levels';
import type { GameMode } from '../game/engine';

/**
 * Couche de persistance — contrat unique.
 *
 * Deux implémentations, sélectionnées par extension de plateforme Metro :
 *  - `storage.ts`      → expo-sqlite (iOS / Android, cible Expo Go)
 *  - `storage.web.ts`  → localStorage (aperçu web uniquement)
 *
 * Pourquoi ce découpage : en SDK 58, Metro ne sait pas résoudre le module
 * WASM `wa-sqlite.wasm` requis par expo-sqlite pour le web ; un import direct
 * fait échouer le bundle web (« Unable to resolve ./wa-sqlite/wa-sqlite.wasm »).
 * Le split de plateforme conserve un contrat identique et un aperçu web complet.
 */

export type SessionRow = {
  id: number;
  level: LevelId;
  mode: GameMode;
  answered: number;
  skipped: number;
  chimie: number;
  confiance: number;
  complicite: number;
  deepestSensitivity: number;
  nightSession: number;
  playedAt: string;
};

export type AnswerRow = {
  id: number;
  sessionId: number;
  cardId: string;
  level: LevelId;
  kind: string;
  outcome: 'answered' | 'skipped';
  sensitivity: number;
  reciprocal: number;
  /** Réponse textuelle chiffrée côté natif — jamais synchronisée par défaut. */
  note?: string | null;
  answeredAt: string;
};

export type CoupleProfileRow = {
  coupleId: string;
  partnerAName: string;
  partnerBName: string;
  createdAt: string;
  consentTier: ConsentTier;
  deepestLevel: LevelId;
  chimie: number;
  confiance: number;
  complicite: number;
};

export type SettingsRow = {
  consentTier: ConsentTier;
  blockedTags: string[];
  blockedTriggers: TriggerCategory[];
  visibility: 'prive' | 'cercle' | 'public';
  haptics: boolean;
  echoBotEnabled: boolean;
  ageConfirmed: boolean;
};

export interface EchoStorage {
  readonly driver: 'sqlite' | 'web-localstorage' | 'memory';
  init(): Promise<void>;
  close(): Promise<void>;

  getProfile(): Promise<CoupleProfileRow | null>;
  saveProfile(profile: CoupleProfileRow): Promise<void>;

  getSettings(): Promise<SettingsRow | null>;
  saveSettings(settings: SettingsRow): Promise<void>;

  insertSession(input: Omit<SessionRow, 'id'>): Promise<number>;
  listSessions(limit?: number): Promise<SessionRow[]>;

  insertAnswer(input: Omit<AnswerRow, 'id'>): Promise<number>;
  /** Sans argument : toutes les réponses (sert à recalculer badges et points). */
  listAnswers(sessionId?: number): Promise<AnswerRow[]>;
  /** Ids récemment joués : alimente l'anti-répétition du moteur. */
  recentCardIds(limit?: number): Promise<string[]>;

  insertDeck(deck: Deck): Promise<void>;
  listDecks(): Promise<Deck[]>;
  deleteDeck(deckId: string): Promise<void>;

  listCustomCards(level?: LevelId): Promise<Card[]>;

  /** Totaux agrégés, calculés en base (SQL) côté natif. */
  pointTotals(): Promise<PointTotals>;

  /** RGPD / consentement : effacement local complet et irréversible. */
  wipeAll(): Promise<void>;
}

export const DEFAULT_SETTINGS: SettingsRow = {
  consentTier: 'decouverte',
  blockedTags: [],
  blockedTriggers: [],
  visibility: 'prive',
  haptics: true,
  echoBotEnabled: true,
  ageConfirmed: false,
};

export function newCoupleId(prefix = 'cpl'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

/** 23 h – 5 h : sert au badge « Nuit blanche inoubliable ». */
export function isNightSession(date: Date): boolean {
  const h = date.getHours();
  return h >= 23 || h < 5;
}
