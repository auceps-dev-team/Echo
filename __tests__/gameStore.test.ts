import { OFFICIAL_CARDS } from '../src/content';
import { SESSION_LENGTH, selectSessionFinished, useGameStore } from '../src/state/gameStore';

/**
 * Test d'intégration du déroulé d'une session complète.
 *
 * Le store ne dépend d'aucun module natif : on peut donc rejouer une partie
 * entière en mémoire, ce qui couvre le cœur de l'expérience.
 */
describe('session de jeu complète', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  function start() {
    useGameStore.getState().start({
      level: 'connaissance',
      mode: 'classique',
      pool: OFFICIAL_CARDS,
      playedIds: [],
      consentTier: 'decouverte',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: true,
      sessionIndex: 0,
    });
  }

  it('démarre avec une carte tirée et une réplique d Echo', () => {
    start();
    const state = useGameStore.getState();
    expect(state.active).toBe(true);
    expect(state.card).not.toBeNull();
    expect(state.echo).not.toBeNull();
    expect(state.echo?.intent).toBe('reciprocite');
  });

  it('une session complète compte 8 cartes et accumule des points', () => {
    start();
    for (let i = 0; i < SESSION_LENGTH; i += 1) {
      useGameStore.getState().resolve('answered');
    }
    const state = useGameStore.getState();
    expect(state.answers).toHaveLength(SESSION_LENGTH);
    expect(state.points.chimie).toBeGreaterThan(0);
    expect(state.points.confiance).toBeGreaterThan(0);
    expect(state.points.complicite).toBeGreaterThan(0);
    expect(selectSessionFinished(state)).toBe(true);
  });

  it('ne rejoue jamais la même carte au sein d une session', () => {
    start();
    for (let i = 0; i < SESSION_LENGTH; i += 1) useGameStore.getState().resolve('answered');
    const ids = useGameStore.getState().answers.map((a) => a.card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('respecte l historique fourni : aucune carte déjà jouée n est tirée', () => {
    const played = OFFICIAL_CARDS.filter((c) => c.level === 'connaissance' && c.kind !== 'binaire')
      .slice(0, 4)
      .map((c) => c.id);
    useGameStore.getState().start({
      level: 'connaissance',
      mode: 'classique',
      pool: OFFICIAL_CARDS,
      playedIds: played,
      consentTier: 'decouverte',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: false,
    });
    for (let i = 0; i < 4; i += 1) useGameStore.getState().resolve('answered');
    const ids = useGameStore.getState().answers.map((a) => a.card.id);
    for (const id of ids) expect(played).not.toContain(id);
  });

  it('les catégories bloquées sont réellement retirées du tirage', () => {
    useGameStore.getState().start({
      level: 'fiance',
      mode: 'classique',
      pool: OFFICIAL_CARDS,
      playedIds: [],
      consentTier: 'libre',
      blockedTags: [],
      blockedTriggers: ['deuil'],
      echoBotEnabled: false,
    });
    for (let i = 0; i < SESSION_LENGTH; i += 1) {
      const card = useGameStore.getState().card;
      if (!card) break;
      expect(card.triggerWarnings).not.toContain('deuil');
      useGameStore.getState().resolve('answered');
    }
  });

  it('le plafond de consentement est appliqué même au niveau Fiancé', () => {
    useGameStore.getState().start({
      level: 'fiance',
      mode: 'classique',
      pool: OFFICIAL_CARDS,
      playedIds: [],
      consentTier: 'decouverte',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: false,
    });
    const card = useGameStore.getState().card;
    // Au palier « découverte », aucune carte Fiancé (sensibilité >= 2) ne peut sortir.
    expect(card === null || card.sensitivity <= 1).toBe(true);
  });

  it('le mode binaire ne sert que des cartes binaires, avec leurs libellés', () => {
    useGameStore.getState().start({
      level: 'couple',
      mode: 'binaire',
      pool: OFFICIAL_CARDS,
      playedIds: [],
      consentTier: 'confiance',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: false,
    });
    for (let i = 0; i < 3; i += 1) {
      const card = useGameStore.getState().card;
      expect(card?.kind).toBe('binaire');
      expect(card?.binaryOptions?.oui).toBeTruthy();
      useGameStore.getState().resolve('answered');
    }
  });

  it('passer une carte continue la session et déclenche une réplique bienveillante', () => {
    start();
    useGameStore.getState().resolve('skipped');
    const state = useGameStore.getState();
    expect(state.answers[0]?.outcome).toBe('skipped');
    expect(state.echo?.intent).toBe('refus-accepte');
    expect(state.active).toBe(true);
    expect(state.card).not.toBeNull();
  });

  it('Echo peut être désactivé', () => {
    useGameStore.getState().start({
      level: 'ami',
      mode: 'classique',
      pool: OFFICIAL_CARDS,
      playedIds: [],
      consentTier: 'decouverte',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: false,
    });
    expect(useGameStore.getState().echo).toBeNull();
    useGameStore.getState().resolve('skipped');
    expect(useGameStore.getState().echo).toBeNull();
  });

  it('la progression de session avance de 0 à 1', () => {
    start();
    expect(useGameStore.getState().progress()).toBe(0);
    for (let i = 0; i < SESSION_LENGTH; i += 1) useGameStore.getState().resolve('answered');
    expect(useGameStore.getState().progress()).toBe(1);
  });

  it('reset remet l état à zéro', () => {
    start();
    useGameStore.getState().resolve('answered');
    useGameStore.getState().reset();
    const state = useGameStore.getState();
    expect(state.active).toBe(false);
    expect(state.answers).toHaveLength(0);
    expect(state.points).toEqual({ chimie: 0, confiance: 0, complicite: 0 });
  });

  it('signale l épuisement du contenu au lieu de boucler', () => {
    const tinyPool = OFFICIAL_CARDS.filter((c) => c.id === 'c-v-01');
    useGameStore.getState().start({
      level: 'connaissance',
      mode: 'classique',
      pool: tinyPool,
      playedIds: [],
      consentTier: 'decouverte',
      blockedTags: [],
      blockedTriggers: [],
      echoBotEnabled: false,
    });
    useGameStore.getState().resolve('answered');
    const state = useGameStore.getState();
    expect(state.card).toBeNull();
    expect(state.exhausted).toBe('all-played');
    expect(selectSessionFinished(state)).toBe(true);
  });
});
