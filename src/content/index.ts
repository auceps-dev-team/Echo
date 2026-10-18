import { connaissanceCards } from './bank/connaissance';
import { amiCards } from './bank/ami';
import { coupleCards } from './bank/couple';
import { fianceCards } from './bank/fiance';
import type { Card } from './types';

/**
 * Contenu officiel Echo (« bank de départ »).
 *
 * Le moteur ne fait JAMAIS de distinction entre contenu officiel et contenu
 * créé par le couple : tout passe par le même schéma `Card`, ce qui rend
 * l'éditeur de questionnaires un simple producteur de cartes supplémentaires.
 */
export const OFFICIAL_CARDS: Card[] = [
  ...connaissanceCards,
  ...amiCards,
  ...coupleCards,
  ...fianceCards,
];

export const OFFICIAL_COUNTS = {
  total: OFFICIAL_CARDS.length,
  connaissance: connaissanceCards.length,
  ami: amiCards.length,
  couple: coupleCards.length,
  fiance: fianceCards.length,
} as const;

export type { Card } from './types';
