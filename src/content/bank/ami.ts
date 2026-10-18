import type { Card } from '../types';

/**
 * Niveau 2 — Ami (phase exploratoire affective, SPT).
 * On partage des opinions et des attitudes : la personnalité commence à
 * apparaître, sans toucher aux souvenirs profondément intimes.
 */
export const amiCards: Card[] = [
  { id: 'a-v-01', level: 'ami', kind: 'verite', text: "Quelle opinion impopulaire assumes-tu complètement ?", sensitivity: 1, tags: ['valeurs', 'personnalite'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-v-02', level: 'ami', kind: 'verite', text: "Qu'est-ce que les gens comprennent souvent mal à ton sujet ?", sensitivity: 1, tags: ['personnalite'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-v-03', level: 'ami', kind: 'verite', text: "Quelle habitude voudrais-tu vraiment réussir à changer ?", sensitivity: 1, tags: ['progres'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'a-v-04', level: 'ami', kind: 'verite', text: "Quand tu stresses, est-ce que tu cherches du réconfort ou de l'espace ?", sensitivity: 1, tags: ['emotions', 'besoins'], triggerWarnings: ['sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'a-v-05', level: 'ami', kind: 'verite', text: "Quelle règle de vie t'a été transmise et que tu refuses de suivre ?", sensitivity: 1, tags: ['famille', 'valeurs'], triggerWarnings: ['famille'], reciprocal: false, origin: 'echo' },
  { id: 'a-v-06', level: 'ami', kind: 'verite', text: "Quelle est la chose dont tu es le plus fier ces deux dernières années ?", sensitivity: 1, tags: ['ferte'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-v-07', level: 'ami', kind: 'verite', text: "Quel compliment te touche vraiment, et lequel te laisse indifférent ?", sensitivity: 1, tags: ['langages-amour'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-v-08', level: 'ami', kind: 'verite', text: "Quelle amitié a compté le plus dans ta vie, et pourquoi ?", sensitivity: 1, tags: ['liens'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'a-a-01', level: 'ami', kind: 'action', text: "Chacun cite trois qualités de l'autre, sans répéter celles déjà dites dans la partie.", sensitivity: 1, tags: ['liens', 'gratitude'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-a-02', level: 'ami', kind: 'action', text: "Raconte en une minute le moment où tu as su que tu pouvais compter sur l'autre.", sensitivity: 1, tags: ['liens', 'souvenirs'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-a-03', level: 'ami', kind: 'action', text: "Montre à l'autre l'objet le plus étrange que tu gardes chez toi et défends-le.", sensitivity: 0, tags: ['humour', 'quotidien'], triggerWarnings: [], reciprocal: false, origin: 'echo' },
  { id: 'a-a-04', level: 'ami', kind: 'action', text: "Reformule à voix haute la dernière chose que l'autre t'a confiée, pour vérifier que tu as bien compris.", sensitivity: 1, tags: ['ecoute'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'a-b-01', level: 'ami', kind: 'binaire', text: "Tu pardonnes facilement une maladresse ?", sensitivity: 1, tags: ['valeurs'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui, vite', non: 'Non, ça reste' }, origin: 'echo' },
  { id: 'a-b-02', level: 'ami', kind: 'binaire', text: "Tu dis ce que tu penses même quand ça dérange ?", sensitivity: 1, tags: ['franchise'], triggerWarnings: [], reciprocal: false, binaryOptions: { oui: 'Toujours', non: 'Je filtre' }, origin: 'echo' },
  { id: 'a-b-03', level: 'ami', kind: 'binaire', text: "L'argent est un sujet facile à aborder pour toi ?", sensitivity: 1, tags: ['argent'], triggerWarnings: ['argent'], reciprocal: true, binaryOptions: { oui: 'Très facile', non: 'Pas du tout' }, origin: 'echo' },
];
