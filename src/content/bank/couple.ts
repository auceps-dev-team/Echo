import type { Card } from '../types';

/**
 * Niveau 3 — Couple (phase affective, SPT).
 * Pensées, sentiments et souvenirs personnels ; expériences privées du couple.
 * Sensibilité max 2 : on reste dans l'intime émotionnel, jamais dans le
 * potentiellement déclencheur sans consentement explicite (niveau 4).
 */
export const coupleCards: Card[] = [
  { id: 'p-v-01', level: 'couple', kind: 'verite', text: "Quel souvenir associes-tu à notre premier repas ensemble ?", sensitivity: 2, tags: ['souvenirs', 'histoire'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-v-02', level: 'couple', kind: 'verite', text: "À quel moment précis as-tu compris que je comptais vraiment pour toi ?", sensitivity: 2, tags: ['histoire', 'emotions'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-v-03', level: 'couple', kind: 'verite', text: "Quelle dispute a été la plus utile pour nous, et qu'est-ce qu'elle a changé ?", sensitivity: 2, tags: ['conflit', 'progres'], triggerWarnings: ['sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'p-v-04', level: 'couple', kind: 'verite', text: "Qu'est-ce que tu n'oses pas me demander par peur de ma réponse ?", sensitivity: 2, tags: ['non-dits'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-v-05', level: 'couple', kind: 'verite', text: "Quand je vais mal, quel geste de ma part te rassure le plus ?", sensitivity: 2, tags: ['besoins', 'langages-amour'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-v-06', level: 'couple', kind: 'verite', text: "Quelle part de toi as-tu déjà mise de côté pour que ça se passe bien entre nous ?", sensitivity: 2, tags: ['sacrifice', 'identite'], triggerWarnings: ['sante-mentale'], reciprocal: true, origin: 'echo' },
  { id: 'p-v-07', level: 'couple', kind: 'verite', text: "Quel projet à deux te fait le plus envie dans les cinq prochaines années ?", sensitivity: 2, tags: ['avenir'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-v-08', level: 'couple', kind: 'verite', text: "Y a-t-il quelque chose que je fais et qui te blesse sans que je le sache ?", sensitivity: 2, tags: ['non-dits', 'conflit'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-a-01', level: 'couple', kind: 'action', text: "Chacun écrit une chose qu'il voudrait vivre cette année à deux, puis vous échangez les papiers.", sensitivity: 2, tags: ['avenir', 'rituel'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-a-02', level: 'couple', kind: 'action', text: "Deux minutes de gratitude : chacun nomme trois choses que l'autre a faites et qu'il n'a jamais remerciées.", sensitivity: 2, tags: ['gratitude'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-a-03', level: 'couple', kind: 'action', text: "Rejouez votre toute première conversation, mot pour mot si possible.", sensitivity: 2, tags: ['souvenirs', 'humour'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-a-04', level: 'couple', kind: 'action', text: "Regardez une photo de vous deux et racontez chacun ce que vous ressentez en la voyant aujourd'hui.", sensitivity: 2, tags: ['emotions', 'souvenirs'], triggerWarnings: [], reciprocal: true, origin: 'echo' },
  { id: 'p-b-01', level: 'couple', kind: 'binaire', text: "Te sens-tu en sécurité quand tu me confies quelque chose de fragile ?", sensitivity: 2, tags: ['confiance', 'securite'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui, complètement', non: 'Pas toujours' }, origin: 'echo' },
  { id: 'p-b-02', level: 'couple', kind: 'binaire', text: "Penses-tu que je te connais mieux que la plupart des gens ?", sensitivity: 2, tags: ['confiance'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui', non: 'Pas encore' }, origin: 'echo' },
  { id: 'p-b-03', level: 'couple', kind: 'binaire', text: "Y a-t-il un sujet que nous évitons systématiquement ?", sensitivity: 2, tags: ['non-dits'], triggerWarnings: [], reciprocal: true, binaryOptions: { oui: 'Oui, un au moins', non: 'Non, aucun' }, origin: 'echo' },
];
