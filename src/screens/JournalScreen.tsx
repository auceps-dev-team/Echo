import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { CardShell, EmptyState, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import { MODE_LABELS } from '../content/labels';
import { buildJournalEntry } from '../game/journal';
import { buildRelationshipSummary } from '../game/journal';
import { getLevel } from '../theme/levels';
import { useCoupleStore } from '../state/coupleStore';


/**
 * Journal de Bord Relationnel.
 *
 * Chaque session est régénérée à la volée en récit : l'historique n'est jamais
 * une liste brute de scores. Les récits étant des fonctions pures de la session,
 * ils restent cohérents même si le format de narration évolue.
 */
export default function JournalScreen() {
  const sessions = useCoupleStore((s) => s.sessions);
  const answers = useCoupleStore((s) => s.answers);
  const profile = useCoupleStore((s) => s.profile);
  const points = useCoupleStore((s) => s.points);
  const deepestLevel = useCoupleStore((s) => s.profile?.deepestLevel ?? 'connaissance');
  const badgeIds = useCoupleStore((s) => s.badgeIds);

  const entries = useMemo(
    () =>
      sessions.map((session) => {
        const sessionAnswers = answers.filter((a) => a.sessionId === session.id);
        return buildJournalEntry({
          date: new Date(session.playedAt),
          level: session.level,
          cardsAnswered: session.answered,
          cardsSkipped: session.skipped,
          deepestSensitivity: session.deepestSensitivity,
          reciprocalAnswers: sessionAnswers.filter((a) => a.reciprocal === 1 && a.outcome === 'answered').length,
          points: { chimie: session.chimie, confiance: session.confiance, complicite: session.complicite },
          partnerName: profile?.partnerBName,
        });
      }),
    [sessions, answers, profile?.partnerBName],
  );

  const summary = buildRelationshipSummary({
    totalSessions: sessions.length,
    totalPoints: points,
    currentLevel: deepestLevel,
    deepestLevelReached: deepestLevel,
    badgesCount: badgeIds.length,
    partnerName: profile?.partnerBName,
  });

  return (
    <Screen testID="screen-journal">
      <ScreenTitle title="Notre journal" subtitle="Ce que vous avez construit ensemble, session après session." />

      <CardShell testID="relationship-summary">
        <SectionTitle>Vue d'ensemble</SectionTitle>
        <Text className="mt-2 text-sm leading-6 text-foreground">{summary}</Text>
      </CardShell>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="book-outline" size={26} color="#8B7FA8" />}
          title="Aucune entrée pour l'instant"
          hint="Votre première session ouvrira la première page du journal. Elle commence toujours en douceur, au niveau Connaissance."
        />
      ) : (
        <View className="gap-3">
          {entries.map((entry, index) => {
            const session = sessions[index];
            const level = getLevel(session?.level ?? 'connaissance');
            return (
              <CardShell key={`${session?.id ?? index}`} className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="ellipse" size={7} color={level.palette.hex} />
                  <Text className="text-2xs uppercase tracking-[2px] text-muted">{level.label}</Text>
                  <Text className="text-2xs uppercase tracking-widest text-muted">
                    · {MODE_LABELS[session?.mode ?? 'classique']?.label}
                  </Text>
                </View>
                <Text className="text-base font-bold text-foreground">{entry.title}</Text>
                <Text className="text-sm leading-6 text-muted">{entry.narrative}</Text>
                <Text className="text-2xs font-semibold" style={{ color: level.palette.hex }}>
                  {entry.statsLine}
                </Text>
              </CardShell>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
