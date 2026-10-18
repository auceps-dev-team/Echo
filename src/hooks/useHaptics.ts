import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../state/settingsStore';

/**
 * Retours haptiques — désactivables depuis les réglages, et no-op sur le web
 * (l'aperçu navigateur ne doit jamais lever d'exception).
 */
export function useHaptics() {
  const enabled = useSettingsStore((s) => s.haptics);

  return useCallback(
    async (kind: 'light' | 'success' | 'warning' = 'light') => {
      if (!enabled || Platform.OS === 'web') return;
      try {
        if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (kind === 'warning') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Un périphérique sans moteur haptique ne doit jamais casser le jeu.
      }
    },
    [enabled],
  );
}
