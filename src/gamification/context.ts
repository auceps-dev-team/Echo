import type { BadgeContext } from './badges';
import { EMPTY_BADGE_CONTEXT, evaluateBadges } from './badges';
import type { PointTotals } from './points';
import { ZERO_POINTS } from './points';
import type { AnswerRow, SessionRow } from '../db/types';
import type { LevelId } from '../theme/levels';
import { LEVEL_ORDER } from '../theme/levels';

/**
 * Construction du contexte de gamification à partir de l'historique.
 *
 * Les badges ne sont jamais stockés comme un état indépendant : ils sont
 * RECALCULÉS depuis les sessions et les réponses. Conséquence : aucune
 * désynchronisation possible, et un utilisateur peut effacer/rejouer sans
 * corrompre sa progression.
 */

export type ProgressionInput = {
  sessions: readonly SessionRow[];
  answers: readonly AnswerRow[];
  decksCreated?: number;
  cardsCreated?: number;
  weeklyChallengesWon?: number;
};

export type Progression = {
  context: BadgeContext;
  points: PointTotals;
  unlockedBadgeIds: string[];
  completedSessions: number;
  deepestLevel: LevelId;
};

function levelRank(level: LevelId): number {
  return LEVEL_ORDER.indexOf(level);
}

export function buildProgression(input: ProgressionInput): Progression {
  const sessions = input.sessions;

  const points = sessions.reduce<PointTotals>(
    (acc, s) => ({
      chimie: acc.chimie + s.chimie,
      confiance: acc.confiance + s.confiance,
      complicite: acc.complicite + s.complicite,
    }),
    { ...ZERO_POINTS },
  );

  const deepestLevel = sessions.reduce<LevelId>(
    (best, s) => (levelRank(s.level) > levelRank(best) ? s.level : best),
    'connaissance',
  );

  const deepestSensitivity = input.answers.reduce((max, a) => Math.max(max, a.sensitivity), 0);

  const longestStreakDays = computeLongestStreak(sessions.map((s) => s.playedAt));

  const context: BadgeContext = {
    ...EMPTY_BADGE_CONTEXT,
    completedSessions: sessions.length,
    answeredCards: input.answers.filter((a) => a.outcome === 'answered').length,
    skippedCards: input.answers.filter((a) => a.outcome === 'skipped').length,
    binaryAnswers: input.answers.filter((a) => a.kind === 'binaire' && a.outcome === 'answered').length,
    reciprocalAnswers: input.answers.filter((a) => a.reciprocal === 1 && a.outcome === 'answered').length,
    deepestSensitivity,
    deepestLevel,
    decksCreated: input.decksCreated ?? 0,
    cardsCreated: input.cardsCreated ?? 0,
    nightSessions: sessions.filter((s) => s.nightSession === 1).length,
    longestStreakDays,
    weeklyChallengesWon: input.weeklyChallengesWon ?? 0,
  };

  return {
    context,
    points,
    unlockedBadgeIds: evaluateBadges(context).map((b) => b.id),
    completedSessions: sessions.length,
    deepestLevel,
  };
}

/** Plus longue série de jours consécutifs avec au moins une session. */
export function computeLongestStreak(isoDates: readonly string[]): number {
  const days = new Set<string>();
  for (const iso of isoDates) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) continue;
    days.add(date.toISOString().slice(0, 10));
  }
  if (days.size === 0) return 0;

  const sorted = [...days].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = new Date(`${sorted[i - 1]}T00:00:00.000Z`);
    const today = new Date(`${sorted[i]}T00:00:00.000Z`);
    const diffDays = Math.round((today.getTime() - previous.getTime()) / 86_400_000);
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
