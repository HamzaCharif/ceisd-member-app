// /mobile/screens/tasks/BottomActionBar.tsx
// Sticky bottom action bar — shown on the home screen (spec Screen 0.2 bottom).
// Exported as a tab bar component for RootNavigator (Agent 1).

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  routeName: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const NAV_ITEMS: NavItem[] = [
  { routeName: 'Home',           label: 'Home',       icon: 'home-outline',              iconActive: 'home' },
  { routeName: 'MyTasks',        label: 'My Tasks',   icon: 'checkbox-outline',          iconActive: 'checkbox' },
  { routeName: 'Forms',          label: 'Forms',      icon: 'document-text-outline',     iconActive: 'document-text' },
  { routeName: 'SignAttendance', label: 'Attendance', icon: 'camera-outline',            iconActive: 'camera' },
  { routeName: 'MatchMe',        label: 'Match Me',   icon: 'people-outline',            iconActive: 'people' },
  { routeName: 'Profile',        label: 'Profile',    icon: 'person-outline',            iconActive: 'person' },
];

export default function BottomActionBar({ state, navigation }: BottomTabBarProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = state.routes[state.index]?.name === item.routeName;
        return (
          <TouchableOpacity
            key={item.routeName}
            style={styles.item}
            onPress={() => navigation.navigate(item.routeName)}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeIndicator} />}
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={24}
              color={isActive ? '#1D9E75' : '#9CA3AF'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 4,
    ...Platform.select({
      native: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      web: { boxShadow: '0px -2px 16px rgba(0,0,0,0.08)' },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 56,
    gap: 4,
  },
  activeIndicator: {
    width: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1D9E75',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 4,
  },
  labelActive: {
    fontWeight: '600',
    color: '#1D9E75',
  },
});
