import type { Card, Deck } from '../content/types';
import { parseDeck } from '../content/types';
import type { PointTotals } from '../gamification/points';
import { ZERO_POINTS } from '../gamification/points';
import type { LevelId } from '../theme/levels';
import type {
  AnswerRow,
  CoupleProfileRow,
  EchoStorage,
  SessionRow,
  SettingsRow,
} from './types';
import { DEFAULT_SETTINGS } from './types';
import { createMemoryStorage } from './storage.memory';

/**
 * Implémentation WEB (aperçu navigateur uniquement).
 *
 * Elle délègue à `createMemoryStorage()` puis sérialise l'état dans
 * localStorage après chaque écriture. C'est volontairement simple : le web
 * n'est PAS la cible de production, c'est l'outil de prévisualisation et de
 * démonstration. La cible réelle (Expo Go / stores) utilise `storage.ts`.
 *
 * `localStorage` est accédé via `globalThis` pour rester compilable sans la
 * lib DOM dans tsconfig (environnement React Native).
 */

const KEY = 'echo.state.v1';

type Persisted = {
  profile: CoupleProfileRow | null;
  settings: SettingsRow;
  sessions: SessionRow[];
  answers: AnswerRow[];
  decks: Deck[];
};

function getLocalStorage(): Storage | null {
  const candidate = (globalThis as unknown as { localStorage?: Storage }).localStorage;
  if (!candidate) return null;
  try {
    candidate.getItem('__echo_probe__');
    return candidate;
  } catch {
    return null; // navigation privée / quota désactivé
  }
}

function readPersisted(): Persisted | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const decks = Array.isArray(parsed.decks)
      ? parsed.decks
          .map((d) => parseDeck(d))
          .filter((r): r is { ok: true; deck: Deck } => r.ok)
          .map((r) => r.deck)
      : [];
    return {
      profile: parsed.profile ?? null,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      sessions: Array.isArray(parsed.sessions) ? (parsed.sessions as SessionRow[]) : [],
      answers: Array.isArray(parsed.answers) ? (parsed.answers as AnswerRow[]) : [],
      decks,
    };
  } catch {
    return null;
  }
}

export function createStorage(): EchoStorage {
  const inner = createMemoryStorage();
  const storage = getLocalStorage();
  let state: Persisted = {
    profile: null,
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
    answers: [],
    decks: [],
  };

  const persist = () => {
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(state));
    } catch {
      // quota dépassé : on continue en mémoire, l'app reste utilisables
    }
  };

  return {
    driver: 'web-localstorage',

    async init() {
      const restored = readPersisted();
      if (restored) {
        state = restored;
        if (state.profile) await inner.saveProfile(state.profile);
        await inner.saveSettings(state.settings);
        for (const s of [...state.sessions].reverse()) {
          const { id: _id, ...rest } = s;
          await inner.insertSession(rest);
        }
        for (const a of [...state.answers].reverse()) {
          const { id: _id, ...rest } = a;
          await inner.insertAnswer(rest);
        }
        for (const d of state.decks) await inner.insertDeck(d);
      } else {
        await inner.saveSettings(state.settings);
        persist();
      }
    },

    async close() {},

    async getProfile() {
      return state.profile;
    },
    async saveProfile(profile) {
      state.profile = { ...profile };
      await inner.saveProfile(profile);
      persist();
    },

    async getSettings() {
      return state.settings;
    },
    async saveSettings(settings) {
      state.settings = { ...settings };
      await inner.saveSettings(settings);
      persist();
    },

    async insertSession(input) {
      const id = await inner.insertSession(input);
      state.sessions.unshift({ ...input, id });
      persist();
      return id;
    },
    async listSessions(limit = 100) {
      return state.sessions.slice(0, limit);
    },

    async insertAnswer(input) {
      const id = await inner.insertAnswer(input);
      state.answers.unshift({ ...input, id });
      persist();
      return id;
    },
    async listAnswers(sessionId) {
      return sessionId === undefined
        ? [...state.answers]
        : state.answers.filter((a) => a.sessionId === sessionId);
    },
    async recentCardIds(limit = 200) {
      return state.answers.slice(0, limit).map((a) => a.cardId);
    },

    async insertDeck(deck) {
      await inner.insertDeck(deck);
      state.decks = state.decks.filter((d) => d.id !== deck.id).concat(deck);
      persist();
    },
    async listDecks() {
      return state.decks;
    },
    async deleteDeck(deckId) {
      await inner.deleteDeck(deckId);
      state.decks = state.decks.filter((d) => d.id !== deckId);
      persist();
    },

    async listCustomCards(level?: LevelId): Promise<Card[]> {
      const all = state.decks.flatMap((d) => d.cards);
      return level ? all.filter((c) => c.level === level) : all;
    },

    async pointTotals(): Promise<PointTotals> {
      return state.sessions.reduce<PointTotals>(
        (acc, s) => ({
          chimie: acc.chimie + s.chimie,
          confiance: acc.confiance + s.confiance,
          complicite: acc.complicite + s.complicite,
        }),
        { ...ZERO_POINTS },
      );
    },

    async wipeAll() {
      await inner.wipeAll();
      state = { profile: null, settings: { ...DEFAULT_SETTINGS }, sessions: [], answers: [], decks: [] };
      if (storage) {
        try {
          storage.removeItem(KEY);
        } catch {}
      }
    },
  };
}
