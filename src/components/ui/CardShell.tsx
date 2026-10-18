import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { cn } from './cn';

/** Carte conteneur générique (surface sombre, bordure, coins arrondis). */
export function CardShell({
  children,
  className,
  testID,
}: PropsWithChildren<{ className?: string; testID?: string }>) {
  return (
    <View className={cn('rounded-2xl border border-border bg-card/80 p-4', className)} testID={testID}>
      {children}
    </View>
  );
}

/** Titre de section : petite capitale espacée, ton discret. */
export function SectionTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <Text className={cn('text-2xs font-bold uppercase tracking-[2px] text-muted', className)}>{children}</Text>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-1 pt-2">
      <Text className="text-3xl font-bold text-foreground">{title}</Text>
      {subtitle ? <Text className="text-sm leading-5 text-muted">{subtitle}</Text> : null}
    </View>
  );
}

/** État vide — toujours formulé comme une invitation, jamais comme un manque. */
export function EmptyState({
  title,
  hint,
  icon,
  testID,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View className="items-center gap-2 rounded-2xl border border-dashed border-border bg-white/5 px-6 py-10" testID={testID}>
      {icon}
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {hint ? <Text className="text-center text-sm leading-5 text-muted">{hint}</Text> : null}
    </View>
  );
}
