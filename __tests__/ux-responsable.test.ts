import { echoLine, echoOnSkip, echoSessionOpener } from '../src/echo-bot/echo';
import { buildJournalEntry, buildRelationshipSummary } from '../src/game/journal';
import { availableLevels, getLevel, LEVELS, LEVEL_ORDER } from '../src/theme/levels';

describe('agent facilitateur Echo', () => {
  it('l ouverture alterne réciprocité et ouverture simple', () => {
    const a = echoSessionOpener('connaissance', 0);
    const b = echoSessionOpener('connaissance', 1);
    expect(a.intent).toBe('reciprocite');
    expect(b.intent).toBe('ouverture');
  });

  it('la réciprocité contient un dévoilement de l agent', () => {
    const line = echoSessionOpener('ami', 0);
    expect(line.selfDisclosure).toBeTruthy();
    expect(line.text.length).toBeGreaterThan(0);
  });

  it('est déterministe : le même tour produit la même réplique', () => {
    expect(echoLine({ intent: 'ouverture', level: 'couple', turn: 3 }).text).toBe(
      echoLine({ intent: 'ouverture', level: 'couple', turn: 3 }).text,
    );
  });

  it('chaque niveau a ses propres répliques d ouverture', () => {
    const lines = new Set(LEVEL_ORDER.map((level) => echoLine({ intent: 'ouverture', level, turn: 0 }).text));
    expect(lines.size).toBe(LEVEL_ORDER.length);
  });

  it('un refus est toujours accueilli positivement, sans mention de perte', () => {
    for (let turn = 0; turn < 6; turn += 1) {
      const line = echoOnSkip('couple', turn);
      expect(line.intent).toBe('refus-accepte');
      expect(line.text).not.toMatch(/perdu|pénalité|penalité|dommage|déçu/i);
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('la transition rappelle la phase de pénétration sociale', () => {
    const line = echoLine({ intent: 'transition', level: 'fiance', turn: 0 });
    expect(line.text).toContain(LEVELS.fiance.phaseLabel);
  });
});

describe('Journal de Bord Relationnel', () => {
  const base = {
    date: new Date('2026-10-01T20:00:00.000Z'),
    level: 'couple' as const,
    cardsAnswered: 5,
    cardsSkipped: 1,
    deepestSensitivity: 2,
    reciprocalAnswers: 3,
    points: { chimie: 25, confiance: 25, complicite: 20 },
    partnerName: 'Koffi',
  };

  it('produit un titre, un récit et une ligne de stats', () => {
    const entry = buildJournalEntry(base);
    expect(entry.title).toBeTruthy();
    expect(entry.narrative).toContain('Koffi');
    expect(entry.statsLine).toContain('chimie');
  });

  it('le récit mentionne le niveau et sa phase SPT', () => {
    const entry = buildJournalEntry(base);
    expect(entry.narrative).toContain(getLevel('couple').label);
    expect(entry.narrative).toMatch(/phase affective/i);
  });

  it('valorise les questions passées au lieu de les signaler comme un échec', () => {
    const entry = buildJournalEntry(base);
    expect(entry.narrative).toMatch(/consentement/);
    expect(entry.narrative).not.toMatch(/échec|perdu/i);
  });

  it('met en avant la réciprocité quand elle est présente', () => {
    expect(buildJournalEntry(base).narrative).toMatch(/réciprocité/);
    expect(buildJournalEntry({ ...base, reciprocalAnswers: 0 }).narrative).not.toMatch(/réciprocité/);
  });

  it('le ton s intensifie avec le niveau atteint', () => {
    expect(buildJournalEntry({ ...base, level: 'connaissance', deepestSensitivity: 0 }).tone).toBe('leger');
    expect(buildJournalEntry({ ...base, level: 'couple' }).tone).toBe('chaleureux');
    expect(buildJournalEntry({ ...base, level: 'fiance', deepestSensitivity: 3 }).tone).toBe('profond');
  });

  it('un journal vide invite à la première session sans culpabiliser', () => {
    const summary = buildRelationshipSummary({
      totalSessions: 0,
      totalPoints: { chimie: 0, confiance: 0, complicite: 0 },
      currentLevel: 'connaissance',
      deepestLevelReached: 'connaissance',
      badgesCount: 0,
    });
    expect(summary).toMatch(/première session/i);
  });

  it('le résumé de relation cite le niveau le plus profond exploré', () => {
    const summary = buildRelationshipSummary({
      totalSessions: 4,
      totalPoints: { chimie: 30, confiance: 40, complicite: 25 },
      currentLevel: 'couple',
      deepestLevelReached: 'fiance',
      badgesCount: 2,
      partnerName: 'Awa',
    });
    expect(summary).toContain('Awa');
    expect(summary).toContain('Fiancé');
    expect(summary).toContain('2 badge');
  });
});

describe('progression de niveaux et consentement', () => {
  it('Connaissance est toujours débloqué', () => {
    const levels = availableLevels({ completedSessions: 0, consentTier: 'decouverte' });
    expect(levels[0]?.unlocked).toBe(true);
  });

  it('le niveau Fiancé exige le palier libre ET 12 sessions', () => {
    const bySessionsOnly = availableLevels({ completedSessions: 20, consentTier: 'decouverte' });
    expect(bySessionsOnly.find((l) => l.level.id === 'fiance')?.unlocked).toBe(false);

    const byConsentOnly = availableLevels({ completedSessions: 0, consentTier: 'libre' });
    expect(byConsentOnly.find((l) => l.level.id === 'fiance')?.unlocked).toBe(false);

    const both = availableLevels({ completedSessions: 20, consentTier: 'libre' });
    expect(both.find((l) => l.level.id === 'fiance')?.unlocked).toBe(true);
  });

  it('un niveau verrouillé explique POURQUOI', () => {
    const levels = availableLevels({ completedSessions: 0, consentTier: 'decouverte' });
    const locked = levels.find((l) => !l.unlocked);
    expect(locked?.reason).toBeTruthy();
    expect(locked?.reason).toMatch(/session|consentement/i);
  });

  it('les niveaux sont ordonnés et chacun a sa phase SPT', () => {
    expect(LEVEL_ORDER.map((id) => LEVELS[id].order)).toEqual([1, 2, 3, 4]);
    expect(LEVEL_ORDER.map((id) => LEVELS[id].phase)).toEqual([
      'orientation',
      'exploratoire-affective',
      'affective',
      'stable',
    ]);
  });

  it('chaque niveau porte une invite narrative et une ambiance', () => {
    for (const id of LEVEL_ORDER) {
      const level = getLevel(id);
      expect(level.tagline.length).toBeGreaterThan(5);
      expect(level.invitation.length).toBeGreaterThan(20);
      expect(level.palette.hex).toMatch(/^#[0-9A-F]{6}$/i);
      expect(level.palette.gradient).toHaveLength(2);
    }
  });

  it('la sensibilité maximale croît avec le niveau', () => {
    const ceilings = LEVEL_ORDER.map((id) => getLevel(id).maxSensitivity);
    expect(ceilings).toEqual([1, 1, 2, 3]);
  });
});
