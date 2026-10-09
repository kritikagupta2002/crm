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
            <Compass size={22} color="#0284c7" strokeWidth={2.4} />
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
            <Bell size={20} color="#334155" />
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
            <LogOut size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 24) + 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...clientTheme.shadows.sm,
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
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748b',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
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
