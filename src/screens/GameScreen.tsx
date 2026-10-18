import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell } from '../components/ui/CardShell';
import EchoBubble from '../components/ui/EchoBubble';
import { LevelPill, SessionProgress } from '../components/ui/LevelPill';
import Screen from '../components/ui/Screen';
import { cn } from '../components/ui/cn';
import { KIND_LABELS, SENSITIVITY_LABELS, TRIGGER_LABELS } from '../content/labels';
import { getStorage } from '../db';
import { SESSION_LENGTH, selectSessionFinished, useGameStore } from '../state/gameStore';
import { useSettingsStore } from '../state/settingsStore';
import { useCoupleStore } from '../state/coupleStore';
import { useContentPool } from '../hooks/useContentPool';
import { useHaptics } from '../hooks/useHaptics';
import { getLevel } from '../theme/levels';
import { OFFICIAL_CARDS } from '../content';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Jeu'>;

/**
 * Écran de jeu.
 *
 * Trois principes d'UX responsable y sont appliqués concrètement :
 *  - le bouton « Passer » a la même taille et la même visibilité que « Répondre »
 *    (refuser est une action de premier ordre, jamais une sortie dérobée) ;
 *  - les avertissements de déclencheurs sont affichés AVANT la lecture complète,
 *    pour que personne ne soit surpris ;
 *  - les cartes réciproques exigent que les DEUX partenaires répondent : la
 *    réciprocité est le moteur de l'intimité, pas un simple libellé.
 */
export default function GameScreen({ navigation, route }: Props) {
  const { level, mode } = route.params;
  const levelDef = getLevel(level);
  const haptics = useHaptics();

  const { pool, loading } = useContentPool(mode === 'rapide' ? undefined : level);
  const consentTier = useSettingsStore((s) => s.consentTier);
  const blockedTags = useSettingsStore((s) => s.blockedTags);
  const blockedTriggers = useSettingsStore((s) => s.blockedTriggers);
  const echoBotEnabled = useSettingsStore((s) => s.echoBotEnabled);
  const completedSessions = useCoupleStore((s) => s.sessions.length);

  const card = useGameStore((s) => s.card);
  const answers = useGameStore((s) => s.answers);
  const points = useGameStore((s) => s.points);
  const echo = useGameStore((s) => s.echo);
  const exhausted = useGameStore((s) => s.exhausted);
  const progress = useGameStore((s) => s.progress());

  const [reciprocalStep, setReciprocalStep] = useState<'a' | 'b'>('a');
  const started = useRef(false);

  useEffect(() => {
    if (started.current || loading) return;
    started.current = true;
    (async () => {
      let playedIds: string[] = [];
      try {
        const db = await getStorage();
        playedIds = await db.recentCardIds(120);
      } catch {
        playedIds = [];
      }
      useGameStore.getState().start({
        level,
        mode,
        pool: pool.length > 0 ? pool : OFFICIAL_CARDS,
        playedIds,
        consentTier,
        blockedTags,
        blockedTriggers,
        echoBotEnabled,
        sessionIndex: completedSessions,
      });
    })();
    // Volontairement exécuté une seule fois : relancer start() réinitialiserait la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const finished = useGameStore(selectSessionFinished);

  useEffect(() => {
    if (finished) {
      navigation.replace('Resume', { level, mode });
    }
  }, [finished, navigation, level, mode]);

  function resolve(outcome: 'answered' | 'skipped') {
    void haptics(outcome === 'answered' ? 'success' : 'light');
    setReciprocalStep('a');
    useGameStore.getState().resolve(outcome);
  }

  function quit() {
    useGameStore.getState().reset();
    navigation.goBack();
  }

  return (
    <Screen gradient={levelDef.palette.gradient} scroll={false} testID="screen-game">
      <View className="flex-1 gap-4 px-5 pb-6">
        <View className="flex-row items-center justify-between pt-2">
          <Pressable accessibilityRole="button" accessibilityLabel="Quitter la partie" onPress={quit} hitSlop={12}>
            <Ionicons name="close" size={24} color="#8B7FA8" />
          </Pressable>
          <LevelPill level={levelDef} />
          <Text className="text-2xs uppercase tracking-widest text-muted">
            {answers.length}/{SESSION_LENGTH}
          </Text>
        </View>

        <SessionProgress value={progress} hex={levelDef.palette.hex} />

        {echoBotEnabled ? <EchoBubble line={echo} compact /> : null}

        <View className="flex-1 justify-center">
          {card ? (
            <CardShell className="gap-3 p-6" testID="current-card">
              <View className="flex-row items-center gap-2">
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: `${levelDef.palette.hex}22` }}
                >
                  <Text className="text-2xs font-bold uppercase tracking-widest" style={{ color: levelDef.palette.hex }}>
                    {KIND_LABELS[card.kind] ?? card.kind}
                  </Text>
                </View>
                <Text className="text-2xs uppercase tracking-widest text-muted">
                  {SENSITIVITY_LABELS[card.sensitivity] ?? 'Doux'}
                </Text>
                {card.reciprocal ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-complicite/15 px-2 py-0.5">
                    <Ionicons name="swap-horizontal" size={11} color="#A78BFA" />
                    <Text className="text-2xs font-bold uppercase tracking-wider text-complicite">Réciproque</Text>
                  </View>
                ) : null}
              </View>

              <Text className="text-2xl font-semibold leading-9 text-foreground">{card.text}</Text>

              {card.triggerWarnings.length > 0 ? (
                <View className="gap-1.5 rounded-xl border border-chimie/30 bg-chimie/10 px-3 py-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="shield-outline" size={13} color="#FCA5A5" />
                    <Text className="text-2xs font-bold uppercase tracking-widest text-chimie">Sujet sensible</Text>
                  </View>
                  <Text className="text-2xs leading-4 text-muted">
                    {card.triggerWarnings.map((t) => TRIGGER_LABELS[t]?.label ?? t).join(' · ')} — passer cette carte
                    ne coûte aucun point de confiance.
                  </Text>
                </View>
              ) : null}

              {card.kind === 'binaire' && card.binaryOptions ? (
                <View className="mt-2 gap-3">
                  <Text className="text-2xs uppercase tracking-[2px] text-muted">Réponse binaire</Text>
                  <View className="flex-row gap-3">
                    <Button fullWidth action="primary" onPress={() => resolve('answered')} testID="answer-oui">
                      <View className="items-center gap-0.5">
                        <Text className="text-base font-extrabold text-foreground">OUI</Text>
                        <Text className="text-2xs text-primary-soft">{card.binaryOptions.oui}</Text>
                      </View>
                    </Button>
                    <Button fullWidth action="secondary" variant="outline" onPress={() => resolve('answered')} testID="answer-non">
                      <View className="items-center gap-0.5">
                        <Text className="text-base font-extrabold text-foreground">NON</Text>
                        <Text className="text-2xs text-muted">{card.binaryOptions.non}</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              ) : null}
            </CardShell>
          ) : (
            <CardShell className="items-center gap-2 py-14">
              <Ionicons name="hourglass-outline" size={24} color="#8B7FA8" />
              <Text className="text-base font-semibold text-foreground">
                {loading ? 'Préparation du contenu…' : 'Plus de carte disponible'}
              </Text>
              {exhausted === 'all-blocked' ? (
                <Text className="text-center text-sm text-muted">
                  Toutes les cartes de ce niveau sont filtrées par vos réglages de consentement. Élargissez un filtre
                  dans Réglages pour continuer.
                </Text>
              ) : null}
              {exhausted === 'all-played' ? (
                <Text className="text-center text-sm text-muted">
                  Vous avez déjà joué toutes les cartes disponibles. Créez vos propres questions dans le Studio.
                </Text>
              ) : null}
            </CardShell>
          )}
        </View>

        {card ? (
          <View className="gap-3">
            {card.reciprocal ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={14} color="#A78BFA" />
                <Text className="flex-1 text-2xs leading-4 text-muted">
                  {reciprocalStep === 'a'
                    ? 'Carte réciproque : le premier partenaire répond, puis on échange les rôles.'
                    : 'Au second partenaire : votre réponse compte autant que la première.'}
                </Text>
                <Pressable onPress={() => setReciprocalStep((s) => (s === 'a' ? 'b' : 'a'))} hitSlop={8}>
                  <Text className="text-2xs font-bold uppercase tracking-wider text-complicite">Échanger</Text>
                </Pressable>
              </View>
            ) : null}

            {card.kind !== 'binaire' ? (
              <Button size="lg" fullWidth onPress={() => resolve('answered')} testID="answer">
                Nous avons répondu
              </Button>
            ) : null}

            <Button
              action="ghost"
              variant="soft"
              fullWidth
              size="lg"
              onPress={() => resolve('skipped')}
              className={cn('border border-border')}
              testID="skip"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="shield-checkmark-outline" size={16} color="#8B7FA8" />
                <Text className="text-base font-semibold text-muted">Passer — sans pénalité</Text>
              </View>
            </Button>

            <View className="flex-row justify-center gap-4 pt-1">
              <Text className="text-2xs text-chimie">+{points.chimie} chimie</Text>
              <Text className="text-2xs text-confiance">+{points.confiance} confiance</Text>
              <Text className="text-2xs text-complicite">+{points.complicite} complicité</Text>
            </View>
          </View>
        ) : (
          <Button action="secondary" variant="outline" fullWidth onPress={quit}>
            Terminer la session
          </Button>
        )}
      </View>
    </Screen>
  );
}
