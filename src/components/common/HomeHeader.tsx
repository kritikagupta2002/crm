import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Bell } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { CANONICAL_ROLE_LIST } from '../../constants/roles';
import { Avatar } from './Avatar';

interface HomeHeaderProps {
  navigation: any;
  /** Screen the search button opens. */
  searchTo?: string;
}

/* The greeting row every role's home screen starts with: who is signed in, their role, search and alerts. */
export const HomeHeader: React.FC<HomeHeaderProps> = ({ navigation, searchTo = 'WorkspacesTab' }) => {
  const insets = useSafeAreaInsets();
  const { session, canonicalRole } = useAuth();
  const { unreadCount } = useNotifications();

  const name = (session as any)?.name || (session as any)?.contactPerson || '';
  const designation = (session as any)?.designation || '';
  const role = CANONICAL_ROLE_LIST.find((r) => r.key === canonicalRole)?.title || '';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.row}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('ProfileTab')}>
          <Avatar name={name} />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.roleRow}>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
            {designation && designation !== role ? (
              <Text style={styles.designation} numberOfLines={1}>
                {designation}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate(searchTo)} style={styles.iconButton} hitSlop={8}>
          <Search size={19} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('AlertsTab')} style={styles.iconButton} hitSlop={8}>
          <Bell size={19} color={colors.textSecondary} strokeWidth={2} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMedium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  titleCol: {
    flex: 1,
    marginLeft: 2,
  },
  greeting: {
    fontSize: 12,
    color: colors.textMuted,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  rolePill: {
    backgroundColor: colors.goldBg,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.goldDark,
  },
  designation: {
    flexShrink: 1,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
});
