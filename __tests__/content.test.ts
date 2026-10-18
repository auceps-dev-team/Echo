import { parseCard, parseDeck } from '../src/content/types';
import { OFFICIAL_CARDS, OFFICIAL_COUNTS } from '../src/content';
import { LEVEL_ORDER } from '../src/theme/levels';

describe('validation Zod du contenu', () => {
  it('accepte une carte valide', () => {
    const result = parseCard({
      id: 'test-1',
      level: 'ami',
      kind: 'verite',
      text: 'Quelle opinion impopulaire assumes-tu ?',
      sensitivity: 1,
      tags: ['valeurs'],
      triggerWarnings: [],
      reciprocal: true,
      origin: 'couple',
    });
    expect(result.ok).toBe(true);
  });

  it('refuse une carte binaire sans options oui/non', () => {
    const result = parseCard({
      id: 'test-2',
      level: 'ami',
      kind: 'binaire',
      text: 'Tu pardonnes facilement ?',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(' ')).toMatch(/oui\/non/);
  });

  it('refuse une carte sensible sans tag ni avertissement', () => {
    const result = parseCard({
      id: 'test-3',
      level: 'fiance',
      kind: 'verite',
      text: 'Une question très intime sans métadonnée de sécurité.',
      sensitivity: 3,
    });
    expect(result.ok).toBe(false);
  });

  it('refuse un identifiant de niveau inconnu', () => {
    const result = parseCard({ id: 'test-4', level: 'inconnu', kind: 'verite', text: 'x' });
    expect(result.ok).toBe(false);
  });

  it('refuse un texte trop long (> 280 caractères)', () => {
    const result = parseCard({ id: 'test-5', level: 'ami', kind: 'verite', text: 'a'.repeat(281) });
    expect(result.ok).toBe(false);
  });

  it('produit des messages d erreur exploitables par l éditeur', () => {
    const result = parseCard({ id: 'x', level: 'ami', kind: 'verite', text: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toMatch(/:/);
    }
  });

  it('valide un deck et ses cartes', () => {
    const result = parseDeck({
      id: 'deck-1',
      name: 'Notre anniversaire',
      level: 'couple',
      occasion: 'Anniversaire',
      cards: [
        { id: 'deck-carte-1', level: 'couple', kind: 'verite', text: 'Un souvenir de nous ?', sensitivity: 2, tags: ['souvenirs'], triggerWarnings: [], reciprocal: true, origin: 'couple' },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.deck.cards).toHaveLength(1);
  });
});

describe('bank officielle', () => {
  it('contient des cartes pour les 4 niveaux', () => {
    for (const level of LEVEL_ORDER) {
      expect(OFFICIAL_CARDS.some((c) => c.level === level)).toBe(true);
    }
  });

  it('respecte le plafond de sensibilité de chaque niveau', () => {
    const ceilings = { connaissance: 1, ami: 1, couple: 2, fiance: 3 } as const;
    for (const card of OFFICIAL_CARDS) {
      expect(card.sensitivity).toBeLessThanOrEqual(ceilings[card.level]);
    }
  });

  it('toute carte de sensibilité >= 2 porte un tag ou un avertissement', () => {
    for (const card of OFFICIAL_CARDS.filter((c) => c.sensitivity >= 2)) {
      expect(card.tags.length + card.triggerWarnings.length).toBeGreaterThan(0);
    }
  });

  it('toute carte binaire a des options oui/non renseignées', () => {
    for (const card of OFFICIAL_CARDS.filter((c) => c.kind === 'binaire')) {
      expect(card.binaryOptions?.oui).toBeTruthy();
      expect(card.binaryOptions?.non).toBeTruthy();
    }
  });

  it('les identifiants sont uniques', () => {
    const ids = OFFICIAL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('le mode binaire est disponible à chaque niveau', () => {
    for (const level of LEVEL_ORDER) {
      expect(OFFICIAL_CARDS.some((c) => c.level === level && c.kind === 'binaire')).toBe(true);
    }
  });

  it('le compteur exporté correspond au contenu réel', () => {
    expect(OFFICIAL_COUNTS.total).toBe(OFFICIAL_CARDS.length);
    expect(OFFICIAL_COUNTS.total).toBeGreaterThanOrEqual(50);
  });
});
