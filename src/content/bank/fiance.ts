import type { Card } from '../types';

/**
 * Niveau 4 — Fiancé (phase stable, SPT).
 * Le partage le plus profond : valeurs fondamentales, peurs, aspirations.
 * Sensibilité jusqu'à 3 : chaque carte porte un avertissement explicite et le
 * niveau exige le palier de consentement « libre ».
 *
 * Règle de conception : aucune carte de ce niveau n'est formulée comme un test
 * ou une accusation. On cherche le dévoilement mutuel, jamais la surveillance.
 */
export const fianceCards: Card[] = [
  { id: 'f-v-01', level: 'fiance', kind: 'verite', text: "Quelle peur te suit depuis l'enfance et que tu n'as presque jamais dite à voix haute ?", sensitivity: 3, tags: ['peurs', 'enfance'], triggerWarnings: ['traumatisme', 'sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-02', level: 'fiance', kind: 'verite', text: "Quelle valeur veux-tu absolument transmettre, et laquelle veux-tu refuser ?", sensitivity: 3, tags: ['valeurs', 'famille'], triggerWarnings: ['famille', 'religion'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-03', level: 'fiance', kind: 'verite', text: "De quoi aurais-tu besoin de ma part dans les moments où tu t'effondres ?", sensitivity: 3, tags: ['besoins', 'soutien'], triggerWarnings: ['sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-04', level: 'fiance', kind: 'verite', text: "Quel rêve as-tu abandonné, et est-ce qu'il te manque encore ?", sensitivity: 3, tags: ['aspirations', 'regrets'], triggerWarnings: ['deuil'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-05', level: 'fiance', kind: 'verite', text: "Quelle vérité sur notre couple est difficile à dire mais utile à entendre ?", sensitivity: 3, tags: ['non-dits', 'couple'], triggerWarnings: ['sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-06', level: 'fiance', kind: 'verite', text: "Comment veux-tu que nous traversions les désaccords graves, quand ils arriveront ?", sensitivity: 3, tags: ['conflit', 'engagement'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'f-v-07', level: 'fiance', kind: 'verite', text: "Quelle place l'argent doit-il avoir dans notre vie commune pour que tu sois serein·e ?", sensitivity: 3, tags: ['argent', 'avenir'], triggerWarnings: ['argent'], reciprocal: true, origin: 'echo' },
  { id: 'f-v-08', level: 'fiance', kind: 'verite', text: "Que voudrais-tu que je sache de toi si un jour je ne peux plus te le demander ?", sensitivity: 3, tags: ['engagement', 'deuil'], triggerWarnings: ['deuil'], reciprocal: true, origin: 'echo' },
  { id: 'f-a-01', level: 'fiance', kind: 'action', text: "Chacun formule à voix haute une promesse pour l'année à venir, l'autre dit ce dont il aurait besoin pour la tenir.", sensitivity: 3, tags: ['engagement', 'rituel'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'f-a-02', level: 'fiance', kind: 'action', text: "Écrivez séparément la phrase « Je me sens aimé·e quand… », puis lisez-vous mutuellement.", sensitivity: 3, tags: ['langages-amour', 'besoins'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'f-a-03', level: 'fiance', kind: 'action', text: "Choisissez ensemble un souvenir de cette année à archiver dans votre Journal de bord, et expliquez pourquoi celui-là.", sensitivity: 3, tags: ['souvenirs', 'rituel'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'f-b-01', level: 'fiance', kind: 'binaire', text: "Te sens-tu libre d'être totalement toi-même avec moi, y compris dans tes mauvais jours ?", sensitivity: 3, tags: ['securite', 'confiance'], triggerWarnings: ['sante-mentale'], reciprocal: true, binaryOptions: { oui: 'Oui, vraiment', non: 'Pas encore entièrement' }, origin: 'echo' },
  { id: 'f-b-02', level: 'fiance', kind: 'binaire', text: "M'as-tu déjà caché quelque chose par peur de ma réaction ?", sensitivity: 3, tags: ['confiance', 'non-dits'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui', non: 'Non' }, origin: 'echo' },
  { id: 'f-b-03', level: 'fiance', kind: 'binaire', text: "Sais-tu, aujourd'hui, ce qui compte le plus pour moi dans la vie ?", sensitivity: 3, tags: ['valeurs', 'connaissance'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui, clairement', non: 'J aimerais mieux le savoir' }, origin: 'echo' },
];
