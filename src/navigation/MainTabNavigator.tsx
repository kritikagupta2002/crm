import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen, TasksScreen, WorkspacesScreen, ProfileScreen } from '../screens/main';
import { colors, radius, shadows } from '../theme';
import { Home, CheckSquare, LayoutGrid, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 5,
          ...shadows.sm,
        },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Home size={20} color={focused ? colors.primaryDark : color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <CheckSquare size={20} color={focused ? colors.primaryDark : color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="WorkspacesTab"
        component={WorkspacesScreen}
        options={{
          tabBarLabel: 'Modules',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <LayoutGrid size={20} color={focused ? colors.primaryDark : color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <User size={20} color={focused ? colors.primaryDark : color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 26,
    borderRadius: radius.full,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryBg,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: -1,
  },
});
