# Architecture technique — Echo

> Socle livré : Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 (strict)
> Stratégie : **hors ligne d'abord**, backend enfichable, contenu personnalisable, gamification hybride.

---

## 1. Principes directeurs

| Principe | Traduction concrète dans le code |
| --- | --- |
| **Hors ligne d'abord** | 100 % du jeu fonctionne sans réseau. Le cloud est un *ajout*, jamais une dépendance : `src/cloud/adapter.ts` expose un contrat unique dont l'implémentation par défaut (`LocalOnlyAdapter`) n'émet aucune requête. |
| **Le consentement est du code** | Les réglages de l'utilisateur (palier, sujets bloqués) filtrent *réellement* le tirage dans `selectCard()`. Ce n'est pas une préférence d'affichage. |
| **Jamais de score individuel** | Les points appartiennent au profil couple (`CoupleProfileRow`). Aucune table, aucun store ne stocke de score par joueur. |
| **État dérivé, pas dupliqué** | Badges et totaux sont **recalculés** depuis l'historique (`buildProgression`). Impossible de désynchroniser progression et données. |
| **Métier pur, effets à la périphérie** | Moteur, journal, badges, gamification = fonctions pures sans import natif → testables en Jest sans mock (109 tests). |

---

## 2. Stack retenue et justifiée

| Rôle | Choix | Version vérifiée | Pourquoi |
| --- | --- | --- | --- |
| Runtime | Expo SDK | `58.0.14` | Nouvelle Architecture par défaut, pont legacy supprimé : aucune « migration à planifier ». |
| UI | React Native | `0.88.0` | Fourni par le SDK 58. |
| Navigation | React Navigation | `7.21.x` (native-stack + bottom-tabs) | Standard, New-Arch ready, typage des routes. |
| Style | NativeWind | `4.2.7` (+ `tailwindcss 3.4`) | Itération visuelle rapide ; **bundle validé sur web ET android**. |
| Animations | Reanimated + Worklets | `4.7.1` / `0.13.0` | Nécessite le plugin babel `react-native-worklets/plugin`. |
| État | Zustand | `5.0.15` | Léger, sans provider, sélecteurs fins, 100 % JS (compatible Expo Go). |
| Persistance | expo-sqlite | `58.0.13` | Agrégations SQL, volume croissant, compatible Expo Go (contrairement à WatermelonDB). |
| Validation | Zod | `3.25.76` | Valide le contenu **créé par les utilisateurs** avant d'entrer dans le moteur. |
| Icônes | @expo/vector-icons | `15.1.1` | ⚠️ N'est plus fourni par `expo` en SDK 58 : dépendance explicite obligatoire. |
| Tests | jest-expo + RNTL | `58.0.11` / `14.1.0` | Preset iOS ; `render` est **asynchrone** en v14. |

### Écart assumé avec le rapport de recherche initial

Le rapport préconisait `NativeBase` / `React Native Elements` et `gluestack-ui`. État réel vérifié :

- **NativeBase** : archivé, non maintenu → écarté.
- **React Native Elements** : maintenance only → écarté.
- **gluestack-ui** : le paquet npm (`2.0.2`, `3.0.12`, `5.0.3`) est **le CLI**, pas la bibliothèque. Les paquets runtime (`@gluestack-ui/*`) n'exposent que des *factories headless* (`createProvider`, `createButton`) et le `StyledProvider` requis **n'est publié dans aucune version** de `@gluestack-ui/nativewind-utils` (vérifié de 1.0.7 à 1.0.28, tarball inspecté). Le CLI, lui, télécharge ses composants depuis `registry.gluestack.com`, inaccessible hors du poste de développement.
- **Décision** : design system maison (`src/components/ui/`) sur primitives React Native + NativeWind. **Le vocabulaire des variantes reste aligné sur gluestack** (`action`, `size`, `variant`) pour qu'une migration ultérieure soit mécanique si le CLI est lancé sur un poste connecté.

---

## 3. Arborescence

```
Echo/
├─ App.tsx                     # Providers + amorçage hors ligne
├─ index.ts                    # registerRootComponent
├─ babel.config.js             # babel-preset-expo (explicite !) + nativewind + worklets
├─ metro.config.js             # withNativeWind
├─ tailwind.config.js          # Tokens de design, palette par niveau d'intimité
├─ jest.setup.js               # Mocks déportés (voir §9)
├─ src/
│  ├─ theme/levels.ts          # Les 4 niveaux = 4 phases SPT (plafonds, invites, palettes)
│  ├─ content/
│  │  ├─ types.ts              # Schéma Zod des cartes & decks
│  │  ├─ labels.ts             # Libellés FR (déclencheurs, modes, sensibilité)
│  │  ├─ bank/*.ts             # Contenu officiel (4 niveaux)
│  │  └─ index.ts              # Pool officiel
│  ├─ game/
│  │  ├─ engine.ts             # Sélection de carte : filtres, rampe, tirage déterministe
│  │  └─ journal.ts            # Génération des récits du Journal de Bord
│  ├─ gamification/
│  │  ├─ points.ts             # 3 ressources + indice de lien (moyenne géométrique)
│  │  ├─ badges.ts             # Badges partagés, dont badges privés hors classement
│  │  └─ context.ts            # Progression dérivée de l'historique
│  ├─ echo-bot/echo.ts         # Agent facilitateur : ouverture, réciprocité, refus accepté
│  ├─ db/                      # Couche de persistance (§6)
│  ├─ cloud/adapter.ts         # Contrat backend + LocalOnlyAdapter (§8)
│  ├─ state/                   # Stores Zustand : settings, couple, game
│  ├─ navigation/              # Stack racine + onglets, props de navigation composées
│  ├─ components/ui/           # Design system maison
│  ├─ screens/                 # 10 écrans
│  └─ hooks/                   # useBootstrap, useContentPool, useHaptics
├─ __tests__/                  # 109 tests (moteur, contenu, gamification, UX, rendu)
└─ docs/
```

---

## 4. Modèle de niveaux : la Théorie de la Pénétration Sociale comme données

`src/theme/levels.ts` ne décrit pas des filtres, mais des **contrats de progression** :

| Niveau | Phase SPT | Sensibilité max | Consentement requis | Sessions requises |
| --- | --- | --- | --- | --- |
| Connaissance | Orientation | 1 | `decouverte` | 0 |
| Ami | Exploratoire affective | 1 | `decouverte` | 2 |
| Couple | Affective | 2 | `confiance` | 6 |
| Fiancé | Stable | 3 | `libre` | 12 |

Chaque niveau porte : une `tagline` (guide narratif), une `invitation` (préparation
psychologique affichée avant la première carte), une palette (`gradient`, `hex`)
qui assombrit l'interface à mesure que l'intimité progresse, et une récompense
de base en trois ressources.

Un niveau est débloqué si **et seulement si** les deux conditions sont remplies
(`availableLevels`). Quand il est verrouillé, l'UI affiche la raison exacte
(sessions manquantes *ou* palier insuffisant) : le blocage est explicite, jamais
punitif.

---

## 5. Moteur de contenu

`selectCard(pool, input)` applique trois filtres successifs :

1. **Sécurité psychologique** — `isCardAllowed()` écarte toute carte dont un
   `triggerWarnings` ou un `tags` figure dans les listes bloquées, et toute carte
   dont la sensibilité dépasse `min(plafond du niveau, plafond du consentement)`.
2. **Cohérence de niveau** — `rampCeiling()` implémente la rampe : en début de
   session (`sessionProgress = 0`) on ne tire que du doux ; la profondeur
   autorisée croît linéairement avec l'avancement. Si la rampe ne laisse aucun
   candidat, on retombe sur le plafond dur (jamais de partie bloquée).
3. **Variété** — exclusion des `playedIds` (session courante + 120 dernières
   réponses lues **en base** via `recentCardIds`), puis tirage pseudo-aléatoire.

### Déterminisme assumé

Le tirage utilise `mulberry32` avec une graine optionnelle. Conséquence
volontaire : **deux appareils avec la même graine tirent la même carte**. C'est
la condition technique du mode compétitif inter-couples (défis hebdomadaires
synchronisés, battle royale) sans avoir à faire autorité sur un serveur.

### Modes

| Mode | Cartes tirées | Usage |
| --- | --- | --- |
| `classique` | vérités + actions | Session complète |
| `binaire` | cartes OUI/NON uniquement | Icebreaker, test de franchise, session courte |
| `rapide` | vérités + binaires des niveaux **inférieurs ou égaux** | 5 minutes, pression cognitive minimale |

### Contenu personnalisé

Le Studio produit des `Deck` validés par `parseDeck`/`parseCard` : le contenu
créé par le couple est soumis aux **mêmes règles** que le contenu officiel
(sensibilité déclarée, avertissements obligatoires au-delà de 2). `useContentPool`
fusionne officiel + personnalisé et déduplique par `id`.

---

## 6. Persistance

### Contrat unique, deux implémentations

```
src/db/types.ts        → interface EchoStorage (le contrat)
src/db/storage.ts      → expo-sqlite        (iOS / Android, cible Expo Go)
src/db/storage.web.ts  → localStorage       (aperçu navigateur)
src/db/storage.memory.ts → socle en mémoire (base du web + doublure de test)
```

Metro résout `./storage` selon la plateforme ; TypeScript type-checke
`storage.ts`. Aucune conditionnelle `Platform.OS` dans le code métier.

### ⚠️ Pourquoi ce découpage est obligatoire (piège vérifié)

En SDK 58, `expo-sqlite` **ne bundle pas pour le web** :

```
Unable to resolve "./wa-sqlite/wa-sqlite.wasm"
  from "node_modules/expo-sqlite/web/worker.ts"
```

Le fichier `.wasm` est bien présent dans le paquet, mais `@expo/metro-config`
n'expose aucun support des modules `.wasm`. Un import direct d'`expo-sqlite`
casse donc l'export web. Le split de plateforme règle le problème et conserve
un aperçu navigateur complet.

### Schéma et migrations

`src/db/schema.ts` porte `SCHEMA_VERSION` et une liste ordonnée de migrations.
La version appliquée est stockée dans `PRAGMA user_version` ; au démarrage,
`init()` n'applique que les migrations supérieures — sûr pour un appareil qui
revient en ligne après des mois.

Tables : `couple_profile`, `settings` (ligne unique, `id = 1`), `session`,
`answer`, `deck`, `badge`. `session.sync_state` (`'local'` par défaut) est la
colonne qui servira de file d'attente de synchronisation quand un backend sera
branché.

### Effacement

`wipeAll()` supprime profil, sessions, réponses, decks et badges, puis restaure
les réglages par défaut. Exposé dans Réglages → « Effacer toutes mes données
locales », avec confirmation destructive.

---

## 7. Gamification hybride

### Pilier collaboratif (intracouple)

Trois ressources, jamais un score unique : **chimie**, **confiance**,
**complicité**. Un « passer » rapporte la *moitié* de la confiance et jamais
zéro : refuser n'est pas pénalisé (`awardFor`). Les cartes réciproques
répondues ajoutent un bonus de complicité.

### Indice de lien : la métrique de classement

```ts
bondIndex = ∛(chimie × confiance × complicité)
```

Moyenne **géométrique**, donc elle punit les déséquilibres : `300/10/300` score
moins que `150/150/150`. C'est cette métrique positive — et non un score brut —
qui alimente tout classement inter-couples. Le farming d'une seule ressource
est structurellement perdant (test `l indice de lien PUNIT les déséquilibres`).

### Badges

Définis comme prédicats purs sur `BadgeContext`, **recalculés** à chaque
hydratation (`buildProgression`). Deux d'entre eux sont `private: true`
(« Les secrets du cœur », « Nuit blanche inoubliable ») : l'UI les marque
« Privé » et le contrat de classement ne les expose jamais.

Le badge « Au rythme de chacun » se débloque en **passant** des questions :
le refus est traité comme une compétence relationnelle, pas comme un échec.

### Pilier compétitif (inter-couples)

`CloudSyncAdapter` définit déjà les opérations nécessaires :
`getLeaderboard(scope)`, `getWeeklyChallenge()`, `submitChallengeProgress()`,
`createMatch()`. L'écran Classement fonctionne intégralement hors ligne et
affiche un état « Mode hors ligne » explicite plutôt qu'une erreur.

---

## 8. Brancher un backend (point d'extension unique)

Aucun écran ne connaît le backend. Pour ajouter Firebase ou Supabase :

1. Créer `src/cloud/firebase.ts` (ou `supabase.ts`) implémentant `CloudSyncAdapter`.
2. Le retourner depuis `createCloudAdapter({ provider: 'firebase' })`.
3. Alimenter la file de synchronisation : lire `session.sync_state = 'local'`,
   pousser via `pushSession()`, marquer `'synced'`.

### Contrainte Expo Go à respecter

`@react-native-firebase/*` est un **module natif** : il exige un *dev client* ou
un build EAS et **ne fonctionne pas dans Expo Go**. Pour rester compatible Expo
Go, utiliser le SDK JavaScript :

```ts
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

Supabase (`@supabase/supabase-js`) est également un client JS pur, compatible
Expo Go sans build natif.

---

## 9. Pièges d'intégration rencontrés et résolus

| Symptôme | Cause | Correctif en place |
| --- | --- | --- |
| `Cannot read properties of undefined (reading 'transformFile')` | `babel-preset-expo` non résolu dès qu'un `babel.config.js` existe (Metro 0.87) | devDependency explicite `babel-preset-expo@~58.0.17` |
| `expo install` échoue | Interroge `api.expo.dev` (React Native Directory) | Versions piochées dans `expo/bundledNativeModules.json`, install via `npm` |
| `Unable to resolve ./wa-sqlite/wa-sqlite.wasm` | Pas de support `.wasm` dans le Metro d'Expo SDK 58 | Split `storage.ts` / `storage.web.ts` (§6) |
| Icônes absentes | `@expo/vector-icons` n'est plus livré par `expo` | Dépendance explicite |
| `Module "1" is missing from the asset registry` (Jest) | Les icônes chargent leur police au montage | Mock `test/mocks/vector-icons.js` |
| `jest.mock()` : *not allowed to reference out-of-scope variables* | Le preset NativeWind injecte `_ReactNativeCSSInterop` dans le fichier de setup | Fabriques de mock déportées dans `test/mocks/*`, référencées par `require` |
| `Property 'getByTestId' does not exist on type 'Promise'` | RNTL v14 : `render` est asynchrone | `await render(...)` partout |
| Requêtes vides après plusieurs rendus asynchrones | Recouvrement d'`act()` entre tests | Règle de consentement extraite en fonction pure (`screens/onboardingRules.ts`) et testée hors rendu |
| `TS5101: 'baseUrl' is deprecated` | TypeScript 6 | `paths` relatif au tsconfig, sans `baseUrl` |

---

## 10. Ce qui n'est pas couvert par ce socle

- **Backend réel** : contrat en place, aucune implémentation réseau (volontaire : environnement sans accès aux services tiers).
- **Chiffrement au repos** : les notes de réponse sont stockées en clair dans SQLite. À ajouter via `expo-sqlite` + couche de chiffrement (`expo-crypto`) avant toute donnée réellement sensible.
- **Assets de marque** : `app.json` ne référence ni icône ni splash (générables via `npx expo customize` sur un poste connecté).
- **Édition de carte existante** dans le Studio (création et suppression seulement).
- **Deck événementiel avec badge exclusif** (ex. « Anniversaire ») : le modèle `Deck.occasion` existe, la mécanique de badge liée n'est pas câblée.
