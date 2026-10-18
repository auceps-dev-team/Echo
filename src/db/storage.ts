import * as SQLite from 'expo-sqlite';

import type { Card, Deck, TriggerCategory } from '../content/types';
import { parseCard, parseDeck } from '../content/types';
import type { PointTotals } from '../gamification/points';
import { ZERO_POINTS } from '../gamification/points';
import type { ConsentTier, LevelId } from '../theme/levels';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';
import type {
  AnswerRow,
  CoupleProfileRow,
  EchoStorage,
  SessionRow,
  SettingsRow,
} from './types';
import { DEFAULT_SETTINGS } from './types';

/**
 * Implémentation NATIVE — expo-sqlite (iOS / Android, cible Expo Go).
 *
 * Pourquoi SQLite et pas AsyncStorage : l'historique, les réponses et les
 * decks personnalisés forment un volume de données relationnel croissant.
 * SQLite offre les agrégations (sommes de points, anti-répétition par requête)
 * sans charger l'ensemble en mémoire JS, et reste 100 % compatible Expo Go —
 * contrairement à WatermelonDB, qui exige un build natif personnalisé (EAS).
 *
 * Ce fichier est `storage.ts` (sans suffixe) : Metro le choisit sur iOS et
 * Android, tandis que `storage.web.ts` prend le relais sur le web.
 */

const DB_NAME = 'echo.db';

type DbSettingsRow = {
  consent_tier: string;
  blocked_tags: string;
  blocked_triggers: string;
  visibility: string;
  haptics: number;
  echo_bot_enabled: number;
  age_confirmed: number;
};

type DbSessionRow = {
  id: number;
  level: string;
  mode: string;
  answered: number;
  skipped: number;
  chimie: number;
  confiance: number;
  complicite: number;
  deepest_sensitivity: number;
  night_session: number;
  played_at: string;
};

type DbAnswerRow = {
  id: number;
  session_id: number;
  card_id: string;
  level: string;
  kind: string;
  outcome: string;
  sensitivity: number;
  reciprocal: number;
  note: string | null;
  answered_at: string;
};

type DbProfileRow = {
  couple_id: string;
  partner_a_name: string;
  partner_b_name: string;
  created_at: string;
  consent_tier: string;
  deepest_level: string;
  chimie: number;
  confiance: number;
  complicite: number;
};

type DbDeckRow = {
  id: string;
  name: string;
  level: string;
  description: string | null;
  occasion: string | null;
  cards_json: string;
  created_at: string;
};

function parseJsonArray<T>(raw: string): T[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

export function createStorage(): EchoStorage {
  let db: SQLite.SQLiteDatabase | null = null;

  const ensure = (): SQLite.SQLiteDatabase => {
    if (!db) throw new Error('EchoStorage: init() doit être appelé avant toute opération.');
    return db;
  };

  return {
    driver: 'sqlite',

    async init() {
      if (db) return;
      db = await SQLite.openDatabaseAsync(DB_NAME);
      const current = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      const from = current?.user_version ?? 0;
      for (const migration of MIGRATIONS) {
        if (migration.version <= from) continue;
        await db.execAsync(migration.sql);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      }
      if (from === 0 && SCHEMA_VERSION > 0) {
        // Ligne de paramètres unique : l'app ne gère qu'un seul couple à la fois.
        await db.runAsync(
          `INSERT OR IGNORE INTO settings (id, consent_tier, blocked_tags, blocked_triggers, visibility, haptics, echo_bot_enabled, age_confirmed)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
          DEFAULT_SETTINGS.consentTier,
          JSON.stringify(DEFAULT_SETTINGS.blockedTags),
          JSON.stringify(DEFAULT_SETTINGS.blockedTriggers),
          DEFAULT_SETTINGS.visibility,
          DEFAULT_SETTINGS.haptics ? 1 : 0,
          DEFAULT_SETTINGS.echoBotEnabled ? 1 : 0,
          DEFAULT_SETTINGS.ageConfirmed ? 1 : 0,
        );
      }
    },

    async close() {
      if (db) {
        await db.closeAsync();
        db = null;
      }
    },

    async getProfile(): Promise<CoupleProfileRow | null> {
      const row = await ensure().getFirstAsync<DbProfileRow>(
        'SELECT * FROM couple_profile ORDER BY created_at DESC LIMIT 1',
      );
      if (!row) return null;
      return {
        coupleId: row.couple_id,
        partnerAName: row.partner_a_name,
        partnerBName: row.partner_b_name,
        createdAt: row.created_at,
        consentTier: row.consent_tier as ConsentTier,
        deepestLevel: row.deepest_level as LevelId,
        chimie: row.chimie,
        confiance: row.confiance,
        complicite: row.complicite,
      };
    },

    async saveProfile(profile) {
      await ensure().runAsync(
        `INSERT INTO couple_profile (couple_id, partner_a_name, partner_b_name, created_at, consent_tier, deepest_level, chimie, confiance, complicite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(couple_id) DO UPDATE SET
           partner_a_name = excluded.partner_a_name,
           partner_b_name = excluded.partner_b_name,
           consent_tier   = excluded.consent_tier,
           deepest_level  = excluded.deepest_level,
           chimie         = excluded.chimie,
           confiance      = excluded.confiance,
           complicite     = excluded.complicite`,
        profile.coupleId,
        profile.partnerAName,
        profile.partnerBName,
        profile.createdAt,
        profile.consentTier,
        profile.deepestLevel,
        profile.chimie,
        profile.confiance,
        profile.complicite,
      );
    },

    async getSettings(): Promise<SettingsRow | null> {
      const row = await ensure().getFirstAsync<DbSettingsRow>('SELECT * FROM settings WHERE id = 1');
      if (!row) return null;
      return {
        consentTier: row.consent_tier as ConsentTier,
        blockedTags: parseJsonArray<string>(row.blocked_tags),
        blockedTriggers: parseJsonArray<TriggerCategory>(row.blocked_triggers),
        visibility: row.visibility as SettingsRow['visibility'],
        haptics: row.haptics === 1,
        echoBotEnabled: row.echo_bot_enabled === 1,
        ageConfirmed: row.age_confirmed === 1,
      };
    },

    async saveSettings(settings) {
      await ensure().runAsync(
        `UPDATE settings SET consent_tier = ?, blocked_tags = ?, blocked_triggers = ?, visibility = ?, haptics = ?, echo_bot_enabled = ?, age_confirmed = ? WHERE id = 1`,
        settings.consentTier,
        JSON.stringify(settings.blockedTags),
        JSON.stringify(settings.blockedTriggers),
        settings.visibility,
        settings.haptics ? 1 : 0,
        settings.echoBotEnabled ? 1 : 0,
        settings.ageConfirmed ? 1 : 0,
      );
    },

    async insertSession(input): Promise<number> {
      const result = await ensure().runAsync(
        `INSERT INTO session (level, mode, answered, skipped, chimie, confiance, complicite, deepest_sensitivity, night_session, played_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.level,
        input.mode,
        input.answered,
        input.skipped,
        input.chimie,
        input.confiance,
        input.complicite,
        input.deepestSensitivity,
        input.nightSession,
        input.playedAt,
      );
      return Number(result.lastInsertRowId);
    },

    async listSessions(limit = 100): Promise<SessionRow[]> {
      const rows = await ensure().getAllAsync<DbSessionRow>(
        'SELECT * FROM session ORDER BY id DESC LIMIT ?',
        limit,
      );
      return rows.map((r) => ({
        id: r.id,
        level: r.level as LevelId,
        mode: r.mode as SessionRow['mode'],
        answered: r.answered,
        skipped: r.skipped,
        chimie: r.chimie,
        confiance: r.confiance,
        complicite: r.complicite,
        deepestSensitivity: r.deepest_sensitivity,
        nightSession: r.night_session,
        playedAt: r.played_at,
      }));
    },

    async insertAnswer(input): Promise<number> {
      const result = await ensure().runAsync(
        `INSERT INTO answer (session_id, card_id, level, kind, outcome, sensitivity, reciprocal, note, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        input.sessionId,
        input.cardId,
        input.level,
        input.kind,
        input.outcome,
        input.sensitivity,
        input.reciprocal,
        input.note ?? null,
        input.answeredAt,
      );
      return Number(result.lastInsertRowId);
    },

    async listAnswers(sessionId): Promise<AnswerRow[]> {
      const rows =
        sessionId === undefined
          ? await ensure().getAllAsync<DbAnswerRow>('SELECT * FROM answer ORDER BY id DESC')
          : await ensure().getAllAsync<DbAnswerRow>(
              'SELECT * FROM answer WHERE session_id = ? ORDER BY id DESC',
              sessionId,
            );
      return rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        cardId: r.card_id,
        level: r.level as LevelId,
        kind: r.kind,
        outcome: r.outcome as AnswerRow['outcome'],
        sensitivity: r.sensitivity,
        reciprocal: r.reciprocal,
        note: r.note,
        answeredAt: r.answered_at,
      }));
    },

    /**
     * Anti-répétition faite EN BASE : on ne remonte pas tout l'historique en JS.
     * DISTINCT + ORDER BY sur les réponses les plus récentes.
     */
    async recentCardIds(limit = 200): Promise<string[]> {
      const rows = await ensure().getAllAsync<{ card_id: string }>(
        'SELECT DISTINCT card_id FROM answer ORDER BY answered_at DESC LIMIT ?',
        limit,
      );
      return rows.map((r) => r.card_id);
    },

    async insertDeck(deck) {
      await ensure().runAsync(
        `INSERT INTO deck (id, name, level, description, occasion, cards_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name, level = excluded.level, description = excluded.description,
           occasion = excluded.occasion, cards_json = excluded.cards_json`,
        deck.id,
        deck.name,
        deck.level,
        deck.description ?? null,
        deck.occasion ?? null,
        JSON.stringify(deck.cards),
        deck.createdAt ?? new Date().toISOString(),
      );
    },

    async listDecks(): Promise<Deck[]> {
      const rows = await ensure().getAllAsync<DbDeckRow>('SELECT * FROM deck ORDER BY created_at DESC');
      return rows
        .map((r) =>
          parseDeck({
            id: r.id,
            name: r.name,
            level: r.level,
            description: r.description ?? undefined,
            occasion: r.occasion ?? undefined,
            createdAt: r.created_at,
            cards: parseJsonArray(r.cards_json),
          }),
        )
        .filter((result): result is { ok: true; deck: Deck } => result.ok)
        .map((result) => result.deck);
    },

    async deleteDeck(deckId) {
      await ensure().runAsync('DELETE FROM deck WHERE id = ?', deckId);
    },

    async listCustomCards(level?: LevelId): Promise<Card[]> {
      const rows = await ensure().getAllAsync<DbDeckRow>(
        level ? 'SELECT * FROM deck WHERE level = ?' : 'SELECT * FROM deck',
        ...(level ? [level] : []),
      );
      return rows.flatMap((r) =>
        parseJsonArray<unknown>(r.cards_json)
          .map((raw) => parseCard(raw))
          .filter((result): result is { ok: true; card: Card } => result.ok)
          .map((result) => result.card),
      );
    },

    async pointTotals(): Promise<PointTotals> {
      const row = await ensure().getFirstAsync<{ chimie: number; confiance: number; complicite: number }>(
        `SELECT COALESCE(SUM(chimie), 0) AS chimie,
                COALESCE(SUM(confiance), 0) AS confiance,
                COALESCE(SUM(complicite), 0) AS complicite
         FROM session`,
      );
      return row ? { chimie: row.chimie, confiance: row.confiance, complicite: row.complicite } : { ...ZERO_POINTS };
    },

    async wipeAll() {
      const database = ensure();
      await database.execAsync('PRAGMA foreign_keys = OFF');
      for (const table of ['answer', 'session', 'deck', 'badge', 'couple_profile']) {
        await database.runAsync(`DELETE FROM ${table}`);
      }
      await database.runAsync(
        `UPDATE settings SET consent_tier = ?, blocked_tags = '[]', blocked_triggers = '[]', visibility = 'prive', haptics = 1, echo_bot_enabled = 1, age_confirmed = 0 WHERE id = 1`,
        DEFAULT_SETTINGS.consentTier,
      );
      await database.execAsync('PRAGMA foreign_keys = ON');
    },
  };
}
