import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, EmptyState, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import PointsRow from '../components/ui/PointsRow';
import Screen from '../components/ui/Screen';
import { cn } from '../components/ui/cn';
import { BADGES } from '../gamification/badges';
import { buildRelationshipSummary } from '../game/journal';
import { getLevel } from '../theme/levels';
import { useCoupleStore } from '../state/coupleStore';
import { useNavigation } from '@react-navigation/native';
import type { TabNavigationProp } from '../navigation/props';

/**
 * Profil couple — tableau de bord du parcours commun.
 *
 * Les badges exclusifs (`private: true`) sont volontairement marqués comme
 * tels : ils ne seront JAMAIS exposés dans un classement inter-couples.
 */
export default function ProfileScreen() {
  const navigation = useNavigation<TabNavigationProp<'Profil'> >();
  const profile = useCoupleStore((s) => s.profile);
  const points = useCoupleStore((s) => s.points);
  const badgeIds = useCoupleStore((s) => s.badgeIds);
  const sessions = useCoupleStore((s) => s.sessions);

  const deepest = getLevel(profile?.deepestLevel ?? 'connaissance');
  const summary = buildRelationshipSummary({
    totalSessions: sessions.length,
    totalPoints: points,
    currentLevel: deepest.id,
    deepestLevelReached: deepest.id,
    badgesCount: badgeIds.length,
    partnerName: profile?.partnerBName,
  });

  return (
    <Screen gradient={deepest.palette.gradient} testID="screen-profile">
      <View className="items-center gap-2 pt-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-chimie/20">
            <Text className="text-lg font-extrabold text-chimie">{profile?.partnerAName?.[0]?.toUpperCase() ?? 'A'}</Text>
          </View>
          <Ionicons name="heart" size={18} color="#F43F5E" />
          <View className="h-12 w-12 items-center justify-center rounded-full bg-confiance/20">
            <Text className="text-lg font-extrabold text-confiance">{profile?.partnerBName?.[0]?.toUpperCase() ?? 'B'}</Text>
          </View>
        </View>
        <Text className="text-xl font-extrabold text-foreground">
          {profile ? `${profile.partnerAName} & ${profile.partnerBName}` : 'Profil couple'}
        </Text>
        <Text className="text-2xs uppercase tracking-[2px] text-muted">
          Créé le {profile ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '—'}
        </Text>
      </View>

      <ScreenTitle title="Votre parcours" subtitle={summary} />

      <CardShell>
        <SectionTitle>Ressources du couple</SectionTitle>
        <View className="mt-3">
          <PointsRow points={points} />
        </View>
      </CardShell>

      <CardShell testID="badges">
        <SectionTitle>Badges partagés ({badgeIds.length}/{BADGES.length})</SectionTitle>
        {badgeIds.length === 0 ? (
          <View className="mt-3">
            <EmptyState
              icon={<Ionicons name="ribbon-outline" size={22} color="#8B7FA8" />}
              title="Aucun badge pour l'instant"
              hint="Le premier se débloque dès votre première session terminée ensemble."
            />
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {BADGES.filter((b) => badgeIds.includes(b.id)).map((badge) => (
              <View
                key={badge.id}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl border px-3 py-2.5',
                  badge.rarity === 'exclusif' ? 'border-accent/40 bg-accent/10' : 'border-border bg-white/5',
                )}
              >
                <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={20} color="#F59E0B" />
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-foreground">{badge.label}</Text>
                    {badge.private ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5">
                        <Ionicons name="eye-off-outline" size={9} color="#F59E0B" />
                        <Text className="text-2xs font-bold uppercase tracking-wider text-accent">Privé</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-2xs leading-4 text-muted">{badge.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </CardShell>

      <CardShell>
        <SectionTitle>Badges à venir</SectionTitle>
        <View className="mt-3 gap-2">
          {BADGES.filter((b) => !badgeIds.includes(b.id))
            .slice(0, 3)
            .map((badge) => (
              <View key={badge.id} className="flex-row items-center gap-3 opacity-60">
                <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={18} color="#8B7FA8" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-muted">{badge.label}</Text>
                  <Text className="text-2xs leading-4 text-muted">{badge.description}</Text>
                </View>
              </View>
            ))}
        </View>
      </CardShell>

      <View className="gap-3">
        <Button action="secondary" variant="outline" fullWidth onPress={() => navigation.navigate('Classement')}>
          Voir le classement des couples
        </Button>
        <Button action="secondary" variant="outline" fullWidth onPress={() => navigation.navigate('Studio')}>
          Ouvrir le Studio de questions
        </Button>
      </View>
    </Screen>
  );
}
