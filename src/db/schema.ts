/**
 * Schéma SQLite et migrations.
 *
 * `user_version` porte la version du schéma : chaque migration est une fonction
 * idempotente appliquée séquentiellement, ce qui rend la mise à jour sûre sur un
 * appareil qui revient en ligne après des mois hors ligne.
 */

export const SCHEMA_VERSION = 1;

export const DDL_V1 = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS couple_profile (
  couple_id      TEXT PRIMARY KEY,
  partner_a_name TEXT NOT NULL,
  partner_b_name TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  consent_tier   TEXT NOT NULL DEFAULT 'decouverte',
  deepest_level  TEXT NOT NULL DEFAULT 'connaissance',
  chimie         INTEGER NOT NULL DEFAULT 0,
  confiance      INTEGER NOT NULL DEFAULT 0,
  complicite     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  consent_tier     TEXT NOT NULL DEFAULT 'decouverte',
  blocked_tags     TEXT NOT NULL DEFAULT '[]',
  blocked_triggers TEXT NOT NULL DEFAULT '[]',
  visibility       TEXT NOT NULL DEFAULT 'prive',
  haptics          INTEGER NOT NULL DEFAULT 1,
  echo_bot_enabled INTEGER NOT NULL DEFAULT 1,
  age_confirmed    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS session (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  level              TEXT NOT NULL,
  mode               TEXT NOT NULL,
  answered           INTEGER NOT NULL DEFAULT 0,
  skipped            INTEGER NOT NULL DEFAULT 0,
  chimie             INTEGER NOT NULL DEFAULT 0,
  confiance          INTEGER NOT NULL DEFAULT 0,
  complicite         INTEGER NOT NULL DEFAULT 0,
  deepest_sensitivity INTEGER NOT NULL DEFAULT 0,
  night_session      INTEGER NOT NULL DEFAULT 0,
  played_at          TEXT NOT NULL,
  sync_state         TEXT NOT NULL DEFAULT 'local'
);

CREATE INDEX IF NOT EXISTS idx_session_played_at ON session(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_sync_state ON session(sync_state);

CREATE TABLE IF NOT EXISTS answer (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  card_id     TEXT NOT NULL,
  level       TEXT NOT NULL,
  kind        TEXT NOT NULL,
  outcome     TEXT NOT NULL,
  sensitivity INTEGER NOT NULL DEFAULT 0,
  reciprocal  INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  answered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_answer_session ON answer(session_id);
CREATE INDEX IF NOT EXISTS idx_answer_card ON answer(card_id);

CREATE TABLE IF NOT EXISTS deck (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  level       TEXT NOT NULL,
  description TEXT,
  occasion    TEXT,
  cards_json  TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS badge (
  id           TEXT PRIMARY KEY,
  unlocked_at  TEXT NOT NULL
);
`;

export type Migration = { version: number; sql: string };

/**
 * Liste ordonnée des migrations. Ajouter une entrée ici (version supérieure)
 * suffit à faire évoluer le schéma sur tous les appareils au prochain démarrage.
 */
export const MIGRATIONS: Migration[] = [{ version: 1, sql: DDL_V1 }];

export function migrationsToApply(currentVersion: number): Migration[] {
  return MIGRATIONS.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);
}
