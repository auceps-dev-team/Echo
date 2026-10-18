import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, EmptyState, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import PointsRow from '../components/ui/PointsRow';
import Screen from '../components/ui/Screen';
import { cn } from '../components/ui/cn';
import {
  createCloudAdapter,
  LocalOnlyAdapter,
  type LeaderboardEntry,
  type LeaderboardScope,
} from '../cloud/adapter';
import type { PointTotals } from '../gamification/points';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Classement'>;

const SCOPES: { id: LeaderboardScope; label: string }[] = [
  { id: 'cercle', label: 'Notre cercle' },
  { id: 'region', label: 'Région' },
  { id: 'monde', label: 'Monde' },
];

/** Couples de démonstration : rendent l’écran lisible tant qu’aucun backend n’est branché. */
const DEMO_COUPLES: { couple: { coupleId: string; displayName: string; visibility: 'cercle' }; points: PointTotals }[] = [
  { couple: { coupleId: 'demo_1', displayName: 'Awa & Koffi', visibility: 'cercle' }, points: { chimie: 180, confiance: 210, complicite: 165 } },
  { couple: { coupleId: 'demo_2', displayName: 'Léa & Marc', visibility: 'cercle' }, points: { chimie: 140, confiance: 120, complicite: 150 } },
  { couple: { coupleId: 'demo_3', displayName: 'Sara & Youssef', visibility: 'cercle' }, points: { chimie: 95, confiance: 130, complicite: 88 } },
];

/**
 * Classement inter-couples — pilier compétitif.
 *
 * Deux garde-fous de conception :
 *  1. la métrique affichée est l'INDICE DE LIEN (moyenne géométrique des trois
 *     ressources), jamais un score brut : on ne peut pas « farmer » une seule
 *     dimension pour gagner ;
 *  2. l'écran fonctionne intégralement hors ligne, dans un état explicite
 *     « non connecté » plutôt qu'en erreur — cohérent avec l'architecture
 *     offline-first et avec un backend qui n'est pas encore branché.
 */
export default function ClassementScreen({ navigation }: Props) {
  const [scope, setScope] = useState<LeaderboardScope>('cercle');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [online, setOnline] = useState(false);
  const [challengeAvailable, setChallengeAvailable] = useState(false);

  const profile = useCoupleStore((s) => s.profile);
  const points = useCoupleStore((s) => s.points);
  const visibility = useSettingsStore((s) => s.visibility);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const adapter = createCloudAdapter({ provider: 'none' });
      const rows = adapter instanceof LocalOnlyAdapter ? new LocalOnlyAdapter(() => DEMO_COUPLES) : adapter;
      const [board, challenge] = await Promise.all([rows.getLeaderboard(scope), rows.getWeeklyChallenge()]);
      if (cancelled) return;
      setOnline(board.ok && adapter.available);
      setEntries(board.ok ? board.data : []);
      setChallengeAvailable(challenge.ok && challenge.data !== null);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const myDisplayName = profile ? `${profile.partnerAName} & ${profile.partnerBName}` : 'Votre couple';

  return (
    <Screen testID="screen-leaderboard">
      <View className="flex-row items-center gap-3 pt-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#8B7FA8" />
        </Pressable>
        <Text className="flex-1 text-2xl font-extrabold text-foreground">Classement</Text>
      </View>

      <ScreenTitle
        title="Entre couples"
        subtitle="La compétition porte sur l’indice de lien, jamais sur le nombre de réponses intimes."
      />

      <CardShell>
        <SectionTitle>Votre couple</SectionTitle>
        <View className="mt-3 gap-2">
          <Text className="text-lg font-extrabold text-foreground">{myDisplayName}</Text>
          <PointsRow points={points} size="sm" />
          <Text className="text-2xs leading-4 text-muted">
            Visibilité actuelle : {visibility}. {visibility === 'prive' ? 'Vous n’apparaissez dans aucun classement.' : 'Seul l’indice de lien est partagé.'}
          </Text>
        </View>
      </CardShell>

      <View className="flex-row gap-2">
        {SCOPES.map((option) => {
          const active = option.id === scope;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setScope(option.id)}
              className={cn('flex-1 rounded-xl border px-3 py-2', active ? 'border-primary bg-primary/15' : 'border-border bg-white/5')}
            >
              <Text className={cn('text-center text-2xs font-bold uppercase tracking-wider', active ? 'text-primary-soft' : 'text-muted')}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <View className="flex-row items-center gap-2">
          <Ionicons name={online ? 'cloud-outline' : 'cloud-offline-outline'} size={15} color={online ? '#86EFAC' : '#8B7FA8'} />
          <SectionTitle>{online ? 'Classement synchronisé' : 'Mode hors ligne'}</SectionTitle>
        </View>
        {entries.length === 0 ? (
          <View className="mt-3">
            <EmptyState
              icon={<Ionicons name="trophy-outline" size={22} color="#8B7FA8" />}
              title="Aucun classement disponible"
              hint="Aucun backend n’est branché sur ce socle : le mode compétitif s’affiche en démonstration locale."
            />
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {entries.map((entry) => (
              <View key={entry.coupleId} className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <Text className="w-6 text-center text-base font-extrabold text-accent">{entry.rank}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{entry.displayName}</Text>
                  <Text className="text-2xs text-muted">
                    {entry.points.chimie} chimie · {entry.points.confiance} confiance · {entry.points.complicite} complicité
                  </Text>
                </View>
                <Text className="text-base font-extrabold text-primary-soft">{entry.bond}</Text>
              </View>
            ))}
          </View>
        )}
      </CardShell>

      <CardShell>
        <SectionTitle>Défi hebdomadaire</SectionTitle>
        <Text className="mt-2 text-sm leading-5 text-muted">
          {challengeAvailable
            ? 'Un défi est en cours : complétez la série demandée pour marquer des points bonus.'
            : 'Aucun défi actif hors ligne. Les défis hebdomadaires nécessitent un backend (Firebase Functions ou Supabase Edge Function) — voir docs/architecture.md §8.'}
        </Text>
      </CardShell>

      <CardShell>
        <SectionTitle>Battle Royale couple contre couple</SectionTitle>
        <Text className="mt-2 text-sm leading-5 text-muted">
          Mode temps réel prévu : deux couples s’affrontent sur une série de questions binaires, premier arrivé au score
          cible gagne. Le contrat `CloudSyncAdapter.createMatch()` est déjà en place côté client.
        </Text>
      </CardShell>

      <Button action="secondary" variant="outline" fullWidth onPress={() => navigation.navigate('Parametres')}>
        Régler ma visibilité
      </Button>
    </Screen>
  );
}
