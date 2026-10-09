import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Compass, Bell, LogOut } from 'lucide-react-native';
import { clientTheme } from './clientTheme';

interface ClientPortalHeaderProps {
  clientCompanyName: string;
  clientEnquiryId: string;
  clientContactPerson: string;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const ClientPortalHeader: React.FC<ClientPortalHeaderProps> = ({
  clientCompanyName,
  clientEnquiryId,
  unreadCount,
  onOpenNotifications,
  onLogout,
}) => {
  return (
    <View style={styles.headerWrapper}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Compass size={22} color="#ffffff" strokeWidth={2.4} />
          </View>
          <View style={styles.brandTitleWrap}>
            <Text style={styles.brandTitle}>BANSAL GEO</Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              {clientCompanyName} • #{clientEnquiryId}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={20} color="#ffffff" />
            {unreadCount > 0 && (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Secure Logout Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.logoutBtn]}
            onPress={onLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LogOut size={18} color="#fee2e2" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: clientTheme.colors.navyDark,
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 24) + 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: clientTheme.radius.lg,
    borderBottomRightRadius: clientTheme.radius.lg,
    ...clientTheme.shadows.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  brandIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1b3a60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoutBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  badgePill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: clientTheme.colors.crimson,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
  },
});
