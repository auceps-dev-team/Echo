import type { LevelId } from '../theme/levels';
import { getLevel } from '../theme/levels';

/**
 * « Echo » — l'agent facilitateur.
 *
 * Fondement scientifique : les travaux sur les agents conversationnels montrent
 * que les utilisateurs se confient davantage à un agent qu'à un humain, grâce à
 * la perception d'anonymat, de confidentialité et de NON-JUGEMENT. Deux
 * mécaniques sont exploitées ici :
 *
 *  1. le rapport-building progressif (banalités → profondeur), aligné sur les
 *     phases de la Théorie de la Pénétration Sociale ;
 *  2. la RÉCIPROCITÉ : l'agent se dévoile d'abord (« self-disclosure »), ce qui
 *     augmente significativement la probabilité que l'utilisateur se dévoile.
 *
 * Echo n'est PAS un moteur d'IA et ne collecte rien : ce sont des répliques
 * déterministes, locales, auditables — un choix délibéré pour un produit qui
 * manipule de l'intimité.
 */

export type EchoIntent = 'ouverture' | 'reciprocite' | 'encouragement' | 'refus-accepte' | 'transition' | 'cloture';

export type EchoLine = {
  intent: EchoIntent;
  text: string;
  level: LevelId;
  /** Une réplique de réciprocité dévoile quelque chose d'Echo lui-même. */
  selfDisclosure?: string;
};

const SELF_DISCLOSURES = [
  "Tu sais, moi, j'ai toujours eu un peu peur des serpents. Même en dessin.",
  "Je n'ai jamais su siffler correctement. J'ai essayé des années.",
  "Mon truc à moi, c'est que je perds le fil si on parle trop vite. Alors on va prendre notre temps.",
  "Je garde une liste de mots que j'aime bien. « Crépuscule » est dedans depuis longtemps.",
  "Je ne sais pas mentir. C'est un handicap, mais ici ça arrange tout le monde.",
];

const OPENERS: Record<LevelId, string[]> = {
  connaissance: [
    "Alors, comment vous vous appelez, vous deux ?",
    "On commence tout doux. Rien ici ne demande de se justifier.",
    "Petite règle de la maison : on ne juge aucune réponse. Aucune.",
  ],
  ami: [
    "On passe à des choses un peu plus personnelles. Vous gardez le contrôle du rythme.",
    "Ici on donne des avis, pas des preuves. Il n'y a rien à démontrer.",
    "Prêts à dire ce que vous pensez vraiment ? On reste bienveillants.",
  ],
  couple: [
    "Ce niveau parle de votre histoire. Prenez le temps qu'il faut.",
    "Rappel utile : écouter compte autant que répondre.",
    "Si une question tombe mal, on passe. Sans discussion, sans score perdu.",
  ],
  fiance: [
    "On entre dans le plus profond. Respirez, rien ne presse.",
    "Ce que vous allez dire ici n'appartient qu'à vous deux.",
    "La vulnérabilité n'est pas un aveu de faiblesse. C'est le matériau du lien.",
  ],
};

const ENCOURAGEMENTS = [
  "C'était une belle réponse. Vraiment.",
  "Vous venez de gagner en profondeur, pas seulement en points.",
  "Ce genre de moment, c'est exactement ce que le journal garde en mémoire.",
  "Note pour plus tard : relisez cette réponse dans six mois.",
];

/**
 * Répliques de refus — conception trauma-informed.
 * Aucune ne culpabilise, aucune ne mentionne de perte de points.
 */
const REFUS_ACCEPTES = [
  "Pas de problème, on passe à autre chose. Tu es en sécurité ici.",
  "C'est noté, et ça ne change rien à votre score. Passer est une réponse valide.",
  "Bien reçu. Respecter une limite, c'est aussi construire la confiance.",
  "On laisse celle-là de côté. Rien ne presse jamais.",
];

const TRANSITIONS: Record<LevelId, string> = {
  connaissance: 'On reste en surface encore un peu — c’est là que le rythme se crée.',
  ami: 'On descend d’un cran : vos opinions, vos préférences, vos petites vérités.',
  couple: 'On entre dans votre histoire à deux.',
  fiance: 'On touche au plus profond : valeurs, peurs, aspirations.',
};

const CLOSINGS = [
  "Belle session. Votre journal de bord vient de s'enrichir.",
  "C'est terminé pour aujourd'hui — et c'est déjà beaucoup.",
  "Gardez ce momentum : une prochaine session peut aller plus loin.",
];

function pick(list: readonly string[], seed: number): string {
  if (list.length === 0) return '';
  const index = Math.abs(seed) % list.length;
  return list[index] ?? '';
}

export type EchoPromptInput = {
  intent: EchoIntent;
  level: LevelId;
  /** Compteur utilisé comme graine : les répliques tournent sans se répéter. */
  turn: number;
};

export function echoLine(input: EchoPromptInput): EchoLine {
  const level = getLevel(input.level);
  switch (input.intent) {
    case 'ouverture':
      return { intent: 'ouverture', level: input.level, text: pick(OPENERS[input.level], input.turn) };
    case 'reciprocite':
      return {
        intent: 'reciprocite',
        level: input.level,
        selfDisclosure: pick(SELF_DISCLOSURES, input.turn),
        text: `${pick(SELF_DISCLOSURES, input.turn)} À toi : ${pick(OPENERS[input.level], input.turn + 1).toLowerCase()}`,
      };
    case 'encouragement':
      return { intent: 'encouragement', level: input.level, text: pick(ENCOURAGEMENTS, input.turn) };
    case 'refus-accepte':
      return { intent: 'refus-accepte', level: input.level, text: pick(REFUS_ACCEPTES, input.turn) };
    case 'transition':
      return {
        intent: 'transition',
        level: input.level,
        text: `${TRANSITIONS[input.level]} (${level.phaseLabel})`,
      };
    case 'cloture':
      return { intent: 'cloture', level: input.level, text: pick(CLOSINGS, input.turn) };
    default:
      return { intent: 'ouverture', level: input.level, text: '' };
  }
}

/**
 * Ouverture de session : alterne ouverture simple et réciprocité.
 * La réciprocité est privilégiée en début de session, c'est là qu'elle est la
 * plus efficace pour déclencher le dévoilement mutuel.
 */
export function echoSessionOpener(level: LevelId, sessionIndex: number): EchoLine {
  const intent: EchoIntent = sessionIndex % 2 === 0 ? 'reciprocite' : 'ouverture';
  return echoLine({ intent, level, turn: sessionIndex });
}

/** Message affiché quand le joueur choisit de ne pas répondre. */
export function echoOnSkip(level: LevelId, turn: number): EchoLine {
  return echoLine({ intent: 'refus-accepte', level, turn });
}

/** Message après une réponse à forte sensibilité : valorisation, pas notation. */
export function echoOnDeepAnswer(level: LevelId, turn: number): EchoLine {
  return echoLine({ intent: 'encouragement', level, turn });
}
