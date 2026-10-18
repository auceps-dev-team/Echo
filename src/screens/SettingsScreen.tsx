import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, SectionTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import TagToggle, { InfoRow } from '../components/ui/TagToggle';
import { cn } from '../components/ui/cn';
import { TRIGGER_LABELS, TRIGGER_ORDER } from '../content/labels';
import { getStorage } from '../db';
import type { ConsentTier } from '../theme/levels';
import type { RootStackParamList } from '../navigation/types';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Parametres'>;

const TIERS: { id: ConsentTier; label: string; description: string }[] = [
  { id: 'decouverte', label: 'Découverte', description: 'Sensibilité max 1/3 — cartes douces uniquement.' },
  { id: 'confiance', label: 'Confiance', description: 'Sensibilité max 2/3 — ajoute l’intime émotionnel.' },
  { id: 'libre', label: 'Libre', description: 'Sensibilité max 3/3 — débloque le niveau Fiancé.' },
];

const VISIBILITY: { id: 'prive' | 'cercle' | 'public'; label: string; description: string }[] = [
  { id: 'prive', label: 'Privé', description: 'Rien ne quitte l’appareil. Classements désactivés.' },
  { id: 'cercle', label: 'Cercle d’amis', description: 'Visible uniquement par les couples que vous invitez.' },
  { id: 'public', label: 'Public', description: 'Apparaît dans les classements (indice de lien uniquement).' },
];

/**
 * Réglages : le centre de contrôle du consentement.
 *
 * Chaque filtre est EFFECTIF — il modifie immédiatement le tirage du moteur.
 * La visibilité inter-couples est `prive` par défaut et ne s'élargit que sur
 * action explicite (conformité aux principes Responsible Social Media).
 */
export default function SettingsScreen({ navigation }: Props) {
  const settings = useSettingsStore();
  const resetCouple = useCoupleStore((s) => s.hydrate);
  const [busy, setBusy] = useState(false);

  async function persist(patch: Partial<typeof settings> = {}) {
    setBusy(true);
    try {
      const db = await getStorage();
      const current = useSettingsStore.getState();
      const next = { ...current, ...patch };
      await db.saveSettings({
        consentTier: next.consentTier,
        blockedTags: next.blockedTags,
        blockedTriggers: next.blockedTriggers,
        visibility: next.visibility,
        haptics: next.haptics,
        echoBotEnabled: next.echoBotEnabled,
        ageConfirmed: next.ageConfirmed,
      });
    } finally {
      setBusy(false);
    }
  }

  function onWipe() {
    const message =
      'Cette action supprime définitivement le profil couple, l’historique, les réponses et vos decks personnalisés de cet appareil. Continuer ?';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void doWipe();
      return;
    }
    Alert.alert('Effacer toutes les données locales', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout effacer', style: 'destructive', onPress: () => void doWipe() },
    ]);
  }

  async function doWipe() {
    setBusy(true);
    try {
      const db = await getStorage();
      await db.wipeAll();
      useSettingsStore.getState().reset();
      resetCouple({ profile: null, sessions: [], answers: [], decksCreated: 0, cardsCreated: 0 });
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="screen-settings">
      <View className="flex-row items-center gap-3 pt-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#8B7FA8" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-foreground">Réglages</Text>
        </View>
      </View>

      <CardShell>
        <SectionTitle>Palier de consentement</SectionTitle>
        <Text className="mt-1 text-2xs leading-4 text-muted">
          Plafonne la sensibilité des cartes tirées. Abaissable à tout moment, sans justification.
        </Text>
        <View className="mt-3 gap-2">
          {TIERS.map((option) => {
            const active = option.id === settings.consentTier;
            return (
              <Button
                key={option.id}
                action="secondary"
                variant={active ? 'solid' : 'outline'}
                fullWidth
                className={cn(active && 'border-primary bg-primary/20')}
                onPress={() => {
                  settings.setConsentTier(option.id);
                  void persist({ consentTier: option.id });
                }}
                testID={`consent-${option.id}`}
              >
                <View className="flex-1 items-start gap-0.5">
                  <Text className={cn('text-sm font-bold', active ? 'text-primary-soft' : 'text-foreground')}>
                    {option.label}
                  </Text>
                  <Text className="text-2xs leading-4 text-muted">{option.description}</Text>
                </View>
              </Button>
            );
          })}
        </View>
      </CardShell>

      <CardShell testID="blocked-triggers">
        <SectionTitle>Sujets à ne jamais aborder</SectionTitle>
        <Text className="mt-1 mb-3 text-2xs leading-4 text-muted">
          Les cartes contenant un sujet activé sont retirées définitivement du tirage, y compris celles que vous avez
          créées.
        </Text>
        <View className="gap-2">
          {TRIGGER_ORDER.map((trigger) => (
            <TagToggle
              key={trigger}
              label={TRIGGER_LABELS[trigger].label}
              description={TRIGGER_LABELS[trigger].description}
              active={settings.blockedTriggers.includes(trigger)}
              onToggle={() => {
                settings.toggleBlockedTrigger(trigger);
                void persist();
              }}
              testID={`trigger-${trigger}`}
            />
          ))}
        </View>
      </CardShell>

      <CardShell>
        <SectionTitle>Vie privée & visibilité</SectionTitle>
        <View className="mt-3 gap-2">
          {VISIBILITY.map((option) => {
            const active = option.id === settings.visibility;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  settings.setVisibility(option.id);
                  void persist({ visibility: option.id });
                }}
                className={cn(
                  'flex-row items-center gap-3 rounded-xl border px-4 py-3',
                  active ? 'border-confiance/60 bg-confiance/10' : 'border-border bg-white/5',
                )}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={active ? '#38BDF8' : '#8B7FA8'}
                />
                <View className="flex-1">
                  <Text className={cn('text-sm font-bold', active ? 'text-confiance' : 'text-foreground')}>
                    {option.label}
                  </Text>
                  <Text className="text-2xs leading-4 text-muted">{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-3">
          <InfoRow icon="phone-portrait-outline" label="Stockage" value="Local uniquement" tone="positive" />
        </View>
      </CardShell>

      <CardShell>
        <SectionTitle>Expérience</SectionTitle>
        <View className="mt-3 gap-2">
          <TagToggle
            label="Agent facilitateur Echo"
            description="Répliques d’ouverture, réciprocité et messages de refus bienveillants."
            active={settings.echoBotEnabled}
            onToggle={() => {
              settings.setEchoBot(!settings.echoBotEnabled);
              void persist({ echoBotEnabled: !settings.echoBotEnabled });
            }}
            testID="toggle-echo"
          />
          <TagToggle
            label="Retours haptiques"
            description="Vibrations légères à chaque réponse (désactivé sur l’aperçu web)."
            active={settings.haptics}
            onToggle={() => {
              settings.setHaptics(!settings.haptics);
              void persist({ haptics: !settings.haptics });
            }}
            testID="toggle-haptics"
          />
        </View>
      </CardShell>

      <View className="gap-3">
        <Button action="secondary" variant="outline" fullWidth onPress={() => navigation.navigate('Consentement')}>
          Lire la charte de confidentialité
        </Button>
        <Button action="danger" variant="outline" fullWidth loading={busy} onPress={onWipe} testID="wipe">
          Effacer toutes mes données locales
        </Button>
      </View>
    </Screen>
  );
}
