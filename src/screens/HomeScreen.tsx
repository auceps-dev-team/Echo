import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, SectionTitle } from '../components/ui/CardShell';
import EchoBubble from '../components/ui/EchoBubble';
import PointsRow from '../components/ui/PointsRow';
import Screen from '../components/ui/Screen';
import { echoSessionOpener } from '../echo-bot/echo';
import { OFFICIAL_COUNTS } from '../content';
import { getLevel } from '../theme/levels';
import { useNavigation } from '@react-navigation/native';
import type { TabNavigationProp } from '../navigation/props';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';

/**
 * Accueil : tableau de bord du parcours commun.
 *
 * On y montre d'abord le LIEN (points catégorisés, indice de lien), jamais un
 * score compétitif. Echo ouvre la session par réciprocité : l'agent se dévoile
 * en premier pour déclencher le dévoilement mutuel.
 */
export default function HomeScreen() {
  const navigation = useNavigation<TabNavigationProp<'Accueil'> >();
  const profile = useCoupleStore((s) => s.profile);
  const points = useCoupleStore((s) => s.points);
  const sessions = useCoupleStore((s) => s.sessions);
  const badgeIds = useCoupleStore((s) => s.badgeIds);
  const echoEnabled = useSettingsStore((s) => s.echoBotEnabled);

  const deepestLevel = getLevel(profile?.deepestLevel ?? 'connaissance');
  const opener = useMemo(() => echoSessionOpener(deepestLevel.id, sessions.length), [deepestLevel.id, sessions.length]);

  const partnerLabel = profile ? `${profile.partnerAName} & ${profile.partnerBName}` : 'Votre duo';

  return (
    <Screen gradient={deepestLevel.palette.gradient} testID="screen-home">
      <View className="flex-row items-center justify-between pt-2">
        <View className="gap-0.5">
          <Text className="text-2xs uppercase tracking-[2px] text-muted">Profil couple</Text>
          <Text className="text-2xl font-extrabold text-foreground">{partnerLabel}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réglages"
            onPress={() => navigation.navigate('Parametres')}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-white/5"
          >
            <Ionicons name="settings-outline" size={18} color="#8B7FA8" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Classement"
            onPress={() => navigation.navigate('Classement')}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-white/5"
          >
            <Ionicons name="trophy-outline" size={18} color="#8B7FA8" />
          </Pressable>
        </View>
      </View>

      {echoEnabled ? <EchoBubble line={opener} /> : null}

      <CardShell testID="home-points">
        <SectionTitle>Vos ressources partagées</SectionTitle>
        <View className="mt-3">
          <PointsRow points={points} />
        </View>
      </CardShell>

      <CardShell>
        <SectionTitle>Progression d'intimité</SectionTitle>
        <View className="mt-3 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">Niveau le plus profond atteint</Text>
            <Text style={{ color: deepestLevel.palette.hex }} className="text-base font-extrabold">
              {deepestLevel.label}
            </Text>
          </View>
          <Text className="text-sm leading-5 text-muted">{deepestLevel.tagline}</Text>
          <View className="mt-1 flex-row gap-4">
            <Text className="text-sm text-muted">
              <Text className="font-bold text-foreground">{sessions.length}</Text> session(s)
            </Text>
            <Text className="text-sm text-muted">
              <Text className="font-bold text-foreground">{badgeIds.length}</Text> badge(s)
            </Text>
            <Text className="text-sm text-muted">
              <Text className="font-bold text-foreground">{OFFICIAL_COUNTS.total}</Text> cartes Echo
            </Text>
          </View>
        </View>
      </CardShell>

      <View className="mt-2 gap-3">
        <Button
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Tabs', { screen: 'Niveaux' })}
          icon={<Ionicons name="play" size={18} color="#F5F1FB" />}
          testID="cta-play"
        >
          Jouer une partie
        </Button>
        <View className="flex-row gap-3">
          <Button
            action="secondary"
            variant="outline"
            className="flex-1"
            fullWidth
            onPress={() => navigation.navigate('Studio')}
          >
            Créer nos questions
          </Button>
          <Button
            action="secondary"
            variant="outline"
            className="flex-1"
            fullWidth
            onPress={() => navigation.navigate('Tabs', { screen: 'Journal' })}
          >
            Notre journal
          </Button>
        </View>
      </View>
    </Screen>
  );
}
