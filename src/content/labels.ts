import type { TriggerCategory } from './types';
import type { GameMode } from '../game/engine';

/** Libellés français partagés par les écrans et le moteur de contenu. */

export const TRIGGER_LABELS: Record<TriggerCategory, { label: string; description: string }> = {
  sexualite: {
    label: 'Sexualité',
    description: 'Tout ce qui touche à la vie sexuelle, aux envies ou aux limites intimes.',
  },
  'ex-partenaire': {
    label: 'Ex-partenaires',
    description: 'Relations passées, comparaisons, souvenirs avec un·e ex.',
  },
  famille: {
    label: 'Famille',
    description: 'Parents, fratrie, héritage familial, conflits domestiques.',
  },
  argent: { label: 'Argent', description: 'Revenus, dettes, inégalités financières dans le couple.' },
  'sante-mentale': {
    label: 'Santé mentale',
    description: 'Anxiété, dépression, thérapie, épisodes difficiles.',
  },
  traumatisme: {
    label: 'Événements traumatisants',
    description: 'Agressions, accidents, violences — jamais abordés sans consentement explicite.',
  },
  religion: { label: 'Religion & croyances', description: 'Foi, pratique religieuse, convictions spirituelles.' },
  apparence: { label: 'Apparence physique', description: 'Poids, corps, vieillissement, comparaison physique.' },
  'alcool-substances': {
    label: 'Alcool & substances',
    description: 'Consommation, dépendance, comportements sous influence.',
  },
  deuil: { label: 'Deuil & perte', description: 'Décès, fausses couches, pertes et absences.' },
};

export const TRIGGER_ORDER: TriggerCategory[] = [
  'sexualite',
  'ex-partenaire',
  'famille',
  'argent',
  'sante-mentale',
  'traumatisme',
  'religion',
  'apparence',
  'alcool-substances',
  'deuil',
];

export const MODE_LABELS: Record<GameMode, { label: string; description: string; icon: string }> = {
  classique: {
    label: 'Classique',
    description: 'Vérités et actions alternées, au rythme du niveau choisi.',
    icon: 'shuffle-outline',
  },
  binaire: {
    label: 'Binaire OUI / NON',
    description: 'Session rapide, questions directes : idéal pour briser la glace ou tester la franchise.',
    icon: 'git-compare-outline',
  },
  rapide: {
    label: 'Rapide',
    description: 'Mélange des niveaux inférieurs, 5 minutes chrono, sans carte trop intime.',
    icon: 'flash-outline',
  },
};

export const KIND_LABELS: Record<string, string> = {
  verite: 'Vérité',
  action: 'Action',
  binaire: 'Binaire',
};

export const SENSITIVITY_LABELS: Record<number, string> = {
  0: 'Doux',
  1: 'Personnel',
  2: 'Intime',
  3: 'Sensible',
};
