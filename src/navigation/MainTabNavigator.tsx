import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen, WorkspacesScreen, NotificationsScreen, ProfileScreen, TasksScreen } from '../screens/main';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Home, LayoutGrid, Bell, User, CheckSquare } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);
  const { unreadCount } = useNotifications();
  const { canonicalRole } = useAuth();
  const isEmployee = canonicalRole === 'employee';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0b2545',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingTop: 5,
          paddingBottom: bottomInset > 0 ? bottomInset : 5,
          shadowColor: '#0b2545',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              {focused && <View style={styles.activeCircle} />}
              <Home
                size={21}
                color={focused ? '#0b2545' : '#64748b'}
                strokeWidth={focused ? 2.5 : 1.9}
              />
            </View>
          ),
        }}
      />
      {/* For employee, show My Tasks as the primary action tab. For others, show Workspaces */}
      {isEmployee ? (
        <Tab.Screen
          name="TasksTab"
          component={TasksScreen}
          options={{
            tabBarLabel: 'My Tasks',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconBox}>
                {focused && <View style={styles.activeCircle} />}
                <CheckSquare
                  size={21}
                  color={focused ? '#0b2545' : '#64748b'}
                  strokeWidth={focused ? 2.5 : 1.9}
                />
              </View>
            ),
          }}
        />
      ) : (
        <Tab.Screen
          name="WorkspacesTab"
          component={WorkspacesScreen}
          options={{
            tabBarLabel: 'Workspaces',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconBox}>
                {focused && <View style={styles.activeCircle} />}
                <LayoutGrid
                  size={21}
                  color={focused ? '#0b2545' : '#64748b'}
                  strokeWidth={focused ? 2.5 : 1.9}
                />
              </View>
            ),
          }}
        />
      )}
      <Tab.Screen
        name="AlertsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              {focused && <View style={styles.activeCircle} />}
              <Bell
                size={21}
                color={focused ? '#0b2545' : '#64748b'}
                strokeWidth={focused ? 2.5 : 1.9}
              />
              {unreadCount > 0 ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconBox}>
              {focused && <View style={styles.activeCircle} />}
              <User
                size={21}
                color={focused ? '#0b2545' : '#64748b'}
                strokeWidth={focused ? 2.5 : 1.9}
              />
            </View>
          ),
        }}
      />
      {/* Hidden tabs kept in navigator stack for navigation consistency */}
      {isEmployee && (
        <Tab.Screen
          name="WorkspacesTab"
          component={WorkspacesScreen}
          options={{
            tabBarItemStyle: { display: 'none' },
          }}
        />
      )}
      {!isEmployee && (
        <Tab.Screen
          name="TasksTab"
          component={TasksScreen}
          options={{
            tabBarItemStyle: { display: 'none' },
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  activeCircle: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e6f0fa',
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
