import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  leftIcon,
  rightIcon,
}) => {
  const effectiveLeftIcon = leftIcon || icon;
  const normalizedSize =
    size === 'small' ? 'sm' : size === 'large' ? 'lg' : size === 'medium' ? 'md' : size;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'danger':
        return styles.danger;
      case 'outline':
        return styles.outline;
      case 'ghost':
        return styles.ghost;
      case 'primary':
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'danger':
        return styles.textDanger;
      case 'outline':
        return styles.textOutline;
      case 'ghost':
        return styles.textGhost;
      case 'primary':
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (normalizedSize) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <View style={styles.innerContent}>
          {effectiveLeftIcon ? <View style={styles.leftIconWrapper}>{effectiveLeftIcon}</View> : null}
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              normalizedSize === 'sm' && styles.baseTextSm,
              normalizedSize === 'lg' && styles.baseTextLg,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md + 2,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: spacing.xs + 3,
  },
  rightIconWrapper: {
    marginLeft: spacing.xs + 3,
  },
  sizeSm: {
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  sizeMd: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
  },
  sizeLg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primaryDark,
    ...shadows.xs,
  },
  secondary: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadows.xs,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  baseText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: -0.1,
  },
  baseTextSm: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  baseTextLg: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  textPrimary: {
    color: colors.textInverse,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textDanger: {
    color: colors.textInverse,
  },
  textOutline: {
    color: colors.primaryDark,
  },
  textGhost: {
    color: colors.textSecondary,
  },
});
