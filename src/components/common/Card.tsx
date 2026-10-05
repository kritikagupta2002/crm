import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'flat':
        return styles.flat;
      case 'elevated':
      default:
        return styles.elevated;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.card, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  elevated: {
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  flat: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
