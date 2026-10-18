import type { Card, Deck } from '../content/types';
import type { PointTotals } from '../gamification/points';
import { ZERO_POINTS } from '../gamification/points';
import type { ConsentTier, LevelId } from '../theme/levels';
import type {
  AnswerRow,
  CoupleProfileRow,
  EchoStorage,
  SessionRow,
  SettingsRow,
} from './types';
import { DEFAULT_SETTINGS } from './types';

/**
 * Stockage en mémoire — socle partagé.
 *
 * Sert de base à `storage.web.ts` (qui le sérialise dans localStorage) et de
 * doublure pour les tests Jest : on peut ainsi tester toute la couche de
 * données sans module natif ni mock SQLite.
 */
export function createMemoryStorage(): EchoStorage {
  let profile: CoupleProfileRow | null = null;
  let settings: SettingsRow = { ...DEFAULT_SETTINGS };
  let sessions: SessionRow[] = [];
  let answers: AnswerRow[] = [];
  let decks: Deck[] = [];
  let seq = 0;

  const nextId = () => ++seq;

  return {
    driver: 'memory',

    async init() {},
    async close() {},

    async getProfile() {
      return profile;
    },
    async saveProfile(next) {
      profile = { ...next };
    },

    async getSettings() {
      return settings;
    },
    async saveSettings(next) {
      settings = { ...next };
    },

    async insertSession(input) {
      const row: SessionRow = { ...input, id: nextId() };
      sessions.unshift(row);
      return row.id;
    },
    async listSessions(limit = 100) {
      return sessions.slice(0, limit).map((s) => ({ ...s }));
    },

    async insertAnswer(input) {
      const row: AnswerRow = { ...input, id: nextId() };
      answers.unshift(row);
      return row.id;
    },
    async listAnswers(sessionId) {
      const rows = sessionId === undefined ? answers : answers.filter((a) => a.sessionId === sessionId);
      return rows.map((a) => ({ ...a }));
    },
    async recentCardIds(limit = 200) {
      return answers.slice(0, limit).map((a) => a.cardId);
    },

    async insertDeck(deck) {
      decks = decks.filter((d) => d.id !== deck.id).concat(deck);
    },
    async listDecks() {
      return decks.map((d) => ({ ...d }));
    },
    async deleteDeck(deckId) {
      decks = decks.filter((d) => d.id !== deckId);
    },

    async listCustomCards(level?: LevelId): Promise<Card[]> {
      const all = decks.flatMap((d) => d.cards);
      return level ? all.filter((c) => c.level === level) : all;
    },

    async pointTotals(): Promise<PointTotals> {
      return sessions.reduce<PointTotals>(
        (acc, s) => ({
          chimie: acc.chimie + s.chimie,
          confiance: acc.confiance + s.confiance,
          complicite: acc.complicite + s.complicite,
        }),
        { ...ZERO_POINTS },
      );
    },

    async wipeAll() {
      profile = null;
      settings = { ...DEFAULT_SETTINGS };
      sessions = [];
      answers = [];
      decks = [];
      seq = 0;
    },
  };
}

export type { ConsentTier };
