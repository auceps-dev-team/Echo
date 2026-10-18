import { bondIndex, addPoints, dominantCategory, ZERO_POINTS } from '../src/gamification/points';
import { evaluateBadges, EMPTY_BADGE_CONTEXT, BADGES } from '../src/gamification/badges';
import { buildProgression, computeLongestStreak } from '../src/gamification/context';
import type { AnswerRow, SessionRow } from '../src/db/types';

function session(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 1,
    level: 'couple',
    mode: 'classique',
    answered: 6,
    skipped: 1,
    chimie: 20,
    confiance: 20,
    complicite: 15,
    deepestSensitivity: 2,
    nightSession: 0,
    playedAt: '2026-10-01T20:00:00.000Z',
    ...overrides,
  };
}

function answer(overrides: Partial<AnswerRow> = {}): AnswerRow {
  return {
    id: 1,
    sessionId: 1,
    cardId: 'p-v-01',
    level: 'couple',
    kind: 'verite',
    outcome: 'answered',
    sensitivity: 2,
    reciprocal: 1,
    note: null,
    answeredAt: '2026-10-01T20:05:00.000Z',
    ...overrides,
  };
}

describe('points catégorisés', () => {
  it('addPoints additionne sans muter l état précédent', () => {
    const before = { ...ZERO_POINTS };
    const after = addPoints(before, { chimie: 5, confiance: 3 });
    expect(after).toEqual({ chimie: 5, confiance: 3, complicite: 0 });
    expect(before).toEqual(ZERO_POINTS);
  });

  it('l indice de lien PUNIT les déséquilibres (anti-farming)', () => {
    const balanced = bondIndex({ chimie: 150, confiance: 150, complicite: 150 });
    const farmed = bondIndex({ chimie: 300, confiance: 10, complicite: 300 });
    expect(balanced).toBeGreaterThan(farmed);
  });

  it('l indice de lien croît avec une progression équilibrée', () => {
    const low = bondIndex({ chimie: 10, confiance: 10, complicite: 10 });
    const high = bondIndex({ chimie: 100, confiance: 100, complicite: 100 });
    expect(high).toBeGreaterThan(low);
  });

  it('dominantCategory identifie la ressource la plus développée', () => {
    expect(dominantCategory({ chimie: 1, confiance: 9, complicite: 3 })).toBe('confiance');
  });
});

describe('badges partagés', () => {
  it('aucun badge sans historique', () => {
    expect(evaluateBadges(EMPTY_BADGE_CONTEXT)).toEqual([]);
  });

  it('Première fois se débloque dès la première session', () => {
    const badges = evaluateBadges({ ...EMPTY_BADGE_CONTEXT, completedSessions: 1 });
    expect(badges.map((b) => b.id)).toContain('premiere-fois');
  });

  it('Partage profond exige une réponse de sensibilité 3', () => {
    const partial = evaluateBadges({ ...EMPTY_BADGE_CONTEXT, deepestSensitivity: 2, answeredCards: 5 });
    expect(partial.map((b) => b.id)).not.toContain('partage-profond');
    const full = evaluateBadges({ ...EMPTY_BADGE_CONTEXT, deepestSensitivity: 3, answeredCards: 1 });
    expect(full.map((b) => b.id)).toContain('partage-profond');
  });

  it('refuser des questions débloque un badge POSITIF, jamais punitif', () => {
    const badges = evaluateBadges({ ...EMPTY_BADGE_CONTEXT, skippedCards: 3 });
    const respect = badges.find((b) => b.id === 'respect-du-rythme');
    expect(respect).toBeDefined();
    expect(respect?.label).toMatch(/rythme/i);
  });

  it('les badges de niveau Fiancé et de nuit blanche sont privés (hors classement)', () => {
    const privateBadges = BADGES.filter((b) => b.private);
    expect(privateBadges.map((b) => b.id)).toEqual(expect.arrayContaining(['niveau-fiance', 'nuit-blanche']));
  });

  it('Créateurs de contenu récompense la personnalisation', () => {
    const badges = evaluateBadges({ ...EMPTY_BADGE_CONTEXT, decksCreated: 1 });
    expect(badges.map((b) => b.id)).toContain('createur-de-contenu');
  });
});

describe('progression dérivée de l historique', () => {
  it('agrège les points de toutes les sessions', () => {
    const progression = buildProgression({
      sessions: [session({ chimie: 10, confiance: 10, complicite: 10 }), session({ id: 2, chimie: 5, confiance: 5, complicite: 5 })],
      answers: [],
    });
    expect(progression.points).toEqual({ chimie: 15, confiance: 15, complicite: 15 });
    expect(progression.completedSessions).toBe(2);
  });

  it('retient le niveau le plus profond atteint', () => {
    const progression = buildProgression({
      sessions: [session({ level: 'connaissance' }), session({ id: 2, level: 'fiance' })],
      answers: [],
    });
    expect(progression.deepestLevel).toBe('fiance');
  });

  it('compte les réponses binaires pour le badge Expert en questions directes', () => {
    const answers = Array.from({ length: 20 }, (_, i) => answer({ id: i + 1, kind: 'binaire', outcome: 'answered' }));
    const progression = buildProgression({ sessions: [session()], answers });
    expect(progression.context.binaryAnswers).toBe(20);
    expect(progression.unlockedBadgeIds).toContain('expert-questions-directes');
  });

  it('ignore les réponses annulées dans le compteur de réciprocité', () => {
    const progression = buildProgression({
      sessions: [session()],
      answers: [answer({ reciprocal: 1, outcome: 'skipped' }), answer({ id: 2, reciprocal: 1, outcome: 'answered' })],
    });
    expect(progression.context.reciprocalAnswers).toBe(1);
  });
});

describe('séries de jours consécutifs', () => {
  it('détecte une série de 3 jours', () => {
    expect(computeLongestStreak(['2026-10-01T10:00:00Z', '2026-10-02T10:00:00Z', '2026-10-03T10:00:00Z'])).toBe(3);
  });

  it('ne compte pas deux sessions du même jour deux fois', () => {
    expect(computeLongestStreak(['2026-10-01T10:00:00Z', '2026-10-01T22:00:00Z'])).toBe(1);
  });

  it('reprend la meilleure série après une interruption', () => {
    expect(
      computeLongestStreak([
        '2026-10-01T10:00:00Z',
        '2026-10-05T10:00:00Z',
        '2026-10-06T10:00:00Z',
        '2026-10-07T10:00:00Z',
        '2026-10-08T10:00:00Z',
      ]),
    ).toBe(4);
  });

  it('retourne 0 sans historique', () => {
    expect(computeLongestStreak([])).toBe(0);
  });
});
