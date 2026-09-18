// /mobile/components/Badge.tsx
// Pill/tag used for categories, skill labels, task types, statuses.
// Replaces the inconsistent green pills scattered across screens.
//
// Usage:
//   <Badge label="Workshop" />
//   <Badge label="Funding" tone="info" />
//   <Badge label="Mandatory" tone="warning" size="sm" />
//   <Badge label="AI/Data" color="#7F77DD" />   // custom color (e.g. TASK_TYPE_COLORS)

import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, type } from '../theme/theme';

type Tone = 'primary' | 'neutral' | 'navy' | 'info' | 'warning' | 'error' | 'success';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  tone?: Tone;
  size?: Size;
  color?: string; // overrides tone with a custom solid color (auto soft background)
  solid?: boolean; // filled vs soft (default soft)
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<Tone, { bg: string; fg: string; solidBg: string }> = {
  primary: { bg: colors.primaryLight, fg: colors.primaryDark, solidBg: colors.primary },
  neutral: { bg: colors.divider, fg: colors.textSecondary, solidBg: colors.textSecondary },
  navy: { bg: colors.navyTint, fg: colors.navy, solidBg: colors.navy },
  info: { bg: colors.infoLight, fg: colors.info, solidBg: colors.info },
  warning: { bg: colors.warningLight, fg: colors.warning, solidBg: colors.warning },
  error: { bg: colors.errorLight, fg: colors.error, solidBg: colors.error },
  success: { bg: colors.successLight, fg: colors.success, solidBg: colors.success },
};

function hexToSoft(hex: string): string {
  // Render a custom color at ~14% as a soft background.
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}

export default function Badge({
  label,
  tone = 'primary',
  size = 'md',
  color,
  solid = false,
  style,
}: BadgeProps): React.ReactElement {
  let bg: string;
  let fg: string;

  if (color) {
    bg = solid ? color : hexToSoft(color);
    fg = solid ? colors.textOnPrimary : color;
  } else {
    const t = TONES[tone];
    bg = solid ? t.solidBg : t.bg;
    fg = solid ? colors.textOnPrimary : t.fg;
  }

  const pad =
    size === 'sm'
      ? { paddingVertical: 2, paddingHorizontal: spacing.sm }
      : { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };

  return (
    <View style={[styles.base, pad, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: fg, fontSize: size === 'sm' ? 11 : 12 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...type.caption,
    fontWeight: '600',
  },
});
