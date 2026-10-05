import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  required,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          props.editable === false ? styles.inputDisabled : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, style]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {helperText && !error ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 5,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border.default,
    borderRadius: radius.md + 2,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  inputFocused: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.textPrimary,
    paddingVertical: spacing.xs + 3,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.danger,
    marginTop: 3,
    fontWeight: typography.fontWeights.medium,
  },
  helperText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: 3,
  },
});
