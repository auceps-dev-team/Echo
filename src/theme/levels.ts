/**
 * Les 4 niveaux d'intimité, structurés sur la Théorie de la Pénétration Sociale
 * (Altman & Taylor). Chaque niveau correspond à une phase de dévoilement et
 * porte son propre vocabulaire, sa propre ambiance visuelle et son propre
 * plafond de sensibilité.
 */

export type LevelId = 'connaissance' | 'ami' | 'couple' | 'fiance';

/** Phases de la Social Penetration Theory, dans l'ordre de profondeur. */
export type SptPhase = 'orientation' | 'exploratoire-affective' | 'affective' | 'stable';

/**
 * Palier de consentement : détermine la sensibilité maximale des cartes
 * proposées. C'est le garde-fou central de l'approche trauma-informed.
 */
export type ConsentTier = 'decouverte' | 'confiance' | 'libre';

export type LevelPalette = {
  /** Classe utilitaire NativeWind pour le texte d'accent. */
  text: string;
  /** Classe utilitaire NativeWind pour un fond plein. */
  bg: string;
  /** Dégradé d'ambiance (2 couleurs hex, pour expo-linear-gradient). */
  gradient: [string, string];
  /** Couleur hex dominante, pour les composants non-Tailwind (SVG, navigation). */
  hex: string;
};

export type LevelDefinition = {
  id: LevelId;
  order: number;
  label: string;
  phase: SptPhase;
  phaseLabel: string;
  /** Guide narratif affiché sur la carte de sélection de niveau. */
  tagline: string;
  /** Invite de préparation psychologique, affichée AVANT la première carte. */
  invitation: string;
  /** Sensibilité maximale autorisée à ce niveau (0=doux … 3=sensible). */
  maxSensitivity: 0 | 1 | 2 | 3;
  /** Palier de consentement requis pour débloquer ce niveau. */
  requiredConsent: ConsentTier;
  /** Sessions cumulatives requises pour débloquer ce niveau (progression douce). */
  unlocksAfterSessions: number;
  /** Récompense de base accordée pour une carte complétée à ce niveau. */
  baseReward: { chimie: number; confiance: number; complicite: number };
  palette: LevelPalette;
};

export const LEVELS: Record<LevelId, LevelDefinition> = {
  connaissance: {
    id: 'connaissance',
    order: 1,
    label: 'Connaissance',
    phase: 'orientation',
    phaseLabel: "Phase d'orientation",
    tagline: 'Niveau 1 : apprenons à mieux nous connaître',
    invitation:
      "On reste léger. Ce sont des questions sans risque, faites pour détendre l'atmosphère et trouver un rythme commun.",
    maxSensitivity: 1,
    requiredConsent: 'decouverte',
    unlocksAfterSessions: 0,
    baseReward: { chimie: 2, confiance: 3, complicite: 1 },
    palette: {
      text: 'text-niveau-connaissance',
      bg: 'bg-niveau-connaissance',
      gradient: ['#0C4A6E', '#150E22'],
      hex: '#7DD3FC',
    },
  },
  ami: {
    id: 'ami',
    order: 2,
    label: 'Ami',
    phase: 'exploratoire-affective',
    phaseLabel: 'Phase exploratoire affective',
    tagline: 'Niveau 2 : on partage nos opinions et nos goûts',
    invitation:
      'On commence à dévoiler ce que vous pensez vraiment. Pas encore de souvenirs intimes : des avis, des préférences, des petites vérités.',
    maxSensitivity: 1,
    requiredConsent: 'decouverte',
    unlocksAfterSessions: 2,
    baseReward: { chimie: 3, confiance: 4, complicite: 2 },
    palette: {
      text: 'text-niveau-ami',
      bg: 'bg-niveau-ami',
      gradient: ['#14532D', '#150E22'],
      hex: '#86EFAC',
    },
  },
  couple: {
    id: 'couple',
    order: 3,
    label: 'Couple',
    phase: 'affective',
    phaseLabel: 'Phase affective',
    tagline: 'Niveau 3 : vos souvenirs, vos ressentis, votre histoire',
    invitation:
      "Ici on parle de vous deux : souvenirs, émotions, non-dits. Prenez votre temps, il n'y a aucune bonne réponse.",
    maxSensitivity: 2,
    requiredConsent: 'confiance',
    unlocksAfterSessions: 6,
    baseReward: { chimie: 5, confiance: 5, complicite: 4 },
    palette: {
      text: 'text-niveau-couple',
      bg: 'bg-niveau-couple',
      gradient: ['#7F1D1D', '#150E22'],
      hex: '#FCA5A5',
    },
  },
  fiance: {
    id: 'fiance',
    order: 4,
    label: 'Fiancé',
    phase: 'stable',
    phaseLabel: 'Phase stable',
    tagline: 'Niveau 4 : explorez les secrets de votre cœur',
    invitation:
      'Le partage le plus profond : valeurs, peurs, aspirations. Ce niveau demande une confiance déjà installée des deux côtés.',
    maxSensitivity: 3,
    requiredConsent: 'libre',
    unlocksAfterSessions: 12,
    baseReward: { chimie: 8, confiance: 8, complicite: 7 },
    palette: {
      text: 'text-niveau-fiance',
      bg: 'bg-niveau-fiance',
      gradient: ['#2E1065', '#0B0713'],
      hex: '#C4B5FD',
    },
  },
};

export const LEVEL_ORDER: LevelId[] = ['connaissance', 'ami', 'couple', 'fiance'];

export function getLevel(id: LevelId): LevelDefinition {
  return LEVELS[id];
}

/** Niveaux accessibles compte tenu de l'historique et du consentement actif. */
export function availableLevels(input: {
  completedSessions: number;
  consentTier: ConsentTier;
}): { level: LevelDefinition; unlocked: boolean; reason?: string }[] {
  const tierRank: Record<ConsentTier, number> = { decouverte: 0, confiance: 1, libre: 2 };
  return LEVEL_ORDER.map((id) => {
    const level = LEVELS[id];
    const enoughSessions = input.completedSessions >= level.unlocksAfterSessions;
    const enoughConsent = tierRank[input.consentTier] >= tierRank[level.requiredConsent];
    const unlocked = enoughSessions && enoughConsent;
    let reason: string | undefined;
    if (!unlocked) {
      reason = !enoughConsent
        ? `Nécessite le palier de consentement « ${level.requiredConsent} »`
        : `Encore ${level.unlocksAfterSessions - input.completedSessions} session(s) à débloquer`;
    }
    return { level, unlocked, reason };
  });
}
