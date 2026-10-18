import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * `Screen` — châssis commun de tous les écrans.
 *
 * Il applique l'ambiance du niveau courant via un dégradé, gère la safe area
 * (encoche iOS / edge-to-edge Android 15+) et expose un mode scrollable.
 * C'est le point unique où l'identité visuelle « s'assombrit » à mesure que
 * l'intimité progresse.
 */
export type ScreenProps = PropsWithChildren<{
  /** Deux couleurs du dégradé d'ambiance. Par défaut le fond neutre Echo. */
  gradient?: [string, string];
  scroll?: boolean;
  padded?: boolean;
  testID?: string;
}>;

export default function Screen({
  children,
  gradient = ['#150E22', '#0B0713'],
  scroll = true,
  padded = true,
  testID,
}: ScreenProps) {
  const body = padded ? <View className="flex-1 gap-4 px-5">{children}</View> : <View className="flex-1">{children}</View>;

  return (
    <View className="flex-1" testID={testID}>
      <StatusBar style="light" />
      <LinearGradient colors={gradient} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <SafeAreaView
        style={{ flex: 1 }}
        edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}
