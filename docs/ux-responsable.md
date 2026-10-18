# UX responsable de l'intimité

Ce document décrit comment les principes de conception énoncés dans la recherche
sont **implémentés** — avec le fichier et le test qui les garantissent.

## 1. Progression orchestrée (Théorie de la Pénétration Sociale)

L'intimité ne se règle pas avec un curseur, elle se progresse par paliers.

- `src/theme/levels.ts` — chaque niveau porte sa phase SPT, son plafond de
  sensibilité, son palier de consentement et le nombre de sessions requis.
- L'ambiance visuelle se réchauffe et s'assombrit : `palette.gradient` passe de
  `#0C4A6E` (Connaissance) à `#2E1065 → #0B0713` (Fiancé).
- `invitation` est affichée **avant** la première carte : elle prépare
  psychologiquement à l'intensité du niveau.
- Test : `ux-responsable.test.ts › les niveaux sont ordonnés et chacun a sa phase SPT`.

## 2. Non-jugement et réduction de la pression sociale

Recherche de référence : les utilisateurs se confient davantage à un agent
qu'à un humain, en raison de la perception d'anonymat, de confidentialité et de
non-jugement.

- **Echo** (`src/echo-bot/echo.ts`) est un facilitateur déterministe, local,
  sans IA ni collecte. Il ouvre la session, encourage, et accueille les refus.
- Ses répliques ne sont **jamais** évaluatives : aucun « bon » / « mauvais »,
  aucun score affiché dans ses messages.
- Test : chaque niveau possède ses propres répliques d'ouverture.

## 3. Réciprocité

Recherche de référence : quand l'agent se dévoile, l'utilisateur se dévoile
davantage.

- `echoSessionOpener()` alterne ouverture simple et **réciprocité** : dans ce
  second cas, Echo livre d'abord une information personnelle
  (`selfDisclosure`) avant d'inviter le couple à répondre.
- Côté jeu, `card.reciprocal` impose que les deux partenaires répondent ;
  l'écran affiche un contrôle « Échanger » pour passer la main.
- La réciprocité répondue ajoute un bonus de **complicité** (`awardFor`).
- Test : `gameStore.test.ts › les cartes réciproques` et
  `gamification.test.ts › Expert en questions directes`.

## 4. Conception sensible au traumatisme

- **Passer est une action de premier ordre** : le bouton a la même largeur et la
  même hauteur que « Nous avons répondu », avec le libellé explicite
  « Passer — sans pénalité ».
- Il rapporte la moitié des points de confiance : refuser n'est jamais neutre
  négativement (`awardFor`, testé).
- Les avertissements de déclencheurs sont affichés **avant** la réponse, dans un
  encart dédié listant les sujets concernés.
- Les répliques de refus ne contiennent aucune notion de perte — vérifié par
  test sur les 6 variantes : `expect(line.text).not.toMatch(/perdu|pénalité|dommage|déçu/i)`.
- Le badge « Au rythme de chacun » récompense le fait de passer des questions :
  poser une limite est traité comme une compétence relationnelle.
- 10 catégories de déclencheurs sont bloquables individuellement
  (`TRIGGER_ORDER`), y compris pour le contenu créé par le couple.

## 5. Contrôle utilisateur et vie privée

Aligné sur les principes *Responsible Social Media* :

| Contrôle | Implémentation |
| --- | --- |
| Visibilité de l'activité | `settings.visibility`, **`prive` par défaut** |
| Blocage de sujets | `blockedTriggers` / `blockedTags` → filtrage réel dans `selectCard` |
| Palier de consentement | `consentTier` → plafond dur de sensibilité, même au niveau Fiancé |
| Effacement total | `wipeAll()` + bouton destructif confirmé |
| Badges non partageables | `BadgeDefinition.private` → exclus de tout classement |
| Confirmation d'âge | Porte bloquante `ageConfirmed` avant toute session |

Rien n'est envoyé à un serveur par défaut : `LocalOnlyAdapter.available === false`.

## 6. Inclusivité

- Aucun paradigme « homme-premier / femme-première » : les prénoms sont libres
  et symétriques (`partnerAName`, `partnerBName`), l'ordre de réponse se choisit
  via « Échanger ».
- Écriture inclusive dans le contenu (`serein·e`, `aimé·e`).
- Aucune carte ne présuppose de composition familiale, de genre ou d'orientation.
- Test : `onboarding.test.ts › ne crée pas de profil individuel`.

## 7. De l'historique au souvenir

`src/game/journal.ts` transforme chaque session en récit :

- Le ton est dérivé du niveau et de la profondeur atteinte (`leger`,
  `chaleureux`, `profond`).
- Le récit nomme le partenaire, la phase SPT traversée, le moment le plus
  marquant, et **valorise les questions passées** comme un acte de consentement.
- `buildRelationshipSummary` produit la synthèse du profil couple : des phrases,
  pas un tableau de chiffres.
- Tests : `ux-responsable.test.ts › Journal de Bord Relationnel` (7 cas).

## 8. Limite assumée

Echo est un jeu, pas un accompagnement thérapeutique. Cette limite est écrite
dans l'app (écran « Charte Echo ») : en cas de détresse, l'application s'efface
devant un professionnel de santé.
