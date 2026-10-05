import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography, spacing } from '../../theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'small' | 'medium' | 'large';
  variant?: 'solid' | 'outline' | 'subtle';
  style?: ViewStyle;
  customLabel?: string;
}

const StatusBadgeInner: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'subtle',
  style,
  customLabel,
}) => {
  const normalizedSize =
    size === 'small' ? 'sm' : size === 'large' ? 'md' : size === 'medium' ? 'md' : size;

  const getColors = () => {
    const s = (customLabel || status).toLowerCase();
    if (
      s.includes('approved') ||
      s.includes('verified') ||
      s.includes('compliant') ||
      s.includes('won') ||
      s.includes('present') ||
      s.includes('settled') ||
      s.includes('completed') ||
      s.includes('paid') ||
      s.includes('active') ||
      s.includes('done') ||
      s.includes('passed')
    ) {
      return {
        bg: colors.successBg,
        text: colors.successText,
        border: colors.successLight,
        dot: colors.success,
      };
    }
    if (
      s.includes('pending') ||
      s.includes('queried') ||
      s.includes('partial') ||
      s.includes('review') ||
      s.includes('progress') ||
      s.includes('sealed') ||
      s.includes('billed') ||
      s.includes('half') ||
      s.includes('hold') ||
      s.includes('draft')
    ) {
      return {
        bg: colors.warningBg,
        text: colors.warningText,
        border: colors.warningLight,
        dot: colors.warning,
      };
    }
    if (
      s.includes('rejected') ||
      s.includes('lost') ||
      s.includes('absent') ||
      s.includes('suspended') ||
      s.includes('overdue') ||
      s.includes('expired') ||
      s.includes('cancel') ||
      s.includes('failed')
    ) {
      return {
        bg: colors.dangerBg,
        text: colors.dangerText,
        border: colors.dangerLight,
        dot: colors.danger,
      };
    }
    return {
      bg: colors.infoBg,
      text: colors.infoText,
      border: colors.infoLight,
      dot: colors.info,
    };
  };

  const c = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        normalizedSize === 'sm' && styles.badgeSm,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: c.dot }, normalizedSize === 'sm' && styles.dotSm]} />
      <Text
        style={[
          styles.text,
          { color: c.text },
          normalizedSize === 'sm' && styles.textSm,
        ]}
      >
        {customLabel || status}
      </Text>
    </View>
  );
};

export const StatusBadge = React.memo(StatusBadgeInner);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
  },
  dot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
    marginRight: 4.5,
  },
  dotSm: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginRight: 3.5,
  },
  text: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
    letterSpacing: -0.1,
  },
  textSm: {
    fontSize: 9.5,
    fontWeight: typography.fontWeights.bold,
  },
});
