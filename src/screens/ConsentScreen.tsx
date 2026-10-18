import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Consentement'>;

const PRINCIPLES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'phone-portrait-outline',
    title: 'Vos données restent sur l’appareil',
    body: 'Profil couple, historique, réponses et decks personnalisés sont stockés dans une base SQLite locale. Par défaut, aucun serveur n’est contacté et rien n’est synchronisé.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Le refus est une réponse valide',
    body: 'Passer une question ne retire aucun point de confiance, n’interrompt pas la session et n’est jamais signalé à l’autre comme un échec. Le consentement fait partie des règles du jeu.',
  },
  {
    icon: 'eye-off-outline',
    title: 'Vous décidez de ce qui est visible',
    body: 'La visibilité inter-couples est « Privé » par défaut. Les classements n’utilisent que l’indice de lien — jamais vos réponses, jamais le contenu de vos cartes.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Certains badges ne quittent jamais le couple',
    body: 'Les badges marqués « Privé » (ex. « Nuit blanche inoubliable ») sont exclus de tout classement et de tout partage, même si vous passez en visibilité publique.',
  },
  {
    icon: 'heart-outline',
    title: 'Pas de paradigme imposé',
    body: 'Aucune mécanique ne présuppose de rôle de genre ni d’ordre de passage. Les cartes réciproques demandent aux deux partenaires de répondre, dans l’ordre que vous choisissez.',
  },
  {
    icon: 'trash-outline',
    title: 'Effacement total en un geste',
    body: 'Réglages → « Effacer toutes mes données locales » supprime profil, historique, réponses et decks. L’action est immédiate et irréversible.',
  },
];

/** Charte de confidentialité et de consentement — inspirée des Responsible Social Media Guidelines. */
export default function ConsentScreen({ navigation }: Props) {
  return (
    <Screen testID="screen-consent">
      <View className="flex-row items-center gap-3 pt-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#8B7FA8" />
        </Pressable>
        <Text className="flex-1 text-2xl font-extrabold text-foreground">Charte Echo</Text>
      </View>

      <ScreenTitle
        title="Un espace sûr, par conception"
        subtitle="Echo manipule de l’intimité. Ces six engagements structurent toutes les décisions de conception."
      />

      <View className="gap-3">
        {PRINCIPLES.map((principle) => (
          <CardShell key={principle.title}>
            <View className="flex-row items-start gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-confiance/15">
                <Ionicons name={principle.icon} size={17} color="#38BDF8" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-base font-bold text-foreground">{principle.title}</Text>
                <Text className="text-sm leading-5 text-muted">{principle.body}</Text>
              </View>
            </View>
          </CardShell>
        ))}
      </View>

      <CardShell className="border-chimie/30 bg-chimie/5">
        <SectionTitle>Limite d’Echo</SectionTitle>
        <Text className="mt-2 text-sm leading-6 text-muted">
          Echo est un jeu, pas un accompagnement thérapeutique. Si une question fait remonter quelque chose de
          douloureux, arrêtez la session — l’app ne vous le reprochera jamais. En cas de détresse persistante, un·e
          professionnel·le de santé sera toujours plus utile qu’une application.
        </Text>
      </CardShell>

      <Button size="lg" fullWidth onPress={() => navigation.goBack()}>
        J’ai compris
      </Button>
    </Screen>
  );
}
