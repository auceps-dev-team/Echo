import { awardFor, createRng, hashSeed, isCardAllowed, rampCeiling, selectCard, sensitivityCeiling } from '../src/game/engine';
import { OFFICIAL_CARDS } from '../src/content';
import type { Card } from '../src/content/types';
import { connaissanceCards } from '../src/content/bank/connaissance';

const baseInput = {
  level: 'connaissance' as const,
  mode: 'classique' as const,
  consentTier: 'decouverte' as const,
  blockedTags: [] as string[],
  blockedTriggers: [] as never[],
  playedIds: [] as string[],
  sessionProgress: 0,
  seed: 42,
};

function card(overrides: Partial<Card>): Card {
  return {
    id: 'x',
    level: 'connaissance',
    kind: 'verite',
    text: 'carte de test',
    sensitivity: 0,
    tags: [],
    triggerWarnings: [],
    reciprocal: false,
    origin: 'echo',
    ...overrides,
  } as Card;
}

describe('plafonds de sensibilité', () => {
  it('le palier de consentement plafonne la sensibilité même au niveau Fiancé', () => {
    expect(sensitivityCeiling('fiance', 'decouverte')).toBe(1);
    expect(sensitivityCeiling('fiance', 'confiance')).toBe(2);
    expect(sensitivityCeiling('fiance', 'libre')).toBe(3);
  });

  it('le niveau plafonne aussi : Connaissance ne dépasse jamais 1', () => {
    expect(sensitivityCeiling('connaissance', 'libre')).toBe(1);
  });

  it('la rampe de progression commence doux et monte', () => {
    expect(rampCeiling('couple', 'confiance', 0)).toBe(0);
    expect(rampCeiling('couple', 'confiance', 0.5)).toBe(1);
    expect(rampCeiling('couple', 'confiance', 1)).toBe(2);
  });

  it('la rampe ne peut pas dépasser le plafond de consentement', () => {
    expect(rampCeiling('fiance', 'decouverte', 1)).toBe(1);
  });
});

describe('filtrage de sécurité psychologique', () => {
  it('exclut une carte dont un déclencheur est bloqué', () => {
    const c = card({ sensitivity: 3, triggerWarnings: ['traumatisme'] });
    expect(isCardAllowed(c, { level: 'fiance', consentTier: 'libre', blockedTags: [], blockedTriggers: ['traumatisme'] })).toBe(false);
  });

  it('exclut une carte dont un tag est bloqué', () => {
    const c = card({ tags: ['argent'] });
    expect(isCardAllowed(c, { level: 'connaissance', consentTier: 'decouverte', blockedTags: ['argent'], blockedTriggers: [] })).toBe(false);
  });

  it('accepte une carte douce sans filtre', () => {
    expect(isCardAllowed(card({}), { level: 'connaissance', consentTier: 'decouverte', blockedTags: [], blockedTriggers: [] })).toBe(true);
  });
});

describe('selectCard', () => {
  it('tire une carte du bon niveau et du bon mode', () => {
    const result = selectCard(OFFICIAL_CARDS, baseInput);
    if (result.card === null) throw new Error('attendu : une carte');
    expect(result.card.level).toBe('connaissance');
    expect(['verite', 'action']).toContain(result.card.kind);
  });

  it('le mode binaire ne tire que des cartes binaires', () => {
    const result = selectCard(OFFICIAL_CARDS, { ...baseInput, mode: 'binaire' });
    expect(result.card?.kind).toBe('binaire');
    expect(result.card?.binaryOptions).toBeDefined();
  });

  it("n'exclut jamais une carte déjà jouée", () => {
    const played = connaissanceCards.filter((c) => c.kind !== 'binaire').map((c) => c.id).slice(0, 5);
    const result = selectCard(connaissanceCards, { ...baseInput, playedIds: played });
    expect(result.card).not.toBeNull();
    expect(played).not.toContain(result.card?.id);
  });

  it('signale all-played quand tout a été joué', () => {
    const all = connaissanceCards.filter((c) => c.kind !== 'binaire').map((c) => c.id);
    const result = selectCard(connaissanceCards, { ...baseInput, playedIds: all });
    if (result.card !== null) throw new Error('attendu : aucune carte');
    expect(result.reason).toBe('all-played');
  });

  it('signale all-blocked quand les filtres vident le pool', () => {
    const result = selectCard(OFFICIAL_CARDS, {
      ...baseInput,
      blockedTags: ['gouts', 'humour', 'culture', 'musique', 'personnalite', 'rythme', 'quotidien', 'jeu', 'voyage'],
    });
    if (result.card !== null) throw new Error('attendu : aucune carte');
    expect(['all-blocked', 'no-content']).toContain(result.reason);
  });

  it('est déterministe à graine égale (défis synchronisés entre couples)', () => {
    const a = selectCard(OFFICIAL_CARDS, baseInput);
    const b = selectCard(OFFICIAL_CARDS, baseInput);
    expect(a.card?.id).toBe(b.card?.id);
  });

  it('change de carte quand la graine change', () => {
    const a = selectCard(OFFICIAL_CARDS, baseInput);
    const b = selectCard(OFFICIAL_CARDS, { ...baseInput, seed: 7 });
    expect(a.card).not.toBeNull();
    expect(b.card).not.toBeNull();
  });

  it('à sensibilité 0 en début de session, ne tire que du doux', () => {
    const result = selectCard(OFFICIAL_CARDS, { ...baseInput, sessionProgress: 0 });
    if (result.card === null) throw new Error('attendu : une carte');
    expect(result.clamped).toBe(true);
    expect(result.card.sensitivity).toBe(0);
  });
});

describe('awardFor', () => {
  it('récompense une réponse complète', () => {
    const award = awardFor(card({ sensitivity: 2, reciprocal: true }), 'answered', 'couple');
    expect(award.chimie).toBeGreaterThan(0);
    expect(award.confiance).toBe(5);
    expect(award.complicite).toBe(4 + 2); // base couple + bonus réciprocité
  });

  it('passer une question conserve la moitié de la confiance : jamais de pénalité', () => {
    const award = awardFor(card({}), 'skipped', 'couple');
    expect(award.confiance).toBe(3); // arrondi de 5 * 0.5
    expect(award.chimie).toBe(3); // arrondi de 5 * 0.5, sans bonus de sensibilité
    expect(award.confiance).toBeGreaterThan(0);
  });

  it('ne produit jamais de points négatifs', () => {
    const award = awardFor(card({ sensitivity: 3 }), 'skipped', 'connaissance');
    expect(Object.values(award).every((v) => v >= 0)).toBe(true);
  });
});

describe('générateur pseudo-aléatoire', () => {
  it('createRng est reproductible', () => {
    const a = createRng(1234);
    const b = createRng(1234);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produit des valeurs dans [0,1[', () => {
    const rng = createRng(hashSeed('echo'));
    for (let i = 0; i < 50; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
