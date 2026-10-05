import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, radius } from '../../theme';

interface ListRowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  caption?: string;
  rightValue?: string | React.ReactNode;
  rightBadge?: React.ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  iconBg,
  title,
  subtitle,
  caption,
  rightValue,
  rightBadge,
  showChevron = false,
  showDivider = true,
  onPress,
  style,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: iconBg || colors.surfaceSubtle }]}>
          {icon}
        </View>
      ) : null}

      <View style={styles.contentCol}>
        {typeof title === 'string' ? (
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88}>
            {title}
          </Text>
        ) : (
          title
        )}

        {subtitle ? (
          typeof subtitle === 'string' ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        ) : null}

        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>

      <View style={styles.rightCol}>
        {rightBadge ? <View style={styles.badgeWrapper}>{rightBadge}</View> : null}
        {rightValue ? (
          typeof rightValue === 'string' ? (
            <Text style={styles.rightValue} numberOfLines={1} ellipsizeMode="tail">
              {rightValue}
            </Text>
          ) : (
            rightValue
          )
        ) : null}
        {showChevron ? (
          <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} style={styles.chevron} />
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  touchable: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flexShrink: 1,
    maxWidth: '48%',
    justifyContent: 'flex-end',
  },
  badgeWrapper: {
    marginLeft: spacing.xs,
  },
  rightValue: {
    fontSize: 13,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 0,
  },
});
