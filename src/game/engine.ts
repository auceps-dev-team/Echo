import type { Card, CardKind, TriggerCategory } from '../content/types';
import { getLevel, type ConsentTier, type LevelId } from '../theme/levels';

/**
 * Moteur de contenu.
 *
 * Fonctions pures et déterministes : elles ne dépendent d'aucun module natif,
 * ce qui les rend testables en Jest sans mock et réutilisables telles quelles
 * côté serveur (Cloud Functions / Supabase Edge Function) pour les défis
 * inter-couples.
 *
 * Trois filtres s'appliquent dans cet ordre, du plus contraignant au plus fin :
 *  1. sécurité psychologique (tags/déclencheurs bloqués, plafond de consentement) ;
 *  2. cohérence de niveau (sensibilité max du niveau, rampe de progression) ;
 *  3. variété (exclusion de l'historique, tirage pseudo-aléatoire reproductible).
 */

export type GameMode = 'classique' | 'binaire' | 'rapide';

export type SelectCardInput = {
  level: LevelId;
  mode: GameMode;
  consentTier: ConsentTier;
  blockedTags: readonly string[];
  blockedTriggers: readonly TriggerCategory[];
  /** Ids déjà joués (session courante + historique récent). */
  playedIds: readonly string[];
  /** Avancement dans la session, de 0 à 1. Pilote la rampe de sensibilité. */
  sessionProgress: number;
  /** Graine optionnelle : rend le tirage reproductible (tests, défis synchronisés). */
  seed?: number;
};

export type SelectCardResult =
  | { card: Card; candidates: number; clamped: boolean }
  | { card: null; reason: 'no-content' | 'all-blocked' | 'all-played' };

/** Plafond de sensibilité autorisé par le palier de consentement actif. */
const TIER_CEILING: Record<ConsentTier, number> = { decouverte: 1, confiance: 2, libre: 3 };

export function sensitivityCeiling(level: LevelId, tier: ConsentTier): number {
  return Math.min(getLevel(level).maxSensitivity, TIER_CEILING[tier]);
}

/**
 * Rampe de sensibilité inspirée de la SPT : on commence doux et on approfondit
 * progressivement, plutôt que de frapper d'emblée au plus intime.
 */
export function rampCeiling(level: LevelId, tier: ConsentTier, sessionProgress: number): number {
  const ceiling = sensitivityCeiling(level, tier);
  const progress = Math.min(1, Math.max(0, sessionProgress));
  return Math.min(ceiling, Math.round(progress * ceiling));
}

export function isCardAllowed(
  card: Card,
  input: Pick<SelectCardInput, 'blockedTags' | 'blockedTriggers' | 'consentTier' | 'level'>,
): boolean {
  if (card.sensitivity > sensitivityCeiling(input.level, input.consentTier)) return false;
  if (card.triggerWarnings.some((t) => input.blockedTriggers.includes(t))) return false;
  if (card.tags.some((t) => input.blockedTags.includes(t))) return false;
  return true;
}

/** mulberry32 : générateur 32 bits simple, déterministe, sans dépendance. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const KINDS_BY_MODE: Record<GameMode, CardKind[]> = {
  classique: ['verite', 'action'],
  binaire: ['binaire'],
  rapide: ['verite', 'binaire'],
};

export function selectCard(pool: readonly Card[], input: SelectCardInput): SelectCardResult {
  const kinds = KINDS_BY_MODE[input.mode];

  const safe = pool.filter(
    (card) =>
      (card.level === input.level || (input.mode === 'rapide' && getLevel(card.level).order <= getLevel(input.level).order)) &&
      kinds.includes(card.kind) &&
      isCardAllowed(card, input),
  );
  if (safe.length === 0) return { card: null, reason: 'all-blocked' };

  const unplayed = safe.filter((card) => !input.playedIds.includes(card.id));
  if (unplayed.length === 0) return { card: null, reason: 'all-played' };

  const ramp = rampCeiling(input.level, input.consentTier, input.sessionProgress);
  const inRamp = unplayed.filter((card) => card.sensitivity <= ramp);
  const clamped = inRamp.length > 0;
  const bucket = clamped ? inRamp : unplayed;

  const rng = createRng(input.seed ?? hashSeed(`${input.level}:${input.mode}:${bucket.length}`));
  const index = Math.min(bucket.length - 1, Math.floor(rng() * bucket.length));
  const card = bucket[index];
  if (!card) return { card: null, reason: 'no-content' };

  return { card, candidates: bucket.length, clamped };
}

export type PointsAwarded = { chimie: number; confiance: number; complicite: number };

/**
 * Récompense d'une carte complétée.
 * Un « passer » rapporte la moitié des points de confiance : refuser une
 * question n'est jamais pénalisant, mais répondre profondément reste valorisé.
 */
export function awardFor(
  card: Card,
  outcome: 'answered' | 'skipped',
  level: LevelId,
): PointsAwarded {
  const base = getLevel(level).baseReward;
  const bonus = card.bonusPoints ?? {};
  const factor = outcome === 'answered' ? 1 : 0.5;
  const scale = (value: number) => Math.max(0, Math.round(value * factor));
  return {
    chimie: scale(base.chimie + (bonus.chimie ?? 0)) + (outcome === 'skipped' ? 0 : card.sensitivity),
    confiance: scale(base.confiance + (bonus.confiance ?? 0)),
    complicite: scale(base.complicite + (bonus.complicite ?? 0)) + (card.reciprocal && outcome === 'answered' ? 2 : 0),
  };
}
