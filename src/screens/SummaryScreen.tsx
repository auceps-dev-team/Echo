import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, SectionTitle } from '../components/ui/CardShell';
import PointsRow from '../components/ui/PointsRow';
import Screen from '../components/ui/Screen';
import { BADGES } from '../gamification/badges';
import { buildJournalEntry } from '../game/journal';
import { getStorage, isNightSession } from '../db';
import type { AnswerRow, SessionRow } from '../db/types';
import { useCoupleStore } from '../state/coupleStore';
import { useGameStore } from '../state/gameStore';
import { getLevel } from '../theme/levels';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Resume'>;

/**
 * Fin de session = écriture du Journal de Bord Relationnel.
 *
 * La session est transformée en mini-récit positif avant d'être persistée.
 * C'est aussi le moment où les badges sont recalculés : ils ne sont jamais
 * stockés comme un état séparé, mais dérivés de l'historique.
 */
export default function SummaryScreen({ navigation, route }: Props) {
  const { level, mode } = route.params;
  const levelDef = getLevel(level);

  const answers = useGameStore((s) => s.answers);
  const points = useGameStore((s) => s.points);
  const deepestSensitivity = useGameStore((s) => s.deepestSensitivity);
  const startedAt = useGameStore((s) => s.startedAt);

  const profile = useCoupleStore((s) => s.profile);
  const badgeIdsBefore = useRef<string[]>(useCoupleStore.getState().badgeIds);
  const recordSession = useCoupleStore((s) => s.recordSession);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved) return;
    (async () => {
      try {
        const db = await getStorage();
        const now = new Date();
        const sessionInput: Omit<SessionRow, 'id'> = {
          level,
          mode,
          answered: answers.filter((a) => a.outcome === 'answered').length,
          skipped: answers.filter((a) => a.outcome === 'skipped').length,
          chimie: points.chimie,
          confiance: points.confiance,
          complicite: points.complicite,
          deepestSensitivity,
          nightSession: isNightSession(now) ? 1 : 0,
          playedAt: now.toISOString(),
        };
        const sessionId = await db.insertSession(sessionInput);
        const sessionRow: SessionRow = { ...sessionInput, id: sessionId };

        const answerRows: AnswerRow[] = [];
        for (const answer of answers) {
          const id = await db.insertAnswer({
            sessionId,
            cardId: answer.card.id,
            level: answer.card.level,
            kind: answer.card.kind,
            outcome: answer.outcome,
            sensitivity: answer.card.sensitivity,
            reciprocal: answer.card.reciprocal ? 1 : 0,
            note: answer.note ?? null,
            answeredAt: answer.answeredAt,
          });
          answerRows.push({
            id,
            sessionId,
            cardId: answer.card.id,
            level: answer.card.level,
            kind: answer.card.kind,
            outcome: answer.outcome,
            sensitivity: answer.card.sensitivity,
            reciprocal: answer.card.reciprocal ? 1 : 0,
            note: answer.note ?? null,
            answeredAt: answer.answeredAt,
          });
        }

        recordSession({ session: sessionRow, answers: answerRows });

        // Le niveau le plus profond atteint est remonté sur le profil couple.
        const currentProfile = useCoupleStore.getState().profile;
        if (currentProfile) {
          const deepest = getLevel(currentProfile.deepestLevel).order >= levelDef.order
            ? currentProfile.deepestLevel
            : level;
          await db.saveProfile({
            ...currentProfile,
            deepestLevel: deepest,
            chimie: useCoupleStore.getState().points.chimie,
            confiance: useCoupleStore.getState().points.confiance,
            complicite: useCoupleStore.getState().points.complicite,
          });
        }

        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "L'enregistrement local de la session a échoué.");
      } finally {
        useGameStore.getState().reset();
      }
    })();
  }, [saved, answers, points, deepestSensitivity, level, mode, levelDef.order, recordSession]);

  const newBadges = useCoupleStore((s) => BADGES.filter((b) => s.badgeIds.includes(b.id) && !badgeIdsBefore.current.includes(b.id)));

  const entry = buildJournalEntry({
    date: startedAt instanceof Date ? startedAt : new Date(startedAt),
    level,
    cardsAnswered: answers.filter((a) => a.outcome === 'answered').length,
    cardsSkipped: answers.filter((a) => a.outcome === 'skipped').length,
    deepestSensitivity,
    reciprocalAnswers: answers.filter((a) => a.card.reciprocal && a.outcome === 'answered').length,
    points,
    highlight: answers.filter((a) => a.outcome === 'answered').sort((a, b) => b.card.sensitivity - a.card.sensitivity)[0]?.card.text,
    partnerName: profile?.partnerBName,
  });

  return (
    <Screen gradient={levelDef.palette.gradient} testID="screen-summary">
      <View className="items-center gap-2 pt-6">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
          <Ionicons name="checkmark-done" size={26} color="#F0ABFC" />
        </View>
        <Text className="text-2xl font-extrabold text-foreground">Session terminée</Text>
      </View>

      <CardShell className="gap-2" testID="journal-entry">
        <SectionTitle>Journal de bord relationnel</SectionTitle>
        <Text className="text-lg font-bold text-foreground">{entry.title}</Text>
        <Text className="text-sm leading-6 text-muted">{entry.narrative}</Text>
        <Text className="text-2xs font-semibold uppercase tracking-widest" style={{ color: levelDef.palette.hex }}>
          {entry.statsLine}
        </Text>
      </CardShell>

      <CardShell>
        <SectionTitle>Points ajoutés au profil couple</SectionTitle>
        <View className="mt-3">
          <PointsRow points={points} showBond={false} size="sm" />
        </View>
      </CardShell>

      {newBadges.length > 0 ? (
        <CardShell className="gap-2">
          <SectionTitle>Nouveaux badges partagés</SectionTitle>
          {newBadges.map((badge) => (
            <View key={badge.id} className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
              <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={18} color="#F59E0B" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">{badge.label}</Text>
                <Text className="text-2xs leading-4 text-muted">{badge.description}</Text>
              </View>
            </View>
          ))}
        </CardShell>
      ) : null}

      {error ? <Text className="text-center text-sm text-chimie">{error}</Text> : null}

      <View className="mt-2 gap-3">
        <Button
          size="lg"
          fullWidth
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'Journal' } }] })}
        >
          Voir notre journal
        </Button>
        <Button action="secondary" variant="outline" fullWidth onPress={() => navigation.navigate('Jeu', { level, mode })}>
          Rejouer tout de suite
        </Button>
        <Button action="ghost" variant="soft" fullWidth onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'Accueil' } }] })}>
          Retour à l'accueil
        </Button>
      </View>
    </Screen>
  );
}
