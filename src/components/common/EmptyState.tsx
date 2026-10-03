import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PackageOpen } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  message,
  icon,
  actionTitle,
  actionLabel,
  onAction,
}) => {
  const displayDesc = description || message || '';
  const displayActionTitle = actionTitle || actionLabel;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        {icon ? icon : <PackageOpen size={48} color={colors.textMuted} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {displayDesc ? <Text style={styles.description}>{displayDesc}</Text> : null}
      {displayActionTitle && onAction ? (
        <Button
          title={displayActionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconWrapper: {
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
});
