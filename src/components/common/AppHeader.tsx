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
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { colors, fonts, spacing, typography, radius, shadows } from '../../theme';
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
  showBack,
  onBack,
  rightAction,
  onNotificationPress,
  badge,
  badgeIcon,
}) => {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isNarrow = screenWidth <= 360;
  const isTablet = screenWidth >= 640;
  const headerPadding = isNarrow ? spacing.sm + 4 : spacing.lg;

  const androidStatusBar = StatusBar.currentHeight ?? 24;
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? androidStatusBar : 16
  );

  const canGoBack = navigation?.canGoBack ? navigation.canGoBack() : false;
  const shouldShowBack = showBack !== undefined ? showBack : canGoBack;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(topInset + 4, 12), paddingHorizontal: headerPadding }]}>
      <StatusBar
        barStyle="dark-content"
      />
      
      <View style={[styles.contentRow, isTablet && styles.tabletContentRow]}>
        <View style={styles.leftCol}>
          {shouldShowBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={[styles.backButton, isNarrow && styles.compactIconButton]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={isNarrow ? 16 : 18} color={colors.textPrimary} strokeWidth={2.4} />
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
              style={[styles.screenTitle, isNarrow && { fontSize: 17 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </Text>

            {subtitle ? (
              <Text
                style={[styles.subtitle, isNarrow && { fontSize: 10.5 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
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
              style={[styles.bellBtn, isNarrow && styles.compactIconButton]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={isNarrow ? 16 : 18} color={colors.textPrimary} strokeWidth={2} />
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
    width: '100%',
  },
  tabletContentRow: {
    maxWidth: 720,
    alignSelf: 'center',
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
  compactIconButton: {
    width: 34,
    height: 34,
    marginRight: spacing.xs + 2,
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
    borderColor: '#b7dadb',
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
    fontFamily: fonts.serif,
    fontSize: 19,
    color: colors.textPrimary,
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
    fontWeight: '700',
  },
});
