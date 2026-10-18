# Feuille de route — Echo

Le socle livré couvre la phase 0. Chaque phase suivante est bornée, vérifiable
et indépendante des autres.

## Phase 0 — Socle ✅ (livré)

- Projet Expo SDK 58, TypeScript strict, NativeWind, React Navigation.
- Modèle des 4 niveaux adossé à la Théorie de la Pénétration Sociale.
- Moteur de contenu : filtres de consentement, rampe de sensibilité, tirage
  déterministe, anti-répétition en base.
- Bank officielle française (58 cartes, 4 niveaux, 3 modes).
- Persistance SQLite + adaptateur web + stockage mémoire de test.
- Gamification : 3 ressources, indice de lien, 11 badges (dont 2 privés).
- Agent facilitateur Echo (ouverture, réciprocité, refus accepté).
- Journal de Bord Relationnel (récits générés, jamais de liste brute).
- 10 écrans, 109 tests, CI typecheck + tests + export.

## Phase 1 — Profondeur de jeu

- [ ] Saisie de note de réponse (chiffrée au repos) sur les cartes réciproques.
- [ ] Édition et duplication de cartes dans le Studio.
- [ ] Decks événementiels (`occasion`) → badge exclusif + points bonus.
- [ ] « Promote a card » : transformer une carte d'un niveau vers le niveau
      supérieur (ex. « ton plat préféré » → « le souvenir de notre premier dîner »).
- [ ] Reanimated : transitions d'ambiance par niveau (le fond se réchauffe).
- [ ] Haptiques différenciés par type de réponse.

## Phase 2 — Sécurité des données

- [ ] Chiffrement au repos des notes (`expo-crypto` + clé dérivée, `expo-secure-store`).
- [ ] Verrouillage de l'app (biométrie via `expo-local-authentication`).
- [ ] Export des données (JSON) et import sur nouvel appareil.
- [ ] Journal d'audit local des effacements.

## Phase 3 — Backend et compétition

- [ ] Implémentation `CloudSyncAdapter` (Firebase JS SDK v13 **ou** Supabase).
- [ ] File de synchronisation basée sur `session.sync_state`.
- [ ] Classements monde / région / cercle sur l'**indice de lien** uniquement.
- [ ] Défis hebdomadaires (série de cartes synchronisée par graine partagée).
- [ ] Battle Royale couple contre couple (temps réel, score cible).
- [ ] Modération et signalement (blocage d'un couple, retrait d'un deck partagé).

## Phase 4 — Contenu et internationalisation

- [ ] `expo-localization` + bank anglaise.
- [ ] Partage de decks entre couples (avec modération).
- [ ] Relecture éditoriale des cartes de sensibilité 3 par un professionnel
      (psychologie / thérapie de couple) avant publication.

## Points de vigilance transverses

1. **Ne jamais rendre le refus coûteux.** Toute évolution de la gamification
   doit préserver `awardFor('skipped') > 0` sur la confiance.
2. **Ne jamais exposer une réponse d'un partenaire à un tiers.** Le contrat de
   classement ne transporte que des agrégats.
3. **Vérifier la compatibilité Expo Go sur appareil réel** à chaque montée de
   SDK : la sandbox ne peut pas joindre `expo.dev`.
4. **Les builds natifs se font hors sandbox** (poste développeur ou EAS).
