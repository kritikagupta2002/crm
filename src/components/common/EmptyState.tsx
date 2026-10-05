import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PackageOpen } from 'lucide-react-native';
import { colors, spacing, typography, radius } from '../../theme';
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
      <View style={styles.iconCircle}>
        {icon ? icon : <PackageOpen size={28} color={colors.textMuted} />}
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: 15,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
    maxWidth: 260,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
});
