// /mobile/components/NotificationBell.tsx
// Header bell with live unread badge. Drop into any screen header's `right` slot.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, hitSlop, radius } from '../theme/theme';
import { useNotifications } from '../context/NotificationsContext';

export default function NotificationBell(): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { unreadCount } = useNotifications();
  const label = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={hitSlop}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={22} color={colors.navy} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40, height: 40, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800', lineHeight: 12 },
});
