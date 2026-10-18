# Pipeline CI

Le fichier `github-actions.yml` de ce dossier est **prêt à l'emploi** mais n'est
pas installé dans `.github/workflows/` : le token utilisé par cet environnement
de travail n'a pas la permission `workflows` de l'organisation, et GitHub refuse
donc le push de tout fichier de workflow.

## Installation (à faire depuis un compte autorisé)

```bash
mkdir -p .github/workflows
cp ci/github-actions.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: typecheck, tests et bundles Expo"
git push
```

## Ce que le pipeline valide

| Étape | Commande | Intérêt |
| --- | --- | --- |
| Alignement SDK | `npx expo install --check` | Détecte les versions incompatibles avec le SDK (nécessite un runner connecté) |
| Typage | `npm run typecheck` | TypeScript strict, 0 erreur attendue |
| Tests | `npm test -- --ci` | 109 tests : moteur, contenu, gamification, UX responsable, rendu |
| Bundle web | `npm run export:web` | Valide la cible aperçu navigateur |
| Bundle Android | `npm run export:android` | Valide la cible **Expo Go** (bytecode Hermes) |

## Ce que le pipeline ne fait PAS

Aucun build natif (APK/IPA) : ils relèvent d'EAS Build et nécessitent un compte
Expo. Ajouter une étape `eas build --platform android --profile preview` une
fois le projet enregistré (`eas build:configure`).
