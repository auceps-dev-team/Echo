import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import { cn } from '../components/ui/cn';
import { MODE_LABELS } from '../content/labels';
import type { GameMode } from '../game/engine';
import { availableLevels, LEVEL_ORDER, getLevel } from '../theme/levels';
import { useNavigation } from '@react-navigation/native';
import type { TabNavigationProp } from '../navigation/props';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';

/**
 * Sélection de niveau + mode.
 *
 * Chaque carte de niveau affiche sa phase SPT, son invite narrative et, si
 * verrouillé, la RAISON précise du verrou (sessions manquantes ou palier de
 * consentement insuffisant). Le blocage est explicite et jamais punitif :
 * il indique toujours le chemin pour débloquer.
 */
export default function LevelSelectScreen() {
  const navigation = useNavigation<TabNavigationProp<'Niveaux'> >();
  const sessions = useCoupleStore((s) => s.sessions.length);
  const consentTier = useSettingsStore((s) => s.consentTier);
  const [mode, setMode] = useState<GameMode>('classique');

  const levels = availableLevels({ completedSessions: sessions, consentTier });
  const selectedLevel = levels.find((entry) => entry.unlocked);
  const ambient = selectedLevel ? getLevel(selectedLevel.level.id).palette.gradient : (['#150E22', '#0B0713'] as [string, string]);

  function play(levelId: (typeof LEVEL_ORDER)[number]) {
    navigation.navigate('Jeu', { level: levelId, mode });
  }

  return (
    <Screen gradient={ambient} testID="screen-levels">
      <ScreenTitle title="Choisir un niveau" subtitle="L'intimité se construit par paliers : chaque niveau correspond à une phase de dévoilement." />

      <CardShell>
        <SectionTitle>Mode de jeu</SectionTitle>
        <View className="mt-3 gap-2">
          {(Object.keys(MODE_LABELS) as GameMode[]).map((key) => {
            const meta = MODE_LABELS[key];
            const active = key === mode;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setMode(key)}
                testID={`mode-${key}`}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl border px-4 py-3',
                  active ? 'border-primary bg-primary/15' : 'border-border bg-white/5',
                )}
              >
                <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={18} color={active ? '#F0ABFC' : '#8B7FA8'} />
                <View className="flex-1 gap-0.5">
                  <Text className={cn('text-sm font-bold', active ? 'text-primary-soft' : 'text-foreground')}>
                    {meta.label}
                  </Text>
                  <Text className="text-2xs leading-4 text-muted">{meta.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </CardShell>

      <View className="gap-3">
        {levels.map(({ level, unlocked, reason }) => (
          <CardShell
            key={level.id}
            testID={`level-${level.id}`}
            className={cn(!unlocked && 'opacity-60')}
          >
            <View className="flex-row items-start gap-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${level.palette.hex}22` }}
              >
                <Ionicons
                  name={unlocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={18}
                  color={level.palette.hex}
                />
              </View>
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-extrabold text-foreground">{level.label}</Text>
                  <Text className="text-2xs uppercase tracking-widest" style={{ color: level.palette.hex }}>
                    {level.phaseLabel}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-muted">{level.tagline}</Text>
                <Text className="text-2xs leading-4 text-muted">{level.invitation}</Text>

                <View className="mt-2 flex-row items-center gap-3">
                  <Text className="text-2xs text-muted">Sensibilité max : {level.maxSensitivity}/3</Text>
                  <Text className="text-2xs text-muted">
                    Récompense : +{level.baseReward.chimie} chimie · +{level.baseReward.confiance} confiance
                  </Text>
                </View>

                {unlocked ? (
                  <Button size="sm" className="mt-3" onPress={() => play(level.id)} testID={`play-${level.id}`}>
                    Jouer ce niveau
                  </Button>
                ) : (
                  <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <Ionicons name="information-circle-outline" size={14} color="#8B7FA8" />
                    <Text className="flex-1 text-2xs leading-4 text-muted">{reason}</Text>
                  </View>
                )}
              </View>
            </View>
          </CardShell>
        ))}
      </View>
    </Screen>
  );
}
