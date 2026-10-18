/**
 * Gamification collaborative (intracouple).
 *
 * Principe fondateur : les points n'appartiennent JAMAIS à un joueur isolé,
 * toujours au profil couple. Les trois catégories quantifient des dimensions
 * distinctes de la relation, ce qui évite l'effet « score brut » et rend la
 * progression lisible.
 */

export type PointCategory = 'chimie' | 'confiance' | 'complicite';

export const POINT_CATEGORIES: Record<
  PointCategory,
  { label: string; description: string; colorHex: string; textClass: string }
> = {
  chimie: {
    label: 'Chimie',
    description: "L'attrait et le plaisir partagé : ce qui vous donne envie de rejouer.",
    colorHex: '#F43F5E',
    textClass: 'text-chimie',
  },
  confiance: {
    label: 'Confiance',
    description: 'La sécurité ressentie quand on se dévoile, y compris dans les refus.',
    colorHex: '#38BDF8',
    textClass: 'text-confiance',
  },
  complicite: {
    label: 'Complicité',
    description: 'Les réponses réciproques, les rituels et les souvenirs construits à deux.',
    colorHex: '#A78BFA',
    textClass: 'text-complicite',
  },
};

export type PointTotals = Record<PointCategory, number>;

export const ZERO_POINTS: PointTotals = { chimie: 0, confiance: 0, complicite: 0 };

export function addPoints(current: PointTotals, delta: Partial<PointTotals>): PointTotals {
  return {
    chimie: current.chimie + (delta.chimie ?? 0),
    confiance: current.confiance + (delta.confiance ?? 0),
    complicite: current.complicite + (delta.complicite ?? 0),
  };
}

/**
 * Indice de lien : moyenne géométrique pondérée des trois catégories.
 *
 * Choix de conception important : une moyenne géométrique PUNIT les
 * déséquilibres. Un couple à 300/10/300 obtient un indice bien plus faible
 * qu'un couple à 150/150/150. Cela décourage le farming d'une seule
 * ressource et encourage une relation équilibrée — c'est aussi la métrique
 * positive utilisée pour les classements inter-couples (jamais un score brut).
 */
export function bondIndex(points: PointTotals): number {
  const values = [points.chimie, points.confiance, points.complicite].map((v) => Math.max(1, v));
  const product = values.reduce((acc, v) => acc * v, 1);
  return Math.round(Math.cbrt(product));
}

export function dominantCategory(points: PointTotals): PointCategory {
  const entries = Object.entries(points) as [PointCategory, number][];
  return entries.reduce((best, entry) => (entry[1] > points[best] ? entry[0] : best), entries[0]![0]);
}
