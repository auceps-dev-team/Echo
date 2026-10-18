import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

import ClassementScreen from '../screens/ClassementScreen';
import ConsentScreen from '../screens/ConsentScreen';
import GameScreen from '../screens/GameScreen';
import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import LevelSelectScreen from '../screens/LevelSelectScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StudioScreen from '../screens/StudioScreen';
import SummaryScreen from '../screens/SummaryScreen';
import { useSettingsStore } from '../state/settingsStore';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

/** Thème sombre unique : l'app assume une ambiance nocturne et confidentielle. */
const ECHO_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#C026D3',
    background: '#0B0713',
    card: '#150E22',
    text: '#F5F1FB',
    border: '#2E2246',
    notification: '#F43F5E',
  },
};

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Accueil: 'home-outline',
  Niveaux: 'layers-outline',
  Journal: 'book-outline',
  Profil: 'heart-outline',
};

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F0ABFC',
        tabBarInactiveTintColor: '#8B7FA8',
        tabBarStyle: {
          backgroundColor: '#150E22',
          borderTopColor: '#2E2246',
          height: Platform.OS === 'ios' ? 84 : 62,
        },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tabs.Screen name="Accueil" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tabs.Screen name="Niveaux" component={LevelSelectScreen} options={{ title: 'Niveaux' }} />
      <Tabs.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal' }} />
      <Tabs.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const ageConfirmed = useSettingsStore((s) => s.ageConfirmed);
  const hasProfile = useSettingsStore((s) => s.hydrated);

  return (
    <NavigationContainer theme={ECHO_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0713' } }}>
        {!ageConfirmed || !hasProfile ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Tabs" component={TabsNavigator} />
        )}
        <Stack.Screen name="Jeu" component={GameScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="Resume" component={SummaryScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Studio" component={StudioScreen} options={{ presentation: 'formSheet' }} />
        <Stack.Screen name="Classement" component={ClassementScreen} />
        <Stack.Screen name="Parametres" component={SettingsScreen} />
        <Stack.Screen name="Consentement" component={ConsentScreen} options={{ presentation: 'formSheet' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
