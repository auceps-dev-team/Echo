# Echo

**Action ou Vérité hybride pour deux.** Progression d'intimité en quatre niveaux,
gamification coopérative au sein du couple et compétition amicale entre couples —
le tout **hors ligne d'abord**, sans qu'aucune donnée ne quitte l'appareil par
défaut.

> Socle technique : Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6
> (strict) · React Navigation 7 · NativeWind 4 · expo-sqlite · Zustand 5.

---

## Démarrage rapide

```bash
npm install
npx expo start          # puis scanner le QR code avec Expo Go
```

Autres cibles :

```bash
npm run web             # aperçu navigateur (react-native-web)
npm run typecheck       # TypeScript strict
npm test                # 109 tests (jest-expo + React Testing Library)
npm run verify          # typecheck + tests + bundle web + bundle android
```

---

## Le concept en une page

### Quatre niveaux = quatre phases de dévoilement

Le jeu est structuré sur la **Théorie de la Pénétration Sociale** (Altman &
Taylor), pas sur un simple filtre de difficulté :

| Niveau | Phase | Sensibilité max | Consentement | Sessions requises |
| --- | --- | --- | --- | --- |
| **Connaissance** | Orientation | 1/3 | Découverte | 0 |
| **Ami** | Exploratoire affective | 1/3 | Découverte | 2 |
| **Couple** | Affective | 2/3 | Confiance | 6 |
| **Fiancé** | Stable | 3/3 | Libre | 12 |

Un niveau verrouillé explique **pourquoi** il l'est et comment le débloquer.
L'ambiance visuelle s'assombrit et se réchauffe à mesure que l'intimité
progresse.

### Trois modes

- **Classique** — vérités et actions alternées.
- **Binaire OUI/NON** — session rapide, questions directes, pression cognitive
  minimale.
- **Rapide** — mélange des niveaux inférieurs, cinq minutes.

### Gamification hybride

- **Coopérative (intracouple)** : les points appartiennent au *profil couple*,
  jamais à un joueur. Trois ressources — chimie, confiance, complicité — et un
  **indice de lien** (moyenne géométrique) qui punit les déséquilibres.
- **Compétitive (inter-couples)** : classements, défis hebdomadaires et battle
  royale, calculés sur l'indice de lien uniquement. Le contrat backend est en
  place (`CloudSyncAdapter`) mais volontairement non branché : l'app est 100 %
  fonctionnelle hors ligne.
- **11 badges partagés**, recalculés depuis l'historique, dont deux **privés**
  qui n'apparaîtront dans aucun classement.

### Un refus n'est jamais une faute

Le bouton « Passer — sans pénalité » a la même taille que « Nous avons
répondu », rapporte la moitié des points de confiance, et déclenche une
réplique bienveillante d'**Echo**, l'agent facilitateur. Un badge entier
(« Au rythme de chacun ») récompense le fait de poser ses limites.

Dix catégories de sujets (sexualité, ex-partenaires, famille, argent, santé
mentale, traumatismes, religion, apparence, substances, deuil) sont bloquables
individuellement — y compris pour les questions que vous créez vous-mêmes.

---

## Architecture

```
src/
├─ theme/levels.ts        # Les 4 niveaux : phases SPT, plafonds, palettes
├─ content/               # Schéma Zod + bank officielle (58 cartes FR)
├─ game/engine.ts         # Sélection : filtres de consentement, rampe, tirage
├─ game/journal.ts        # Journal de Bord Relationnel (récits générés)
├─ gamification/          # Points, indice de lien, badges, progression dérivée
├─ echo-bot/echo.ts       # Agent facilitateur (réciprocité, non-jugement)
├─ db/                    # SQLite (natif) + localStorage (web) + mémoire (tests)
├─ cloud/adapter.ts       # Contrat backend + implémentation locale
├─ state/                 # Stores Zustand : settings, couple, game
├─ navigation/            # Stack racine + onglets, navigation typée
├─ components/ui/         # Design system maison
└─ screens/               # 10 écrans
```

### Hors ligne d'abord

Toute la logique métier est **pure** et sans import natif : le moteur, le
journal, les badges et la gamification sont testables en Jest sans aucun mock.
Les effets (base, haptiques, réseau) sont rejetés à la périphérie.

### Persistance par plateforme

`src/db/storage.ts` (expo-sqlite) et `src/db/storage.web.ts` (localStorage)
implémentent le même contrat `EchoStorage` ; Metro choisit selon la plateforme.
Ce découpage est **obligatoire**, pas esthétique : en SDK 58, Metro ne résout
pas le module WASM `wa-sqlite.wasm` et un import direct d'expo-sqlite casse
l'export web.

---

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Architecture complète, modèle de données, moteur, gamification, pièges résolus |
| [`docs/environnement.md`](docs/environnement.md) | Audit d'environnement : ce qui a été exécuté et mesuré, versions de référence SDK 58 |
| [`docs/ux-responsable.md`](docs/ux-responsable.md) | Comment chaque principe d'UX responsable est implémenté — et testé |
| [`docs/roadmap.md`](docs/roadmap.md) | Phases 1 à 4 et points de vigilance transverses |

---

## Limites connues du socle

- **Aucun backend branché** : le contrat existe, l'implémentation réseau est à
  écrire (Phase 3). Pour rester compatible Expo Go, utiliser le SDK JavaScript
  Firebase (`firebase@13` + `getReactNativePersistence`) ou Supabase — **pas**
  `@react-native-firebase/*`, qui exige un build natif.
- **Pas de chiffrement au repos** pour les notes de réponse (Phase 2).
- **Aperçu web ≠ cible de production** : `react-native-web` sert la
  prévisualisation ; la cible est Expo Go / les stores.
- **Assets de marque absents** : `app.json` ne référence ni icône ni splash.

## Licence

À définir par l'équipe produit.
