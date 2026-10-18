import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cn } from './cn';

/**
 * Interrupteur de filtre (tag ou catégorie de déclencheur).
 *
 * Bloquer un élément retire IMMÉDIATEMENT toutes les cartes associées du
 * tirage : le contrôle utilisateur est effectif, pas décoratif. Le libellé
 * reste neutre et non stigmatisant.
 */
export default function TagToggle({
  label,
  active,
  onToggle,
  description,
  testID,
}: {
  label: string;
  active: boolean;
  onToggle(): void;
  description?: string;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${label} — ${active ? 'bloqué' : 'autorisé'}`}
      onPress={onToggle}
      testID={testID}
      className={cn(
        'flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3',
        active ? 'border-chimie/50 bg-chimie/10' : 'border-border bg-white/5',
      )}
    >
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-sm font-semibold', active ? 'text-chimie' : 'text-foreground')}>{label}</Text>
        {description ? <Text className="text-2xs leading-4 text-muted">{description}</Text> : null}
      </View>
      <View
        className={cn(
          'h-6 w-11 items-center rounded-full px-0.5 py-0.5',
          active ? 'bg-chimie' : 'bg-border',
        )}
      >
        <View
          className={cn('h-5 w-5 rounded-full bg-white')}
          style={{ transform: [{ translateX: active ? 20 : 0 }] }}
        />
      </View>
    </Pressable>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'neutral' | 'warning' | 'positive';
}) {
  const color = tone === 'warning' ? '#F43F5E' : tone === 'positive' ? '#86EFAC' : '#8B7FA8';
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-border bg-white/5 px-4 py-3">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="flex-1 text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
