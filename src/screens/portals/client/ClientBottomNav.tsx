import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Compass, Layers, ShieldCheck, Receipt, Building2 } from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { ClientTabKey } from './useClientPortal';

interface ClientBottomNavProps {
  activeTab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
  activeProjectsCount: number;
  pendingDeliverablesCount: number;
  pendingInvoicesCount: number;
}

export const ClientBottomNav: React.FC<ClientBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeProjectsCount,
  pendingDeliverablesCount,
  pendingInvoicesCount,
}) => {
  const tabs = [
    {
      key: 'home' as ClientTabKey,
      label: 'Command',
      icon: Compass,
      badge: 0,
    },
    {
      key: 'projects' as ClientTabKey,
      label: 'Projects',
      icon: Layers,
      badge: activeProjectsCount,
    },
    {
      key: 'deliverables' as ClientTabKey,
      label: 'Sign-Off',
      icon: ShieldCheck,
      badge: pendingDeliverablesCount,
    },
    {
      key: 'invoices' as ClientTabKey,
      label: 'Invoices',
      icon: Receipt,
      badge: pendingInvoicesCount,
    },
    {
      key: 'profile' as ClientTabKey,
      label: 'Profile',
      icon: Building2,
      badge: 0,
    },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {isActive && <View style={styles.activeCircle} />}
                <IconComponent
                  size={22}
                  color={isActive ? '#ffffff' : clientTheme.colors.textMuted}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.badge > 0 && (
                  <View style={[styles.badgePill, isActive && styles.badgePillActive]}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
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
  navContainer: {
    backgroundColor: clientTheme.colors.surface,
    borderTopWidth: 1.2,
    borderTopColor: clientTheme.colors.sandstoneBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    ...clientTheme.shadows.md,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  activeCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: clientTheme.colors.navy,
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: clientTheme.colors.textMuted,
  },
  tabLabelActive: {
    color: clientTheme.colors.navy,
    fontWeight: '800',
  },
  badgePill: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: clientTheme.colors.gold,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: clientTheme.colors.surface,
  },
  badgePillActive: {
    backgroundColor: clientTheme.colors.teal,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
});
