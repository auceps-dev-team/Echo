import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import './global.css';
import RootNavigator from './src/navigation/RootNavigator';
import Screen from './src/components/ui/Screen';
import { useBootstrap } from './src/hooks/useBootstrap';

/**
 * Point d'entrée de l'application.
 *
 * Ordre des providers (du plus externe au plus interne) :
 *  GestureHandlerRootView → SafeAreaProvider → NavigationContainer.
 * L'amorçage lit la base locale AVANT d'afficher la navigation, afin que le
 * premier écran rendu soit le bon (Onboarding vs Tabs) sans clignotement.
 */
export default function App() {
  const { ready, error } = useBootstrap();

  if (!ready) {
    return (
      <Screen scroll={false} testID="boot">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-semibold text-muted">Echo…</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scroll={false} testID="boot-error">
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Text className="text-center text-base font-semibold text-chimie">Démarrage impossible</Text>
          <Text className="text-center text-sm text-muted">{error}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
