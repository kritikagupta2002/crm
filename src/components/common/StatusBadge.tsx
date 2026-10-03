import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography, spacing } from '../../theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', style, customLabel }) => {
  const normalizedSize = size === 'small' ? 'sm' : size === 'large' ? 'md' : size === 'medium' ? 'md' : size;
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
      s.includes('active')
    ) {
      return { bg: colors.successBg, text: colors.successText, border: colors.successLight };
    }
    if (
      s.includes('pending') ||
      s.includes('queried') ||
      s.includes('partial') ||
      s.includes('review') ||
      s.includes('progress') ||
      s.includes('sealed') ||
      s.includes('billed') ||
      s.includes('half')
    ) {
      return { bg: colors.warningBg, text: colors.warningText, border: colors.warningLight };
    }
    if (
      s.includes('rejected') ||
      s.includes('lost') ||
      s.includes('absent') ||
      s.includes('suspended') ||
      s.includes('overdue') ||
      s.includes('expired') ||
      s.includes('cancel')
    ) {
      return { bg: colors.dangerBg, text: colors.dangerText, border: colors.dangerLight };
    }
    // Info / default
    return { bg: colors.infoBg, text: colors.infoText, border: colors.infoLight };
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

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
  },
  text: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: typography.fontSizes.xxs,
  },
});
