import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';
import { vendorTheme } from './vendorTheme';

export type PortalTab = 'home' | 'tenders' | 'work' | 'profile' | 'bids' | 'workOrders' | 'payments';

interface VendorPortalHeaderProps {
  vendorName: string;
  vendorCode: string;
  category?: string;
  empanelledStatus?: string;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const VendorPortalHeader: React.FC<VendorPortalHeaderProps> = ({
  vendorName,
  vendorCode,
  category = 'Drilling Contractor',
  empanelledStatus = 'Empanelled Grade-A',
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 26);

  return (
    <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
      {/* Top Branding & Actions Bar */}
      <View style={styles.topRow}>
        {/* Left: Bansal Geo Corporate Branding */}
        <View style={styles.leftBrandCol}>
          <View style={styles.brandBadgeRow}>
            <View style={styles.brandIconBox}>
              <Building2 size={20} color="#0284c7" strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.brandSuperText}>BANSAL GEO</Text>
              <Text style={styles.portalSubtitle}>Vendor Operations Portal</Text>
            </View>
          </View>
        </View>

        {/* Right: Big Notification Bell & Logout Touch Targets */}
        <View style={styles.rightActionsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onOpenNotifications}
            style={styles.iconButton}
            accessibilityLabel="Vendor Notifications"
          >
            <Bell size={21} color={vendorTheme.colors.navy} strokeWidth={2.4} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onLogout}
            style={[styles.iconButton, styles.logoutBtn]}
            accessibilityLabel="Sign Out of Vendor Portal"
          >
            <LogOut size={19} color={vendorTheme.colors.crimson} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Prominent Contractor Identity Banner */}
      <View style={styles.identityBar}>
        <View style={styles.vendorInfoWrap}>
          <Text style={styles.vendorNameText} numberOfLines={1}>
            {vendorName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>ID: {vendorCode}</Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.categoryText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        </View>

        <View style={styles.statusBadgeWrap}>
          <ShieldCheck size={15} color={vendorTheme.colors.tealDark} strokeWidth={2.5} />
          <Text style={styles.statusBadgeText}>{empanelledStatus}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: vendorTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: vendorTheme.colors.sandstoneBorder,
    paddingHorizontal: 16,
    paddingBottom: 14,
    ...vendorTheme.shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftBrandCol: {
    flex: 1,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSuperText: {
    fontSize: 14,
    fontWeight: '900',
    color: vendorTheme.colors.navy,
    letterSpacing: 0.8,
  },
  portalSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: vendorTheme.colors.textMuted,
    marginTop: 1,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: vendorTheme.colors.sandstoneDark,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  notificationDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: vendorTheme.colors.crimson,
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: vendorTheme.colors.surface,
  },
  notificationDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: vendorTheme.colors.sandstone,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
  },
  vendorInfoWrap: {
    flex: 1,
  },
  vendorNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  codePill: {
    backgroundColor: vendorTheme.colors.surface,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  codeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  dotSeparator: {
    fontSize: 12,
    color: vendorTheme.colors.textTertiary,
  },
  categoryText: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  statusBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.tealSubtle,
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: vendorTheme.colors.tealDark,
  },
});
