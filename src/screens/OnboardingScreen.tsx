import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, ScreenTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import type { ConsentTier } from '../theme/levels';
import { getStorage, newCoupleId } from '../db';
import type { RootStackParamList } from '../navigation/types';
import { canStartOnboarding, onboardingErrorMessage } from './onboardingRules';
import { useCoupleStore } from '../state/coupleStore';
import { useSettingsStore } from '../state/settingsStore';
import { cn } from '../components/ui/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const TIERS: { id: ConsentTier; label: string; description: string }[] = [
  {
    id: 'decouverte',
    label: 'Découverte',
    description: 'Uniquement des cartes douces. Parfait pour commencer sans pression.',
  },
  {
    id: 'confiance',
    label: 'Confiance',
    description: 'Ajoute les questions intimes : souvenirs, émotions, non-dits du couple.',
  },
  {
    id: 'libre',
    label: 'Libre',
    description: 'Accès au niveau Fiancé et aux cartes sensibles. Modifiable à tout moment.',
  },
];

/**
 * Onboarding = porte d'entrée du consentement.
 *
 * Trois garde-fous avant la première partie :
 *  1. confirmation d'âge (18+) ;
 *  2. création explicite du profil COUPLE (jamais de profil individuel) ;
 *  3. choix du palier de consentement, qui plafonne la sensibilité des cartes.
 *
 * Rien n'est envoyé nulle part : tout est écrit dans la base locale.
 */
export default function OnboardingScreen({ navigation }: Props) {
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [tier, setTier] = useState<ConsentTier>('decouverte');
  const [ageOk, setAgeOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCouple = useCoupleStore((s) => s.createCouple);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  const gateInput = { partnerAName: nameA, partnerBName: nameB, ageConfirmed: ageOk, consentTier: tier };
  const canSubmit = canStartOnboarding(gateInput);

  async function onStart() {
    if (!canSubmit) {
      setError(onboardingErrorMessage(gateInput));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const profile = createCouple(nameA, nameB);
      const settings = {
        consentTier: tier,
        blockedTags: [] as string[],
        blockedTriggers: [] as never[],
        visibility: 'prive' as const,
        haptics: true,
        echoBotEnabled: true,
        ageConfirmed: true,
      };
      hydrateSettings(settings);
      const db = await getStorage();
      await db.saveSettings(settings);
      await db.saveProfile({ ...profile, coupleId: profile.coupleId || newCoupleId(), consentTier: tier });
      navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'Accueil' } }] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'enregistrement local a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen gradient={['#2E1065', '#0B0713']} testID="screen-onboarding">
      <View className="items-center gap-2 pt-6">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/25">
          <Ionicons name="sparkles" size={26} color="#F0ABFC" />
        </View>
        <Text className="text-4xl font-extrabold tracking-tight text-foreground">Echo</Text>
        <Text className="text-center text-sm leading-5 text-muted">
          Action ou Vérité pour deux. On progresse ensemble, à votre rythme, sans jamais forcer.
        </Text>
      </View>

      <ScreenTitle title="Vous deux" subtitle="Echo ne crée pas de profil individuel : tout est partagé." />

      <View className="gap-3">
        <CardShell>
          <Text className="mb-2 text-2xs uppercase tracking-[2px] text-muted">Prénoms</Text>
          <View className="gap-2">
            <TextInput
              value={nameA}
              onChangeText={setNameA}
              placeholder="Ton prénom"
              placeholderTextColor="#8B7FA8"
              maxLength={24}
              className="rounded-xl border border-border bg-white/5 px-4 py-3 text-base text-foreground"
            />
            <TextInput
              value={nameB}
              onChangeText={setNameB}
              placeholder="Son prénom"
              placeholderTextColor="#8B7FA8"
              maxLength={24}
              className="rounded-xl border border-border bg-white/5 px-4 py-3 text-base text-foreground"
            />
          </View>
        </CardShell>

        <CardShell>
          <Text className="mb-3 text-2xs uppercase tracking-[2px] text-muted">Palier de consentement</Text>
          <View className="gap-2">
            {TIERS.map((option) => {
              const selected = option.id === tier;
              return (
                <Button
                  key={option.id}
                  action="secondary"
                  variant={selected ? 'solid' : 'outline'}
                  fullWidth
                  onPress={() => setTier(option.id)}
                  className={cn(selected && 'border-primary bg-primary/25')}
                  testID={`tier-${option.id}`}
                >
                  <View className="flex-1 items-start gap-0.5">
                    <Text className={cn('text-sm font-bold', selected ? 'text-primary-soft' : 'text-foreground')}>
                      {option.label}
                    </Text>
                    <Text className="text-2xs leading-4 text-muted">{option.description}</Text>
                  </View>
                </Button>
              );
            })}
          </View>
        </CardShell>

        <Button action="ghost" variant="outline" fullWidth onPress={() => setAgeOk((v) => !v)} testID="age-gate">
          <View className="flex-row items-center gap-3">
            <Ionicons
              name={ageOk ? 'checkbox' : 'square-outline'}
              size={20}
              color={ageOk ? '#86EFAC' : '#8B7FA8'}
            />
            <Text className="flex-1 text-left text-sm text-foreground">
              Nous avons toutes les deux / tous les deux 18 ans ou plus.
            </Text>
          </View>
        </Button>

        {error ? <Text className="text-center text-sm text-chimie">{error}</Text> : null}

        <Button size="lg" fullWidth loading={saving} disabled={!canSubmit} onPress={onStart} testID="start">
          Commencer ensemble
        </Button>

        <Text className="text-center text-2xs leading-4 text-muted">
          Aucune donnée ne quitte l'appareil par défaut. Le partage inter-couples est désactivé tant que vous ne
          l'activez pas dans Réglages → Vie privée.
        </Text>
      </View>
    </Screen>
  );
}
