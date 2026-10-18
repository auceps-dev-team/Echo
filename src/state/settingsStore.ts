import { create } from 'zustand';

import type { TriggerCategory } from '../content/types';
import { DEFAULT_SETTINGS, type SettingsRow } from '../db/types';
import type { ConsentTier } from '../theme/levels';

/**
 * Réglages & consentement.
 *
 * Ces réglages pilotent DIRECTEMENT le moteur de contenu : un tag ou un
 * déclencheur bloqué retire définitivement les cartes correspondantes du tirage.
 * Le contrôle utilisateur n'est pas décoratif, il est effectif.
 */

export type SettingsState = SettingsRow & {
  hydrated: boolean;
  hydrate(settings: SettingsRow): void;
  setConsentTier(tier: ConsentTier): void;
  toggleBlockedTag(tag: string): void;
  toggleBlockedTrigger(trigger: TriggerCategory): void;
  setVisibility(visibility: SettingsRow['visibility']): void;
  setHaptics(enabled: boolean): void;
  setEchoBot(enabled: boolean): void;
  confirmAge(): void;
  reset(): void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate(settings) {
    set({ ...settings, hydrated: true });
  },

  setConsentTier(consentTier) {
    set({ consentTier });
  },

  toggleBlockedTag(tag) {
    set((state) => ({
      blockedTags: state.blockedTags.includes(tag)
        ? state.blockedTags.filter((t) => t !== tag)
        : [...state.blockedTags, tag],
    }));
  },

  toggleBlockedTrigger(trigger) {
    set((state) => ({
      blockedTriggers: state.blockedTriggers.includes(trigger)
        ? state.blockedTriggers.filter((t) => t !== trigger)
        : [...state.blockedTriggers, trigger],
    }));
  },

  setVisibility(visibility) {
    set({ visibility });
  },

  setHaptics(haptics) {
    set({ haptics });
  },

  setEchoBot(echoBotEnabled) {
    set({ echoBotEnabled });
  },

  confirmAge() {
    set({ ageConfirmed: true });
  },

  reset() {
    set({ ...DEFAULT_SETTINGS, hydrated: true });
  },
}));

/** Sélecteur : les catégories de déclencheurs actuellement bloquées. */
export function selectBlockedTriggers(state: SettingsState): TriggerCategory[] {
  return [...state.blockedTriggers];
}
