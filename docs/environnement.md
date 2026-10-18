# Audit d'environnement — ce qui a été testé, et comment

> Toutes les affirmations de ce document ont été **exécutées**, pas déduites.
> Date de l'audit : 17-18 octobre 2026.

## 1. Sandbox

| Élément | Valeur |
| --- | --- |
| OS | Debian GNU/Linux 12 (bookworm) |
| Node | v22.22.3 |
| npm | 10.9.8 (yarn 1.22.22 présent, pnpm absent) |
| CPU / RAM | 2 cœurs / 3,8 Go |
| Disque libre | ~19 Go |
| Java / Android SDK / Xcode / Watchman | **absents** |
| Python | 3.11.2 |
| gh CLI | 2.23.0, authentifié en tant que `auceps-dev-team` |

## 2. Réseau

**Autorisés et vérifiés (HTTP 200)** : `registry.npmjs.org`, `github.com`,
`api.github.com`, `pypi.org`, `codeload.github.com`.

**Inaccessibles (000)** : `expo.dev`, `api.expo.dev`, `ngrok.com`,
`gluestack.com`, `registry.gluestack.com`, `ui.gluestack.com`,
`raw.githubusercontent.com`.

Conséquences opérationnelles :

- `npx expo install` **échoue** (il interroge le React Native Directory sur
  `api.expo.dev`). Contournement : lire `expo/bundledNativeModules.json` et
  installer avec `npm`. Les versions sont donc exactes et non devinées.
- `eas-cli` s'installe mais renvoie `Not logged in` et ne peut joindre les
  serveurs Expo → **aucun build cloud possible depuis la sandbox**.
- Aucun service tiers (Firebase, Supabase, CDN de polices) ne peut être testé
  en conditions réelles : l'intégration peut être écrite, pas validée en ligne.

## 3. Ce qui a été validé par exécution

| Test | Résultat mesuré |
| --- | --- |
| `create-expo-app --template blank-typescript` | SDK **58.0.14**, RN **0.88.0**, React **19.3.0**, TS 6.0.3 |
| `npm install` (projet vierge) | 459 paquets en **33 s** |
| `npm install` (projet complet Echo) | **1139 paquets en 1 min**, exit 0 |
| `tsc --noEmit` (strict) | **0 erreur** |
| `jest` (7 suites) | **109 tests verts**, 4,5 s |
| `expo export --platform web` | 2,6 Mo JS + **13 Ko CSS NativeWind**, 39 s |
| `expo export --platform android` | **4,3 Mo bytecode Hermes**, 40 s |
| Serveur de dev web | Metro sur `0.0.0.0:8081`, **1268 modules bundlés en 20 s** |
| Aperçu live | Page et bundle servis en HTTP 200 via le port exposé |
| NativeWind 4.2.7 + Reanimated 4 + gluestack headless | Bundle **web ET android** OK sur SDK 58 |
| expo-sqlite | Support web présent (`wa-sqlite.wasm`) mais **non résolu par Metro** → split de plateforme requis |
| jest-expo + RNTL 14 | Suite verte (avec mocks d'icônes et `render` asynchrone) |

## 4. Ce qui ne peut PAS être fait ici

1. **Build natif** : pas de Java, pas d'Android SDK, pas de Xcode → aucun
   APK/IPA produit dans la sandbox. Les builds doivent être lancés sur un poste
   de développement ou via EAS (compte Expo requis).
2. **Expo Go sur un téléphone réel** : la sandbox n'expose ses ports que via un
   proxy HTTPS (`https://{port}-{sandbox}.e2b.app`), alors qu'Expo Go attend un
   serveur Metro joignable en LAN. Le test sur appareil se fait sur le poste du
   développeur :
   ```bash
   npm install
   npx expo start          # puis scanner le QR code avec Expo Go
   ```
3. **Aperçu disponible ici** : la cible web (`react-native-web`) exécute le
   **même code** React Native ; c'est l'outil de prévisualisation et de démo,
   pas la cible de production.
4. **Vérification de la compatibilité Expo Go** : `expo.dev` étant injoignable,
   la liste des SDK supportés par le build Expo Go publié ne peut pas être
   confirmée depuis la sandbox. **À vérifier sur l'appareil** : ouvrir Expo Go →
   vérifier le numéro de SDK affiché avant de scanner le QR code du SDK 58.

## 5. Versions de référence (SDK 58)

Source : `expo/bundledNativeModules.json` du paquet `expo@58.0.14`.

```
react-dom                        19.3.0     expo-linear-gradient   ~58.0.3
react-native-web                 ~0.21.4    expo-font              ~58.0.8
@expo/metro-runtime              ~58.0.14   expo-image             ~58.0.15
expo-sqlite                      ~58.0.13   expo-haptics           ~58.0.7
expo-router                      ~58.0.23   expo-secure-store      ~58.0.2
react-native-reanimated          4.7.1      expo-crypto            ~58.0.7
react-native-worklets            0.13.0     expo-localization      ~58.0.4
react-native-screens             ~4.30.0    expo-notifications     ~58.1.5
react-native-safe-area-context   ~5.10.1    react-native-svg       15.16.0
react-native-gesture-handler     ~3.3.0     @shopify/flash-list     2.3.2
@expo/vector-icons               ^15.0.2    react-native-webview   14.0.1
```

> Note : `react` et `react-dom` doivent être **alignés au patch près**
> (19.3.1 / 19.3.1). Un décalage provoque un `ERESOLVE`
> (`peer react@"^19.3.1" from react-dom@19.3.1`).
