import { Text, View } from 'react-native';

import { POINT_CATEGORIES, type PointTotals } from '../../gamification/points';
import { bondIndex } from '../../gamification/points';

/**
 * Lignes de points du profil couple.
 *
 * Affiche les trois ressources collaboratives plus l'« indice de lien » —
 * la métrique positive utilisée pour tout classement. On ne montre jamais un
 * score de compétition brut entre partenaires : il n'y a pas de gagnant
 * individuel dans Echo.
 */
export default function PointsRow({
  points,
  showBond = true,
  size = 'md',
}: {
  points: PointTotals;
  showBond?: boolean;
  size?: 'sm' | 'md';
}) {
  const valueClass = size === 'sm' ? 'text-base' : 'text-2xl';
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {(Object.keys(POINT_CATEGORIES) as (keyof PointTotals)[]).map((key) => {
          const meta = POINT_CATEGORIES[key];
          return (
            <View
              key={key}
              className="flex-1 items-center gap-1 rounded-xl border border-border bg-white/5 px-2 py-3"
              testID={`points-${key}`}
            >
              <Text className="text-2xs uppercase tracking-widest text-muted">{meta.label}</Text>
              <Text className={valueClass} style={{ color: meta.colorHex, fontWeight: '800' }}>
                {points[key]}
              </Text>
            </View>
          );
        })}
      </View>
      {showBond ? (
        <View className="flex-row items-center justify-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
          <Text className="text-2xs uppercase tracking-[2px] text-primary-soft">Indice de lien</Text>
          <Text className="text-base font-extrabold text-foreground">{bondIndex(points)}</Text>
        </View>
      ) : null}
    </View>
  );
}
