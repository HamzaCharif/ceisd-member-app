// /mobile/navigation/RootNavigator.tsx
// Root navigation setup for CEISD Member App.

import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { registerUnauthorizedHandler } from '../../shared/api-client';
import { COLORS } from '../../shared/constants';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupForm from '../screens/auth/SignupForm';

// Tab screens
import HomeScreen from '../screens/home/HomeScreen';
import MyTasksScreen from '../screens/tasks/MyTasksScreen';
import FormsScreen from '../screens/forms/FormsScreen';
import SignAttendanceScreen from '../screens/attendance/SignAttendanceScreen';
import MatchMeScreen from '../screens/matchme/MatchMeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Push screens (navigated to from tab screens)
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import FormSubmissionScreen from '../screens/forms/FormSubmissionScreen';
import AttendanceSuccessScreen from '../screens/attendance/AttendanceSuccessScreen';
import PointsHistory from '../screens/gamification/PointsHistory';
import MentorBookingScreen from '../screens/matchme/MentorBookingScreen';
import NewPostScreen from '../screens/noticeboard/NewPostScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Bottom action bar
import BottomActionBar from '../screens/tasks/BottomActionBar';

// ─────────────────────────────────────────────
// PARAM LISTS
// ─────────────────────────────────────────────

export type MainStackParamList = {
  Tabs: undefined;
  TaskDetail: { taskId: string };
  FormSubmission: { formId: string };
  AttendanceSuccess: { eventTitle: string; pointsEarned: number };
  PointsHistory: undefined;
  MentorBooking: undefined;
  NewPost: undefined;
  EventDetail: { eventId: string };
  Notifications: undefined;
};

// ─────────────────────────────────────────────
// NAVIGATOR INSTANCES
// ─────────────────────────────────────────────

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const TabNav = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// ─────────────────────────────────────────────
// AUTH NAVIGATOR
// ─────────────────────────────────────────────

function AuthNavigator(): React.ReactElement {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignupForm" component={SignupForm} />
    </AuthStack.Navigator>
  );
}

// ─────────────────────────────────────────────
// TAB NAVIGATOR (bottom bar only)
// ─────────────────────────────────────────────

function TabNavigator(): React.ReactElement {
  return (
    <TabNav.Navigator
      tabBar={(props) => <BottomActionBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <TabNav.Screen
        name="Home"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Home'); },
        })}
      />
      <TabNav.Screen
        name="MyTasks"
        component={MyTasksScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('MyTasks'); },
        })}
      />
      <TabNav.Screen
        name="Forms"
        component={FormsScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Forms'); },
        })}
      />
      <TabNav.Screen
        name="SignAttendance"
        component={SignAttendanceScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('SignAttendance'); },
        })}
      />
      <TabNav.Screen
        name="MatchMe"
        component={MatchMeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('MatchMe'); },
        })}
      />
      <TabNav.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('Profile'); },
        })}
      />
    </TabNav.Navigator>
  );
}

// ─────────────────────────────────────────────
// MAIN NAVIGATOR (tabs + all push/modal screens)
// ─────────────────────────────────────────────

function MainNavigator(): React.ReactElement {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={TabNavigator} />
      <MainStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <MainStack.Screen name="FormSubmission" component={FormSubmissionScreen} />
      <MainStack.Screen name="AttendanceSuccess" component={AttendanceSuccessScreen} />
      <MainStack.Screen name="PointsHistory" component={PointsHistory} />
      <MainStack.Screen name="MentorBooking" component={MentorBookingScreen} />
      <MainStack.Screen name="NewPost" component={NewPostScreen} />
      <MainStack.Screen name="EventDetail" component={EventDetailScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
    </MainStack.Navigator>
  );
}

// ─────────────────────────────────────────────
// ROOT NAVIGATOR
// ─────────────────────────────────────────────

export default function RootNavigator(): React.ReactElement {
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  useEffect(() => {
    registerUnauthorizedHandler(() => setIsAuthenticated(false));
  }, [setIsAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
