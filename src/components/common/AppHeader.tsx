import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Crown } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const heroBannerImg = require('../../../assets/hero-banner.jpg');

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onNotificationPress?: () => void;
  badge?: string;
  badgeIcon?: React.ReactNode;
  scenicBanner?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  onNotificationPress,
  badge,
  badgeIcon,
  scenicBanner = false,
}) => {
  const { session, role } = useAuth();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const androidStatusBar = StatusBar.currentHeight ?? 24;
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? androidStatusBar : 16
  );

  if (scenicBanner) {
    return (
      <View style={styles.scenicWrapper}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View
          style={[
            styles.scenicHeader,
            { paddingTop: Math.max(topInset + 8, 38) },
          ]}
        >
          <Image
            source={heroBannerImg}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.scenicOverlay} />

          <View style={styles.scenicContent}>
            <View style={styles.leftContainer}>
              {showBack ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onBack}
                  style={styles.scenicBackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ArrowLeft size={18} color="#ffffff" strokeWidth={2.4} />
                </TouchableOpacity>
              ) : null}
              <View style={styles.titleWrapper}>
                {badge ? (
                  <View style={styles.scenicBadge}>
                    {badgeIcon ? <View style={{ marginRight: 3 }}>{badgeIcon}</View> : null}
                    <Text style={styles.scenicBadgeText}>{badge.toUpperCase()}</Text>
                  </View>
                ) : null}
                <Text style={styles.scenicTitle} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.scenicSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.rightContainer}>
              {session?.accountType === 'team' ? (
                <View style={styles.scenicRolePill}>
                  <Crown size={10} color="#ffffff" strokeWidth={2.4} />
                  <Text style={styles.scenicRoleText}>{role.toUpperCase()}</Text>
                </View>
              ) : null}

              {onNotificationPress ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onNotificationPress}
                  style={styles.scenicBellButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Bell size={18} color="#ffffff" strokeWidth={2} />
                  {unreadCount > 0 ? (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ) : null}

              {rightAction}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.header, { paddingTop: Math.max(topInset + 6, 16) }]}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrapper}>
          {badge ? (
            <View style={styles.topBadge}>
              {badgeIcon ? <View style={{ marginRight: 3 }}>{badgeIcon}</View> : null}
              <Text style={styles.topBadgeText}>{badge.toUpperCase()}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {session?.accountType === 'team' ? (
          <View style={styles.rolePill}>
            <Crown size={10} color={colors.primaryDark} strokeWidth={2.4} style={{ marginRight: 3 }} />
            <Text style={styles.roleText}>{role.toUpperCase()}</Text>
          </View>
        ) : null}

        {onNotificationPress ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onNotificationPress}
            style={styles.bellButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={18} color={colors.textPrimary} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    ...shadows.xs,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 2,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  roleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#dc2626',
    borderRadius: radius.full,
    minWidth: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },

  scenicWrapper: {
    width: '100%',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  scenicHeader: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md + 2,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 112,
  },
  scenicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  scenicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenicBackButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  scenicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.92)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scenicBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  scenicTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scenicSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
    fontWeight: '500',
  },
  scenicRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  scenicRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  scenicBellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
