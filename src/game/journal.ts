import type { LevelId } from '../theme/levels';
import { getLevel } from '../theme/levels';

/**
 * Journal de Bord Relationnel.
 *
 * L'historique n'est pas une liste chronologique froide : chaque session est
 * transformée en un mini-récit positif. Ces générateurs sont des fonctions
 * pures — la même entrée produit toujours le même récit, ce qui permet de les
 * tester et de les régénérer à volonté.
 */

export type JournalEntryInput = {
  date: Date;
  level: LevelId;
  cardsAnswered: number;
  cardsSkipped: number;
  deepestSensitivity: number;
  reciprocalAnswers: number;
  points: { chimie: number; confiance: number; complicite: number };
  /** Titre ou extrait de la carte la plus marquante de la session. */
  highlight?: string;
  partnerName?: string;
};

export type JournalEntry = {
  title: string;
  narrative: string;
  statsLine: string;
  tone: 'leger' | 'chaleureux' | 'profond';
};

const LEVEL_MOMENT: Record<LevelId, string> = {
  connaissance: 'découverte',
  ami: 'connivence',
  couple: 'compréhension',
  fiance: 'profondeur',
};

function tone(level: LevelId, deepest: number): JournalEntry['tone'] {
  if (level === 'fiance' || deepest >= 3) return 'profond';
  if (level === 'couple' || deepest >= 2) return 'chaleureux';
  return 'leger';
}

export function buildJournalEntry(input: JournalEntryInput): JournalEntry {
  const level = getLevel(input.level);
  const partner = input.partnerName ?? 'votre partenaire';
  const t = tone(input.level, input.deepestSensitivity);
  const dateLabel = input.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const titles: Record<JournalEntry['tone'], string> = {
    leger: `Une soirée légère — ${dateLabel}`,
    chaleureux: `Un moment de ${LEVEL_MOMENT[input.level]} — ${dateLabel}`,
    profond: `Vous êtes allés plus loin — ${dateLabel}`,
  };

  const highlight = input.highlight
    ? ` Le moment le plus marquant : « ${input.highlight} ».`
    : '';

  const reciprocalLine =
    input.reciprocalAnswers >= 2
      ? ` Vous avez répondu à ${input.reciprocalAnswers} questions l'un pour l'autre : c'est la réciprocité qui creuse le lien.`
      : '';

  const skippedLine =
    input.cardsSkipped > 0
      ? ` ${input.cardsSkipped} question(s) passée(s) — et c'est très bien : le consentement fait partie du jeu.`
      : '';

  const narrative =
    `Niveau « ${level.label} » (${level.phaseLabel.toLowerCase()}).` +
    ` Vous avez complété ${input.cardsAnswered} carte(s).` +
    highlight +
    reciprocalLine +
    skippedLine +
    ` Aujourd'hui, vous avez appris quelque chose de nouveau sur ${partner}.`;

  const statsLine =
    `+${input.points.chimie} chimie · +${input.points.confiance} confiance · +${input.points.complicite} complicité`;

  return { title: titles[t], narrative, statsLine, tone: t };
}

/**
 * Résumé de relation affiché sur le profil couple : synthèse chaleureuse des
 * N dernières sessions, jamais un tableau de chiffres brut.
 */
export function buildRelationshipSummary(input: {
  totalSessions: number;
  totalPoints: { chimie: number; confiance: number; complicite: number };
  currentLevel: LevelId;
  deepestLevelReached: LevelId;
  badgesCount: number;
  partnerName?: string;
}): string {
  const partner = input.partnerName ?? 'votre partenaire';
  const deepest = getLevel(input.deepestLevelReached);
  if (input.totalSessions === 0) {
    return `Votre journal est vide pour l'instant. Une première session suffit à ouvrir le niveau « ${getLevel(input.currentLevel).label} ».`;
  }
  const sessionsWord = input.totalSessions > 1 ? 'sessions' : 'session';
  return (
    `En ${input.totalSessions} ${sessionsWord}, vous avez accumulé ${input.totalPoints.chimie} points de chimie ` +
    `et ${input.totalPoints.confiance} de confiance avec ${partner}. ` +
    `Le plus profond que vous ayez exploré ensemble : le niveau « ${deepest.label} » (${deepest.phaseLabel.toLowerCase()}).` +
    (input.badgesCount > 0 ? ` ${input.badgesCount} badge(s) témoignent de ce parcours.` : '')
  );
}
