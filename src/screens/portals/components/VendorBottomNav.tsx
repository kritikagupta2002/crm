import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Gavel,
  Briefcase,
  UserCheck,
} from 'lucide-react-native';
import { vendorTheme } from './vendorTheme';

export type VendorNavTab = 'home' | 'tenders' | 'work' | 'profile';

interface VendorBottomNavProps {
  activeTab: VendorNavTab;
  onTabChange: (tab: VendorNavTab) => void;
  openTendersCount?: number;
  activeWorkCount?: number;
}

export const VendorBottomNav: React.FC<VendorBottomNavProps> = ({
  activeTab,
  onTabChange,
  openTendersCount = 0,
  activeWorkCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10);

  const tabs: Array<{
    id: VendorNavTab;
    label: string;
    icon: any;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'tenders',
      label: 'Tenders',
      icon: Gavel,
      badgeCount: openTendersCount > 0 ? openTendersCount : undefined,
    },
    {
      id: 'work',
      label: 'My Work',
      icon: Briefcase,
      badgeCount: activeWorkCount > 0 ? activeWorkCount : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCheck,
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
            >
              <View style={styles.iconWrapper}>
                {isActive && <View style={styles.activeCircle} />}
                <IconComponent
                  size={23}
                  color={isActive ? vendorTheme.colors.navy : vendorTheme.colors.textMuted}
                  strokeWidth={isActive ? 2.6 : 2}
                />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: vendorTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: vendorTheme.colors.navy,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: vendorTheme.colors.textMuted,
    fontWeight: '600',
  },
  badgePill: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: vendorTheme.colors.amber,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: vendorTheme.colors.surface,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
