import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

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
}) => {
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isNarrow = screenWidth < 360;
  const headerPadding = isNarrow ? spacing.md : spacing.lg;

  const androidStatusBar = StatusBar.currentHeight ?? 24;
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? androidStatusBar : 16
  );

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(topInset + 6, 14), paddingHorizontal: headerPadding }]}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      
      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          {showBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.titlesCol}>
            {badge ? (
              <View style={styles.badgePill}>
                {badgeIcon ? <View style={styles.badgeIconWrapper}>{badgeIcon}</View> : null}
                <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
              </View>
            ) : null}

            <Text
              style={[styles.screenTitle, isNarrow && { fontSize: 16 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {title}
            </Text>

            {subtitle ? (
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightActionsRow}>
          {rightAction}

          {onNotificationPress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNotificationPress}
              style={styles.bellBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={18} color={colors.textPrimary} strokeWidth={2} />
              {unreadCount > 0 ? (
                <View style={styles.bellDot}>
                  <Text style={styles.bellDotText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    ...shadows.xs,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  titlesCol: {
    flex: 1,
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 3,
  },
  badgeIconWrapper: {
    marginRight: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '400',
    lineHeight: 16,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  bellDotText: {
    color: colors.white,
    fontSize: 8.5,
    fontWeight: '800',
  },
});
