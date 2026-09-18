// /mobile/components/Button.tsx
// Reusable button. Replaces every ad-hoc TouchableOpacity styled as a button.
//
// Usage:
//   <Button title="Sign in via SSO" onPress={handle} />
//   <Button title="Add to Calendar" variant="outline" />
//   <Button title="RSVP" size="sm" />
//   <Button title="Submitting" loading disabled />

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing, type, elevation, motion } from '../theme/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<Size, { paddingV: number; paddingH: number; fontSize: number; minHeight: number }> = {
  sm: { paddingV: spacing.sm, paddingH: spacing.lg, fontSize: 14, minHeight: 38 },
  md: { paddingV: spacing.md + 2, paddingH: spacing.xl, fontSize: 15, minHeight: 50 },
  lg: { paddingV: spacing.lg, paddingH: spacing.xl, fontSize: 16, minHeight: 56 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;
  const sz = SIZES[size];

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      paddingVertical: sz.paddingV,
      paddingHorizontal: sz.paddingH,
      minHeight: sz.minHeight,
    },
    VARIANT_CONTAINER[variant],
    fullWidth ? styles.fullWidth : styles.autoWidth,
    variant === 'primary' || variant === 'secondary' || variant === 'danger' ? elevation('sm') : {},
    isDisabled ? styles.disabled : {},
  ];

  const labelStyle: TextStyle[] = [styles.label, { fontSize: sz.fontSize }, VARIANT_LABEL[variant]];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled ? { opacity: motion.pressedOpacity, transform: [{ scale: motion.pressedScale }] } : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textOnPrimary}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={labelStyle} numberOfLines={1}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const VARIANT_CONTAINER: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.navy },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
};

const VARIANT_LABEL: Record<Variant, TextStyle> = {
  primary: { color: colors.textOnPrimary },
  secondary: { color: colors.textOnDark },
  outline: { color: colors.textPrimary },
  ghost: { color: colors.primary },
  danger: { color: colors.textOnPrimary },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  autoWidth: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { ...type.label, textAlign: 'center' },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
