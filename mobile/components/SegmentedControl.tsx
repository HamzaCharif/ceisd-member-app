// /mobile/components/SegmentedControl.tsx
// Polished tab switcher (Announcements | Notice Board | Chat).
// Drop-in upgrade for the hand-rolled tab bar in HomeScreen.
//
// Usage:
//   <SegmentedControl
//     options={[{ id: 'a', label: 'Announcements' }, ...]}
//     value={activeTab}
//     onChange={setActiveTab}
//   />

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type, elevation } from '../theme/theme';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active ? [styles.itemActive, elevation('sm')] : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.navyTint,
    borderRadius: radius.md,
    padding: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 2,
  },
  itemActive: {
    backgroundColor: colors.surface,
  },
  label: {
    ...type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.navy,
    fontWeight: '700',
  },
});
