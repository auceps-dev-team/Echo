import type { PointTotals } from '../gamification/points';
import { bondIndex } from '../gamification/points';
import type { GameMode } from '../game/engine';
import type { LevelId } from '../theme/levels';

/**
 * Contrat du backend (gamification compétitive inter-couples).
 *
 * L'application est conçue « hors ligne d'abord » : le moteur de jeu, les
 * points et les badges fonctionnent intégralement SANS ce contrat. Le cloud
 * n'ajoute que la couche sociale (classements, défis, bataille de couples).
 *
 * Cette séparation permet de :
 *  - développer et tester 100 % de l'app dans un environnement sans réseau ;
 *  - brancher plus tard Firebase (Firestore + Functions) ou Supabase en
 *    remplaçant une seule implémentation, sans toucher aux écrans.
 *
 * Note d'intégration Expo Go : `@react-native-firebase/*` est INCOMPATIBLE avec
 * Expo Go (module natif, exige un dev client / build EAS). Pour rester dans
 * Expo Go, utiliser le SDK JavaScript Firebase (`firebase@13`) avec
 * `getReactNativePersistence(AsyncStorage)`, ou le client JS Supabase.
 */

export type CoupleHandle = {
  coupleId: string;
  displayName: string;
  /** Visibilité choisie par le couple — jamais imposée par défaut. */
  visibility: 'prive' | 'cercle' | 'public';
  region?: string;
};

export type LeaderboardEntry = {
  coupleId: string;
  displayName: string;
  /** Métrique positive : l'indice de lien, jamais un score brut de compétition. */
  bond: number;
  points: PointTotals;
  rank?: number;
};

export type LeaderboardScope = 'monde' | 'region' | 'cercle';

export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  level: LevelId;
  mode: GameMode;
  target: number;
  startsAt: string;
  endsAt: string;
};

export type ChallengeProgress = {
  challengeId: string;
  coupleId: string;
  completed: number;
  target: number;
  finished: boolean;
};

export type CoupleVsCoupleMatch = {
  id: string;
  home: CoupleHandle;
  away: CoupleHandle;
  targetScore: number;
  scores: { home: number; away: number };
  status: 'attente' | 'en-cours' | 'termine';
  rounds: { level: LevelId; mode: GameMode; winner?: 'home' | 'away' }[];
};

export type SyncResult<T> = { ok: true; data: T } | { ok: false; error: 'offline' | 'unauthorized' | 'unavailable' | string };

export interface CloudSyncAdapter {
  readonly id: string;
  /** Vrai si un backend est réellement configuré. */
  readonly available: boolean;

  registerCouple(handle: CoupleHandle, points: PointTotals): Promise<SyncResult<CoupleHandle>>;
  pushSession(payload: {
    coupleId: string;
    level: LevelId;
    points: PointTotals;
    answered: number;
    skipped: number;
    playedAt: string;
  }): Promise<SyncResult<{ bond: number }>>;
  getLeaderboard(scope: LeaderboardScope, opts?: { region?: string; circleId?: string }): Promise<SyncResult<LeaderboardEntry[]>>;
  getWeeklyChallenge(): Promise<SyncResult<WeeklyChallenge | null>>;
  submitChallengeProgress(progress: ChallengeProgress): Promise<SyncResult<ChallengeProgress>>;
  createMatch(opponentCoupleId: string): Promise<SyncResult<CoupleVsCoupleMatch>>;
  signOut(): Promise<void>;
}

/**
 * Implémentation par défaut : 100 % locale, aucune dépendance réseau.
 *
 * Elle retourne `unavailable` partout sauf pour les lectures qui peuvent être
 * servies depuis les données locales, ce qui permet aux écrans compétitifs de
 * s'afficher dans un état « hors ligne » explicite plutôt que de planter.
 */
export class LocalOnlyAdapter implements CloudSyncAdapter {
  readonly id = 'local-only';
  readonly available = false;

  constructor(private readonly localScores: () => { couple: CoupleHandle; points: PointTotals }[] = () => []) {}

  async registerCouple(handle: CoupleHandle): Promise<SyncResult<CoupleHandle>> {
    return { ok: true, data: handle };
  }

  async pushSession(payload: { points: PointTotals }): Promise<SyncResult<{ bond: number }>> {
    return { ok: true, data: { bond: bondIndex(payload.points) } };
  }

  /** Classement « cercle » simulé à partir des données locales de démonstration. */
  async getLeaderboard(): Promise<SyncResult<LeaderboardEntry[]>> {
    const entries = this.localScores()
      .map((row) => ({
        coupleId: row.couple.coupleId,
        displayName: row.couple.displayName,
        bond: bondIndex(row.points),
        points: row.points,
      }))
      .sort((a, b) => b.bond - a.bond)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    return { ok: true, data: entries };
  }

  async getWeeklyChallenge(): Promise<SyncResult<WeeklyChallenge | null>> {
    return { ok: false, error: 'unavailable' };
  }

  async submitChallengeProgress(progress: ChallengeProgress): Promise<SyncResult<ChallengeProgress>> {
    return { ok: true, data: progress };
  }

  async createMatch(): Promise<SyncResult<CoupleVsCoupleMatch>> {
    return { ok: false, error: 'unavailable' };
  }

  async signOut(): Promise<void> {}
}

/**
 * Fabrique d'adaptateur : point d'extension unique pour brancher un backend.
 *
 * Pour ajouter Firebase, implémenter `CloudSyncAdapter` dans
 * `src/cloud/firebase.ts` puis retourner cette implémentation ici en fonction
 * de la configuration. Aucun écran n'a besoin d'être modifié.
 */
export function createCloudAdapter(_config?: { provider?: 'none' | 'firebase' | 'supabase' }): CloudSyncAdapter {
  const provider = _config?.provider ?? 'none';
  switch (provider) {
    case 'firebase':
    case 'supabase':
      // Intentionnellement non implémenté dans le socle hors-ligne d'abord.
      // Voir docs/architecture.md §8 « Brancher un backend ».
      return new LocalOnlyAdapter();
    case 'none':
    default:
      return new LocalOnlyAdapter();
  }
}
