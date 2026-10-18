import { create } from 'zustand';

import type { Card } from '../content/types';
import { awardFor, selectCard, type GameMode, type SelectCardInput } from '../game/engine';
import { echoLine, echoOnDeepAnswer, echoOnSkip, echoSessionOpener, type EchoLine } from '../echo-bot/echo';
import type { TriggerCategory } from '../content/types';
import type { PointTotals } from '../gamification/points';
import { addPoints, ZERO_POINTS } from '../gamification/points';
import type { ConsentTier, LevelId } from '../theme/levels';

/**
 * Session de jeu en cours.
 *
 * Le store ne connaît ni la base de données ni les écrans : il reçoit un pool
 * de cartes déjà filtré et des réglages, puis pilote le tirage. Cela le rend
 * testable sans aucun module natif (voir __tests__/engine.test.ts).
 */

export type RecordedAnswer = {
  card: Card;
  outcome: 'answered' | 'skipped';
  points: PointTotals;
  note?: string;
  answeredAt: string;
};

export type SessionInput = {
  level: LevelId;
  mode: GameMode;
  pool: readonly Card[];
  playedIds: readonly string[];
  consentTier: ConsentTier;
  blockedTags: readonly string[];
  blockedTriggers: readonly TriggerCategory[];
  echoBotEnabled: boolean;
  sessionIndex?: number;
  seed?: number;
};

export type GameState = {
  active: boolean;
  level: LevelId;
  mode: GameMode;
  startedAt: Date;
  card: Card | null;
  answers: RecordedAnswer[];
  points: PointTotals;
  deepestSensitivity: number;
  echoTurn: number;
  echo: EchoLine | null;
  exhausted: null | 'all-played' | 'all-blocked' | 'no-content';
  pool: readonly Card[];
  playedIds: string[];
  settings: Pick<SessionInput, 'consentTier' | 'blockedTags' | 'blockedTriggers' | 'echoBotEnabled'>;

  start(input: SessionInput): void;
  drawNext(): void;
  resolve(outcome: 'answered' | 'skipped', note?: string): void;
  reset(): void;
  progress(): number;
};

const TARGET_CARDS_PER_SESSION = 8;

export const useGameStore = create<GameState>((set, get) => ({
  active: false,
  level: 'connaissance',
  mode: 'classique',
  startedAt: new Date(),
  card: null,
  answers: [],
  points: { ...ZERO_POINTS },
  deepestSensitivity: 0,
  echoTurn: 0,
  echo: null,
  exhausted: null,
  pool: [],
  playedIds: [],
  settings: {
    consentTier: 'decouverte',
    blockedTags: [],
    blockedTriggers: [],
    echoBotEnabled: true,
  },

  start(input) {
    const state: GameState = {
      ...get(),
      active: true,
      level: input.level,
      mode: input.mode,
      startedAt: new Date(),
      answers: [],
      points: { ...ZERO_POINTS },
      deepestSensitivity: 0,
      echoTurn: 0,
      exhausted: null,
      pool: input.pool,
      playedIds: [...input.playedIds],
      settings: {
        consentTier: input.consentTier,
        blockedTags: input.blockedTags,
        blockedTriggers: input.blockedTriggers,
        echoBotEnabled: input.echoBotEnabled,
      },
      card: null,
      echo: null,
    };
    set(state);

    if (input.echoBotEnabled) {
      set({ echo: echoSessionOpener(input.level, input.sessionIndex ?? 0), echoTurn: 1 });
    }
    get().drawNext();
  },

  drawNext() {
    const state = get();
    if (!state.active) return;
    const input: SelectCardInput = {
      level: state.level,
      mode: state.mode,
      consentTier: state.settings.consentTier,
      blockedTags: state.settings.blockedTags,
      blockedTriggers: state.settings.blockedTriggers,
      playedIds: state.playedIds,
      sessionProgress: state.progress(),
    };
    const result = selectCard(state.pool, input);
    if (result.card === null) {
      set({ card: null, exhausted: result.reason });
      return;
    }
    set({ card: result.card, exhausted: null });
  },

  resolve(outcome, note) {
    const state = get();
    const card = state.card;
    if (!card) return;

    const points = awardFor(card, outcome, state.level);
    const recorded: RecordedAnswer = {
      card,
      outcome,
      points,
      ...(note ? { note } : {}),
      answeredAt: new Date().toISOString(),
    };

    const answers = [...state.answers, recorded];
    const echoTurn = state.echoTurn + 1;
    let echo: EchoLine | null = state.echo;
    if (state.settings.echoBotEnabled) {
      if (outcome === 'skipped') {
        echo = echoOnSkip(state.level, echoTurn);
      } else if (card.sensitivity >= 2) {
        echo = echoOnDeepAnswer(state.level, echoTurn);
      } else if (echoTurn % 3 === 0) {
        echo = echoLine({ intent: 'encouragement', level: state.level, turn: echoTurn });
      }
    }

    set({
      answers,
      points: addPoints(state.points, points),
      deepestSensitivity: Math.max(state.deepestSensitivity, card.sensitivity),
      playedIds: [...state.playedIds, card.id],
      echoTurn,
      echo,
      card: null,
    });

    if (answers.length < TARGET_CARDS_PER_SESSION) {
      get().drawNext();
    } else {
      set({ exhausted: 'all-played' });
    }
  },

  reset() {
    set({
      active: false,
      card: null,
      answers: [],
      points: { ...ZERO_POINTS },
      deepestSensitivity: 0,
      echo: null,
      echoTurn: 0,
      exhausted: null,
      playedIds: [],
      pool: [],
    });
  },

  progress() {
    const answered = get().answers.length;
    return Math.min(1, answered / TARGET_CARDS_PER_SESSION);
  },
}));

export const SESSION_LENGTH = TARGET_CARDS_PER_SESSION;

/** La session est-elle terminée (objectif atteint ou contenu épuisé) ? */
export function selectSessionFinished(state: GameState): boolean {
  return state.active && (state.answers.length >= TARGET_CARDS_PER_SESSION || (state.exhausted !== null && state.card === null));
}
