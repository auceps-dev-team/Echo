import { createMemoryStorage } from '../src/db/storage.memory';
import { DEFAULT_SETTINGS, isNightSession, newCoupleId } from '../src/db/types';
import { DDL_V1, migrationsToApply, SCHEMA_VERSION } from '../src/db/schema';

describe('contrat EchoStorage (implémentation mémoire)', () => {
  it('démarre sans profil et avec les réglages par défaut', async () => {
    const db = createMemoryStorage();
    await db.init();
    expect(await db.getProfile()).toBeNull();
    expect(await db.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('les réglages par défaut sont PRIVÉS : rien ne quitte l appareil', () => {
    expect(DEFAULT_SETTINGS.visibility).toBe('prive');
    expect(DEFAULT_SETTINGS.consentTier).toBe('decouverte');
    expect(DEFAULT_SETTINGS.ageConfirmed).toBe(false);
  });

  it('persiste un profil couple et le relit', async () => {
    const db = createMemoryStorage();
    await db.init();
    const profile = {
      coupleId: newCoupleId(),
      partnerAName: 'Awa',
      partnerBName: 'Koffi',
      createdAt: new Date().toISOString(),
      consentTier: 'confiance' as const,
      deepestLevel: 'couple' as const,
      chimie: 0,
      confiance: 0,
      complicite: 0,
    };
    await db.saveProfile(profile);
    expect(await db.getProfile()).toEqual(profile);
  });

  it('enregistre une session et ses réponses, puis agrège les points', async () => {
    const db = createMemoryStorage();
    await db.init();
    await db.insertSession({
      level: 'ami',
      mode: 'classique',
      answered: 3,
      skipped: 1,
      chimie: 9,
      confiance: 12,
      complicite: 6,
      deepestSensitivity: 1,
      nightSession: 0,
      playedAt: new Date().toISOString(),
    });
    await db.insertAnswer({
      sessionId: 1,
      cardId: 'a-v-01',
      level: 'ami',
      kind: 'verite',
      outcome: 'answered',
      sensitivity: 1,
      reciprocal: 1,
      note: null,
      answeredAt: new Date().toISOString(),
    });

    expect(await db.pointTotals()).toEqual({ chimie: 9, confiance: 12, complicite: 6 });
    expect(await db.listAnswers(1)).toHaveLength(1);
    expect(await db.listAnswers()).toHaveLength(1);
    expect(await db.recentCardIds()).toEqual(['a-v-01']);
  });

  it('recentCardIds alimente l anti-répétition du moteur', async () => {
    const db = createMemoryStorage();
    await db.init();
    for (const cardId of ['a', 'b', 'c']) {
      await db.insertAnswer({
        sessionId: 1,
        cardId,
        level: 'ami',
        kind: 'verite',
        outcome: 'answered',
        sensitivity: 1,
        reciprocal: 0,
        note: null,
        answeredAt: new Date().toISOString(),
      });
    }
    const ids = await db.recentCardIds(2);
    expect(ids).toHaveLength(2);
  });

  it('un deck personnalisé expose ses cartes au moteur', async () => {
    const db = createMemoryStorage();
    await db.init();
    await db.insertDeck({
      id: 'deck-1',
      name: 'Anniversaire',
      level: 'couple',
      occasion: 'Anniversaire',
      cards: [
        { id: 'user-carte-1', level: 'couple', kind: 'verite', text: 'Notre meilleur souvenir ?', sensitivity: 2, tags: ['souvenirs'], triggerWarnings: [], reciprocal: true, origin: 'couple' },
      ],
    });
    const decks = await db.listDecks();
    expect(decks).toHaveLength(1);
    expect(await db.listCustomCards('couple')).toHaveLength(1);
    expect(await db.listCustomCards('fiance')).toHaveLength(0);

    await db.deleteDeck('deck-1');
    expect(await db.listDecks()).toHaveLength(0);
  });

  it('wipeAll efface tout et restaure les réglages par défaut', async () => {
    const db = createMemoryStorage();
    await db.init();
    await db.saveProfile({
      coupleId: 'c1',
      partnerAName: 'A',
      partnerBName: 'B',
      createdAt: new Date().toISOString(),
      consentTier: 'libre',
      deepestLevel: 'fiance',
      chimie: 10,
      confiance: 10,
      complicite: 10,
    });
    await db.insertSession({
      level: 'fiance',
      mode: 'classique',
      answered: 2,
      skipped: 0,
      chimie: 10,
      confiance: 10,
      complicite: 10,
      deepestSensitivity: 3,
      nightSession: 1,
      playedAt: new Date().toISOString(),
    });

    await db.wipeAll();
    expect(await db.getProfile()).toBeNull();
    expect(await db.listSessions()).toHaveLength(0);
    expect(await db.pointTotals()).toEqual({ chimie: 0, confiance: 0, complicite: 0 });
    expect(await db.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('les sessions sont listées de la plus récente à la plus ancienne', async () => {
    const db = createMemoryStorage();
    await db.init();
    for (let i = 0; i < 3; i += 1) {
      await db.insertSession({
        level: 'connaissance',
        mode: 'classique',
        answered: i,
        skipped: 0,
        chimie: i,
        confiance: i,
        complicite: i,
        deepestSensitivity: 0,
        nightSession: 0,
        playedAt: new Date().toISOString(),
      });
    }
    const sessions = await db.listSessions();
    expect(sessions.map((s) => s.answered)).toEqual([2, 1, 0]);
  });
});

describe('utilitaires de persistance', () => {
  it('newCoupleId produit des identifiants uniques et préfixés', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newCoupleId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.startsWith('cpl_')).toBe(true);
  });

  it('isNightSession couvre 23h-5h', () => {
    expect(isNightSession(new Date('2026-10-01T23:30:00'))).toBe(true);
    expect(isNightSession(new Date('2026-10-01T02:00:00'))).toBe(true);
    expect(isNightSession(new Date('2026-10-01T14:00:00'))).toBe(false);
  });
});

describe('migrations SQLite', () => {
  it('une base neuve applique toutes les migrations', () => {
    expect(migrationsToApply(0)).toHaveLength(SCHEMA_VERSION);
  });

  it('une base à jour n applique rien', () => {
    expect(migrationsToApply(SCHEMA_VERSION)).toHaveLength(0);
  });

  it('le DDL crée bien les tables attendues', () => {
    for (const table of ['couple_profile', 'settings', 'session', 'answer', 'deck', 'badge']) {
      expect(DDL_V1).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    // Les sessions portent un état de synchronisation : base du mode offline-first.
    expect(DDL_V1).toContain('sync_state');
  });
});
