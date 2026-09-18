// /mobile/components/ScreenHeader.tsx
// Consistent screen header with optional back button + right-side slot.
// Uses @expo/vector-icons (ships with Expo — no extra install).
//
// Usage:
//   <ScreenHeader title="New Post" onBack={() => navigation.goBack()} />
//   <ScreenHeader title="My Tasks" subtitle="3 pending" right={<Badge label="Filter" />} />

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type, hitSlop } from '../theme/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={hitSlop} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.navy} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { marginRight: spacing.sm },
  titleWrap: { flex: 1 },
  title: { ...type.h2, color: colors.textPrimary },
  subtitle: { ...type.bodySm, color: colors.textSecondary, marginTop: 2 },
  right: { marginLeft: spacing.md },
});
