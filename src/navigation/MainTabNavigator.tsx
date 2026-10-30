import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen, WorkspacesScreen, NotificationsScreen, ProfileScreen, TasksScreen } from '../screens/main';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Home, LayoutGrid, Bell, User, CheckSquare } from 'lucide-react-native';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

/* As on the web sidebar: the active item is teal with a gold edge. */
const TabIcon: React.FC<{ Icon: typeof Home; focused: boolean; badge?: number }> = ({ Icon, focused, badge = 0 }) => (
  <View style={styles.iconBox}>
    {focused && <View style={styles.activeEdge} />}
    <Icon size={22} color={focused ? colors.primary : colors.textMuted} strokeWidth={focused ? 2.3 : 1.8} />
    {badge > 0 ? (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
      </View>
    ) : null}
  </View>
);

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);
  const { unreadCount } = useNotifications();
  const { canonicalRole } = useAuth();
  const isEmployee = canonicalRole === 'employee';

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderMedium,
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingTop: 0,
          paddingBottom: bottomInset > 0 ? bottomInset : 6,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }}
      />
      {/* For employee, show My Tasks as the primary action tab. For others, show Workspaces */}
      {isEmployee ? (
        <Tab.Screen
          name="TasksTab"
          component={TasksScreen}
          options={{ tabBarLabel: 'My Tasks', tabBarIcon: ({ focused }) => <TabIcon Icon={CheckSquare} focused={focused} /> }}
        />
      ) : (
        <Tab.Screen
          name="WorkspacesTab"
          component={WorkspacesScreen}
          options={{ tabBarLabel: 'Workspaces', tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutGrid} focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="AlertsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Bell} focused={focused} badge={unreadCount} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} /> }}
      />
      {/* Hidden tabs kept in navigator stack for navigation consistency */}
      {isEmployee && (
        <Tab.Screen name="WorkspacesTab" component={WorkspacesScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
      )}
      {!isEmployee && (
        <Tab.Screen name="TasksTab" component={TasksScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    width: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEdge: {
    position: 'absolute',
    top: -5,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.gold,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
});
