import type { ComponentProps, PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { cn } from './cn';

/**
 * Bouton Echo — design system maison.
 *
 * Le nommage des variantes reprend volontairement le vocabulaire gluestack
 * (`action`, `size`, `variant`) pour qu'une migration ultérieure vers des
 * composants gluestack générés reste mécanique.
 *
 * La variante `soft` existe spécifiquement pour l'action « Passer » : un refus
 * doit être aussi visible et aussi facile qu'une réponse, sans paraître punitif.
 */
export type ButtonProps = PropsWithChildren<
  Omit<ComponentProps<typeof Pressable>, 'style'> & {
    action?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'outline' | 'soft';
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    labelClassName?: string;
    icon?: React.ReactNode;
  }
>;

const ACTION_CLASSES = {
  primary: 'bg-primary',
  secondary: 'bg-card',
  danger: 'bg-chimie',
  ghost: 'bg-transparent',
} as const;

const VARIANT_CLASSES = {
  solid: '',
  outline: 'border border-border bg-transparent',
  soft: 'bg-white/10',
} as const;

const SIZE_CLASSES = {
  sm: 'min-h-9 px-3 py-2',
  md: 'min-h-12 px-5 py-3',
  lg: 'min-h-14 px-6 py-4',
} as const;

const LABEL_SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

export default function Button({
  action = 'primary',
  size = 'md',
  variant = 'solid',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  labelClassName,
  icon,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-xl',
        'active:opacity-80',
        ACTION_CLASSES[action],
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : 'opacity-100',
        className,
      )}
      {...rest}
    >
      {loading ? <ActivityIndicator size="small" color="#F5F1FB" /> : icon}
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'text-center font-semibold text-foreground',
            LABEL_SIZE_CLASSES[size],
            labelClassName,
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** Petit conteneur de métadonnée (points, compteur, tag). */
export function Chip({
  label,
  value,
  colorClass = 'text-muted',
  testID,
}: {
  label: string;
  value?: string | number;
  colorClass?: string;
  testID?: string;
}) {
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-border bg-white/5 px-3 py-1" testID={testID}>
      <Text className="text-2xs uppercase tracking-widest text-muted">{label}</Text>
      {value !== undefined ? <Text className={cn('text-xs font-bold', colorClass)}>{value}</Text> : null}
    </View>
  );
}
