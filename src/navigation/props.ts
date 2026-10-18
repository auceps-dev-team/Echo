import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList, TabParamList } from './types';

/**
 * Types de props de navigation pour les écrans d'onglets.
 *
 * Les onglets sont imbriqués dans une stack racine : un écran d'onglet doit
 * pouvoir naviguer DANS la stack (Jeu, Studio, Parametres…). On compose donc
 * les deux props de navigation, ce qui garde `useNavigation` entièrement typé
 * sans avoir à passer la navigation en prop (et donc sans casser
 * `ScreenComponentType` attendu par `<Tabs.Screen component={…} />`).
 */
export type TabNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type TabRouteProp<T extends keyof TabParamList> = RouteProp<TabParamList, T>;
