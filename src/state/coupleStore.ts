import { create } from 'zustand';

import type { CoupleProfileRow } from '../db/types';
import { newCoupleId } from '../db/types';
import type { PointTotals } from '../gamification/points';
import { addPoints, bondIndex, ZERO_POINTS } from '../gamification/points';
import { BADGES, EMPTY_BADGE_CONTEXT } from '../gamification/badges';
import { buildProgression } from '../gamification/context';
import type { AnswerRow, SessionRow } from '../db/types';
import type { LevelId } from '../theme/levels';
import { getLevel } from '../theme/levels';

/**
 * Profil couple — le vecteur de toute la gamification collaborative.
 *
 * Aucun point individuel n'existe : tout est agrégé sur le couple. L'état est
 * dérivé de l'historique (sessions + réponses), donc recalculable à volonté.
 */

export type CoupleState = {
  profile: CoupleProfileRow | null;
  sessions: SessionRow[];
  answers: AnswerRow[];
  decksCreated: number;
  cardsCreated: number;
  points: PointTotals;
  badgeIds: string[];
  hydrated: boolean;

  createCouple(partnerAName: string, partnerBName: string): CoupleProfileRow;
  hydrate(input: {
    profile: CoupleProfileRow | null;
    sessions: SessionRow[];
    answers: AnswerRow[];
    decksCreated: number;
    cardsCreated: number;
  }): void;
  recordSession(input: { session: SessionRow; answers: AnswerRow[] }): void;
  countDeck(deckCardCount: number): void;
  bond(): number;
  currentLevel(): LevelId;
};

function emptyProfile(partnerAName: string, partnerBName: string): CoupleProfileRow {
  return {
    coupleId: newCoupleId(),
    partnerAName: partnerAName.trim(),
    partnerBName: partnerBName.trim(),
    createdAt: new Date().toISOString(),
    consentTier: 'decouverte',
    deepestLevel: 'connaissance',
    chimie: 0,
    confiance: 0,
    complicite: 0,
  };
}

function recompute(
  profile: CoupleProfileRow | null,
  sessions: SessionRow[],
  answers: AnswerRow[],
  decksCreated: number,
  cardsCreated: number,
): { points: PointTotals; badgeIds: string[]; deepestLevel: LevelId } {
  const progression = buildProgression({ sessions, answers, decksCreated, cardsCreated });
  const deepestLevel = progression.deepestLevel;
  const nextProfile = profile ? { ...profile, deepestLevel } : null;
  // `nextProfile` sert à maintenir le niveau le plus profond côté base de données.
  void nextProfile;
  return { points: progression.points, badgeIds: progression.unlockedBadgeIds, deepestLevel };
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  profile: null,
  sessions: [],
  answers: [],
  decksCreated: 0,
  cardsCreated: 0,
  points: { ...ZERO_POINTS },
  badgeIds: [],
  hydrated: false,

  createCouple(partnerAName, partnerBName) {
    const profile = emptyProfile(partnerAName, partnerBName);
    set({ profile, sessions: [], answers: [], points: { ...ZERO_POINTS }, badgeIds: [], hydrated: true });
    return profile;
  },

  hydrate(input) {
    const derived = recompute(input.profile, input.sessions, input.answers, input.decksCreated, input.cardsCreated);
    set({
      profile: input.profile ? { ...input.profile, deepestLevel: derived.deepestLevel } : null,
      sessions: input.sessions,
      answers: input.answers,
      decksCreated: input.decksCreated,
      cardsCreated: input.cardsCreated,
      points: derived.points,
      badgeIds: derived.badgeIds,
      hydrated: true,
    });
  },

  recordSession(input) {
    const sessions = [input.session, ...get().sessions];
    const answers = [...input.answers, ...get().answers];
    const derived = recompute(get().profile, sessions, answers, get().decksCreated, get().cardsCreated);
    set((state) => ({
      sessions,
      answers,
      points: derived.points,
      badgeIds: derived.badgeIds,
      profile: state.profile
        ? {
            ...state.profile,
            deepestLevel: derived.deepestLevel,
            chimie: derived.points.chimie,
            confiance: derived.points.confiance,
            complicite: derived.points.complicite,
          }
        : null,
    }));
  },

  countDeck(deckCardCount) {
    const decksCreated = get().decksCreated + 1;
    const cardsCreated = get().cardsCreated + deckCardCount;
    const derived = recompute(get().profile, get().sessions, get().answers, decksCreated, cardsCreated);
    set({ decksCreated, cardsCreated, points: derived.points, badgeIds: derived.badgeIds });
  },

  bond() {
    return bondIndex(get().points);
  },

  currentLevel() {
    const sessions = get().sessions.length;
    const deepest = get().profile?.deepestLevel ?? 'connaissance';
    return getLevel(deepest).unlocksAfterSessions <= sessions ? deepest : 'connaissance';
  },
}));

/** Sélecteurs dérivés (utilisés par les écrans, hors render si possible). */
export const selectBadges = (state: CoupleState) =>
  BADGES.filter((badge) => state.badgeIds.includes(badge.id));

export const selectLockedBadges = (state: CoupleState) =>
  BADGES.filter((badge) => !state.badgeIds.includes(badge.id));

export const selectBadgeContext = (state: CoupleState) =>
  buildProgression({
    sessions: state.sessions,
    answers: state.answers,
    decksCreated: state.decksCreated,
    cardsCreated: state.cardsCreated,
  }).context;

export const selectEmptyContext = () => EMPTY_BADGE_CONTEXT;

/** Points ajoutés par la dernière session (pour l'écran de fin de partie). */
export function lastSessionPoints(state: CoupleState): PointTotals | null {
  const last = state.sessions[0];
  if (!last) return null;
  return addPoints(ZERO_POINTS, {
    chimie: last.chimie,
    confiance: last.confiance,
    complicite: last.complicite,
  });
}
