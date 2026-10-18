import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { LevelDefinition } from '../../theme/levels';
import { cn } from './cn';

/** Pastille de niveau : couleur et numéro reflètent la progression SPT. */
export function LevelPill({ level, className }: { level: LevelDefinition; className?: string }) {
  return (
    <View
      className={cn('flex-row items-center gap-1.5 self-start rounded-full px-3 py-1', level.palette.bg, className)}
      style={{ backgroundColor: `${level.palette.hex}22` }}
    >
      <Ionicons name="ellipse" size={7} color={level.palette.hex} />
      <Text className="text-2xs font-bold uppercase tracking-[1.5px]" style={{ color: level.palette.hex }}>
        N{level.order} · {level.label}
      </Text>
    </View>
  );
}

/** Barre de progression discrète de la session (pilote la rampe de sensibilité). */
export function SessionProgress({ value, hex }: { value: number; hex: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <View className="h-full rounded-full" style={{ width: `${clamped * 100}%`, backgroundColor: hex }} />
    </View>
  );
}
