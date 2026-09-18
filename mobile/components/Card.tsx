// /mobile/components/Card.tsx
// Elevated surface. Replaces ad-hoc <View> blocks styled as cards.
// Pass onPress to make it tappable (becomes a Pressable with feedback).
//
// Usage:
//   <Card><Text>...</Text></Card>
//   <Card onPress={openEvent} padding="lg" elevation="md">...</Card>
//   <Card variant="flat">...</Card>

import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, elevation as elev, motion } from '../theme/theme';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Variant = 'elevated' | 'flat' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: Padding;
  variant?: Variant;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const PADDING: Record<Padding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

export default function Card({
  children,
  onPress,
  padding = 'md',
  variant = 'elevated',
  elevation = 'md',
  style,
}: CardProps): React.ReactElement {
  const base: ViewStyle[] = [
    styles.base,
    { padding: PADDING[padding] },
    variant === 'outlined' ? styles.outlined : {},
    variant === 'elevated' ? elev(elevation) : {},
    variant === 'flat' ? styles.flat : {},
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          ...base,
          pressed ? { opacity: motion.pressedOpacity, transform: [{ scale: 0.99 }] } : {},
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[...base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surfaceAlt,
  },
});
