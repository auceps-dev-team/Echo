import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { EchoLine } from '../../echo-bot/echo';

/**
 * Bulle de l'agent facilitateur « Echo ».
 *
 * Signalétique de non-jugement : l'agent se présente comme un tiers neutre,
 * jamais comme un évaluateur. Le ton visuel reste doux quelle que soit la
 * réplique (y compris pour un refus de réponse).
 */
export default function EchoBubble({ line, compact = false }: { line: EchoLine | null; compact?: boolean }) {
  if (!line) return null;

  const isRefusal = line.intent === 'refus-accepte';
  const isDisclosure = Boolean(line.selfDisclosure);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Echo dit : ${line.text}`}
      className={`flex-row items-start gap-3 rounded-2xl border px-4 py-3 ${
        isRefusal ? 'border-confiance/40 bg-confiance/10' : 'border-primary/30 bg-primary/10'
      }`}
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-primary/25">
        <Ionicons name={isDisclosure ? 'chatbox-ellipses-outline' : 'sparkles-outline'} size={16} color="#F0ABFC" />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xs font-bold uppercase tracking-[2px] text-primary-soft">Echo</Text>
          {isDisclosure ? (
            <Text className="text-2xs uppercase tracking-wider text-muted">réciprocité</Text>
          ) : null}
        </View>
        {!compact && line.selfDisclosure ? (
          <Text className="text-sm italic leading-5 text-muted">{line.selfDisclosure}</Text>
        ) : null}
        <Text className="text-sm leading-6 text-foreground">{line.text}</Text>
      </View>
    </View>
  );
}
