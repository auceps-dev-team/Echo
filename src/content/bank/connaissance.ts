import type { Card } from '../types';

/**
 * Niveau 1 — Connaissance (phase d'orientation, SPT).
 * Petites conversations, informations publiques, aucun risque.
 * Objectif UX : détendre, synchroniser le rythme, faire rire.
 */
export const connaissanceCards: Card[] = [
  { id: 'c-v-01', level: 'connaissance', kind: 'verite', text: "Quel est le plat que tu pourrais manger tous les jours sans te lasser ?", sensitivity: 0, tags: ['gouts'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'c-v-02', level: 'connaissance', kind: 'verite', text: "Quelle est la meilleure blague que tu connaisses ? Raconte-la vraiment.", sensitivity: 0, tags: ['humour'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-v-03', level: 'connaissance', kind: 'verite', text: "Si tu devais garder une seule série ou un seul film pour le reste de ta vie, lequel ?", sensitivity: 0, tags: ['culture'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'c-v-04', level: 'connaissance', kind: 'verite', text: "Quelle chanson te met instantanément de bonne humeur ?", sensitivity: 0, tags: ['musique'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-v-05', level: 'connaissance', kind: 'verite', text: "Quel est ton talent inutile mais assumé ?", sensitivity: 0, tags: ['personnalite'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-v-06', level: 'connaissance', kind: 'verite', text: "Matin ou soir : à quel moment de la journée es-tu le plus agréable à vivre ?", sensitivity: 0, tags: ['rythme'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'c-v-07', level: 'connaissance', kind: 'verite', text: "Quelle est la dernière chose qui t'a fait rire aux éclats ?", sensitivity: 0, tags: ['humour'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-a-01', level: 'connaissance', kind: 'action', text: "Imite la manière dont l'autre commande au restaurant. Sans méchanceté, juste pour rire.", sensitivity: 0, tags: ['humour', 'jeu'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-a-02', level: 'connaissance', kind: 'action', text: "Montre les trois dernières photos de ta galerie et explique-les en une phrase chacune.", sensitivity: 1, tags: ['quotidien'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-a-03', level: 'connaissance', kind: 'action', text: "Fais écouter à l'autre le morceau que tu écoutes en boucle en ce moment.", sensitivity: 0, tags: ['musique'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'c-a-04', level: 'connaissance', kind: 'action', text: "Pendant une minute, chacun décrit sa journée uniquement en mots interdits de négation.", sensitivity: 0, tags: ['jeu'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'c-b-01', level: 'connaissance', kind: 'binaire', text: "Ananas sur la pizza ?", sensitivity: 0, tags: ['gouts'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Coupable mais délicieux', non: 'Crime culinaire' }, origin: 'echo' },
  { id: 'c-b-02', level: 'connaissance', kind: 'binaire', text: "Tu réponds aux messages tout de suite ou trois jours plus tard ?", sensitivity: 0, tags: ['quotidien'], triggerWarnings: [], reciprocal: false, binaryOptions: { oui: 'Tout de suite', non: 'Plus tard, clairement' }, origin: 'echo' },
  { id: 'c-b-03', level: 'connaissance', kind: 'binaire', text: "Tu préfères la plage à la montagne ?", sensitivity: 0, tags: ['voyage'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Plage', non: 'Montagne' }, origin: 'echo' },
];
