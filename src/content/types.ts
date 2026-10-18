import { z } from 'zod';

import { LEVEL_ORDER } from '../theme/levels';
import type { LevelId } from '../theme/levels';

/**
 * Modèle de contenu.
 *
 * Deux exigences guident ce schéma :
 *  1. il valide le contenu CRÉÉ PAR LES UTILISATEURS (éditeur de questionnaires),
 *     donc toute donnée entrante passe par Zod avant d'atteindre le moteur ;
 *  2. il porte les métadonnées de sécurité psychologique (sensibilité,
 *     déclencheurs) qui permettent le filtrage trauma-informed.
 */

export const LevelSchema = z.enum(LEVEL_ORDER as unknown as [LevelId, ...LevelId[]]);
export type LevelIdContent = z.infer<typeof LevelSchema>;

/** Nature de la carte. `binaire` alimente le mode OUI/NON. */
export const CardKindSchema = z.enum(['verite', 'action', 'binaire']);
export type CardKind = z.infer<typeof CardKindSchema>;

/**
 * Catégories de déclencheurs potentiels. Un utilisateur peut en bloquer une ou
 * plusieurs : les cartes correspondantes ne sont alors JAMAIS tirées.
 */
export const TriggerCategorySchema = z.enum([
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
]);
export type TriggerCategory = z.infer<typeof TriggerCategorySchema>;

/** Provenance d'une carte : contenu officiel Echo ou création du couple. */
export const CardOriginSchema = z.enum(['echo', 'couple', 'import']);
export type CardOrigin = z.infer<typeof CardOriginSchema>;

export const PointsAwardSchema = z.object({
  chimie: z.number().int().min(0).max(50).default(0),
  confiance: z.number().int().min(0).max(50).default(0),
  complicite: z.number().int().min(0).max(50).default(0),
});
export type PointsAward = z.infer<typeof PointsAwardSchema>;

export const BinaryOptionsSchema = z.object({
  oui: z.string().min(1).max(120),
  non: z.string().min(1).max(120),
});
export type BinaryOptions = z.infer<typeof BinaryOptionsSchema>;

export const CardSchema = z
  .object({
    id: z.string().min(3).max(64),
    level: LevelSchema,
    kind: CardKindSchema,
    text: z.string().min(3).max(280),
    /** 0 = doux, 1 = personnel, 2 = intime, 3 = sensible / potentiellement déclencheur. */
    sensitivity: z.number().int().min(0).max(3).default(0),
    tags: z.array(z.string().min(1).max(24)).max(8).default([]),
    triggerWarnings: z.array(TriggerCategorySchema).max(4).default([]),
    /** La carte exige une réponse des DEUX partenaires (principe de réciprocité). */
    reciprocal: z.boolean().default(false),
    bonusPoints: PointsAwardSchema.partial().optional(),
    binaryOptions: BinaryOptionsSchema.optional(),
    origin: CardOriginSchema.default('echo'),
    /** Id du deck personnalisé, absent pour le contenu officiel. */
    deckId: z.string().optional(),
  })
  .refine((card) => card.kind !== 'binaire' || Boolean(card.binaryOptions), {
    message: 'Une carte binaire doit définir ses options oui/non',
    path: ['binaryOptions'],
  })
  .refine((card) => card.sensitivity < 2 || card.triggerWarnings.length > 0 || card.tags.length > 0, {
    message: 'Une carte de sensibilité >= 2 doit porter des tags ou des avertissements',
    path: ['triggerWarnings'],
  });

export type Card = z.infer<typeof CardSchema>;

export const DeckSchema = z.object({
  id: z.string().min(3).max(64),
  name: z.string().min(1).max(60),
  level: LevelSchema,
  description: z.string().max(180).optional(),
  /** Deck créé pour un événement (anniversaire, retrouvailles…) → badge exclusif. */
  occasion: z.string().max(40).optional(),
  cards: z.array(CardSchema).max(200).default([]),
  createdAt: z.string().datetime({ offset: true }).optional(),
});
export type Deck = z.infer<typeof DeckSchema>;

/** Résultat de validation utilisable par l'éditeur (messages exploitables). */
export function parseCard(input: unknown): { ok: true; card: Card } | { ok: false; issues: string[] } {
  const result = CardSchema.safeParse(input);
  if (result.success) return { ok: true, card: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((i) => `${i.path.join('.') || 'carte'} : ${i.message}`),
  };
}

export function parseDeck(input: unknown): { ok: true; deck: Deck } | { ok: false; issues: string[] } {
  const result = DeckSchema.safeParse(input);
  if (result.success) return { ok: true, deck: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((i) => `${i.path.join('.') || 'deck'} : ${i.message}`),
  };
}
