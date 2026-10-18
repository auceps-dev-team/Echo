import type { LevelId } from '../theme/levels';

/**
 * Badges partagés : insignes du profil couple, jamais d'un joueur seul.
 *
 * Chaque badge est une prédicat pur sur un contexte de progression, ce qui
 * permet : (a) de les recalculer à tout moment depuis l'historique — pas
 * d'état fantôme ; (b) de les tester unitairement ; (c) d'ajouter des badges
 * événementiels (anniversaire, decks créés) sans toucher au moteur.
 */

export type BadgeContext = {
  completedSessions: number;
  answeredCards: number;
  skippedCards: number;
  binaryAnswers: number;
  reciprocalAnswers: number;
  deepestSensitivity: number;
  deepestLevel: LevelId;
  decksCreated: number;
  cardsCreated: number;
  nightSessions: number;
  longestStreakDays: number;
  weeklyChallengesWon: number;
};

export type BadgeRarity = 'commun' | 'rare' | 'exclusif';

export type BadgeDefinition = {
  id: string;
  label: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  /** Un badge exclusif n'apparaît dans aucun classement : il reste au couple. */
  private: boolean;
  predicate: (ctx: BadgeContext) => boolean;
};

export const EMPTY_BADGE_CONTEXT: BadgeContext = {
  completedSessions: 0,
  answeredCards: 0,
  skippedCards: 0,
  binaryAnswers: 0,
  reciprocalAnswers: 0,
  deepestSensitivity: 0,
  deepestLevel: 'connaissance',
  decksCreated: 0,
  cardsCreated: 0,
  nightSessions: 0,
  longestStreakDays: 0,
  weeklyChallengesWon: 0,
};

export const BADGES: BadgeDefinition[] = [
  {
    id: 'premiere-fois',
    label: 'Première fois',
    description: 'Votre toute première session Echo, ensemble.',
    icon: 'sparkles-outline',
    rarity: 'commun',
    private: false,
    predicate: (c) => c.completedSessions >= 1,
  },
  {
    id: 'partage-profond',
    label: 'Partage profond réussi',
    description: 'Vous avez répondu à une carte de sensibilité maximale.',
    icon: 'heart-outline',
    rarity: 'rare',
    private: false,
    predicate: (c) => c.deepestSensitivity >= 3 && c.answeredCards >= 1,
  },
  {
    id: 'expert-questions-directes',
    label: 'Expert en questions directes',
    description: '20 réponses au mode binaire OUI/NON.',
    icon: 'git-compare-outline',
    rarity: 'rare',
    private: false,
    predicate: (c) => c.binaryAnswers >= 20,
  },
  {
    id: 'reciprocite',
    label: 'Chacun son tour',
    description: '10 réponses réciproques : les deux partenaires se sont dévoilés.',
    icon: 'swap-horizontal-outline',
    rarity: 'commun',
    private: false,
    predicate: (c) => c.reciprocalAnswers >= 10,
  },
  {
    id: 'respect-du-rythme',
    label: 'Au rythme de chacun',
    description:
      'Vous avez passé des questions sans jamais forcer : le consentement fait partie du jeu.',
    icon: 'shield-checkmark-outline',
    rarity: 'commun',
    // Badge délibérément POSITIF : passer une question n'est jamais une faute.
    private: false,
    predicate: (c) => c.skippedCards >= 3,
  },
  {
    id: 'niveau-fiance',
    label: 'Les secrets du cœur',
    description: 'Niveau Fiancé atteint : la phase stable de la pénétration sociale.',
    icon: 'diamond-outline',
    rarity: 'exclusif',
    private: true,
    predicate: (c) => c.deepestLevel === 'fiance',
  },
  {
    id: 'createur-de-contenu',
    label: 'Créateurs de contenu',
    description: 'Vous avez écrit votre propre deck de questions.',
    icon: 'create-outline',
    rarity: 'rare',
    private: false,
    predicate: (c) => c.decksCreated >= 1,
  },
  {
    id: 'univers-sur-mesure',
    label: 'Univers sur mesure',
    description: '25 cartes personnelles ajoutées à votre moteur de contenu.',
    icon: 'library-outline',
    rarity: 'rare',
    private: false,
    predicate: (c) => c.cardsCreated >= 25,
  },
  {
    id: 'nuit-blanche',
    label: 'Nuit blanche inoubliable',
    description: 'Cinq sessions jouées entre 23 h et 5 h du matin.',
    icon: 'moon-outline',
    rarity: 'exclusif',
    private: true,
    predicate: (c) => c.nightSessions >= 5,
  },
  {
    id: 'rituel-du-couple',
    label: 'Le rituel du couple',
    description: 'Sept jours consécutifs à jouer ensemble.',
    icon: 'calendar-outline',
    rarity: 'rare',
    private: false,
    predicate: (c) => c.longestStreakDays >= 7,
  },
  {
    id: 'defi-releve',
    label: 'Défi relevé',
    description: 'Premier défi hebdomadaire inter-couples remporté.',
    icon: 'trophy-outline',
    rarity: 'commun',
    private: false,
    predicate: (c) => c.weeklyChallengesWon >= 1,
  },
];

export function evaluateBadges(ctx: BadgeContext): BadgeDefinition[] {
  return BADGES.filter((badge) => badge.predicate(ctx));
}

export function nextBadgeProgress(ctx: BadgeContext): { badge: BadgeDefinition; hint: string } | null {
  const locked = BADGES.filter((b) => !b.predicate(ctx));
  if (locked.length === 0) return null;
  const badge = locked[0]!;
  return { badge, hint: badge.description };
}
