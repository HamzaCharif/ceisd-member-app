// /mobile/components/EmptyState.tsx
// Friendly empty + loading states so screens never show a blank void.
//
// Usage:
//   <EmptyState icon="calendar-outline" title="No events yet" message="Check back soon for upcoming CEISD events." />
//   <EmptyState title="Nothing here" action={<Button title="Refresh" size="sm" fullWidth={false} onPress={reload} />} />

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type, radius } from '../theme/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}

export default function EmptyState({ title, message, icon = 'sparkles-outline', action }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...type.h3, color: colors.textPrimary, textAlign: 'center' },
  message: { ...type.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 },
  action: { marginTop: spacing.lg },
});
