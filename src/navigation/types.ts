import type { NavigatorScreenParams } from '@react-navigation/native';

import type { GameMode } from '../game/engine';
import type { LevelId } from '../theme/levels';

/** Navigation typée : les routes et leurs paramètres sont vérifiés à la compilation. */

export type TabParamList = {
  Accueil: undefined;
  Niveaux: undefined;
  Journal: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Jeu: { level: LevelId; mode: GameMode };
  Resume: { level: LevelId; mode: GameMode };
  Studio: { level?: LevelId } | undefined;
  Classement: undefined;
  Parametres: undefined;
  Consentement: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
