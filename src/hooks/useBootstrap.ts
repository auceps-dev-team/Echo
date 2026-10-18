import { useEffect, useState } from 'react';

import { getStorage } from '../db';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';

/**
 * Amorçage « hors ligne d'abord ».
 *
 * Une seule passe de lecture au démarrage : profil, réglages, sessions,
 * réponses et decks personnalisés sont chargés depuis la persistance locale
 * puis injectés dans les stores Zustand. Aucune requête réseau, aucun écran de
 * chargissement conditionné à la connectivité.
 */
export type BootstrapState = {
  ready: boolean;
  error: string | null;
  driver: 'sqlite' | 'web-localstorage' | 'memory' | null;
};

export function useBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ ready: false, error: null, driver: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getStorage();
        const [profile, settings, sessions, answers, decks] = await Promise.all([
          db.getProfile(),
          db.getSettings(),
          db.listSessions(500),
          db.listAnswers(),
          db.listDecks(),
        ]);
        if (cancelled) return;

        if (settings) useSettingsStore.getState().hydrate(settings);
        useCoupleStore.getState().hydrate({
          profile,
          sessions,
          answers,
          decksCreated: decks.length,
          cardsCreated: decks.reduce((sum, deck) => sum + deck.cards.length, 0),
        });
        setState({ ready: true, error: null, driver: db.driver });
      } catch (error) {
        if (cancelled) return;
        setState({
          ready: true,
          driver: null,
          error: error instanceof Error ? error.message : 'Erreur inconnue au démarrage',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
