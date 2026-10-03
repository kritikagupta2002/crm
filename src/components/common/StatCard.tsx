import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  caption?: string;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
  tone?: 'good' | 'info' | 'attention' | 'urgent' | string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  label,
  value,
  subtitle,
  subtext,
  caption,
  icon,
  trend,
  color,
  tone,
  style,
}) => {
  const displayTitle = title || label || '';
  const displaySub = subtitle || subtext || caption;

  let computedColor = color || colors.primary;
  if (tone === 'good') computedColor = colors.success;
  else if (tone === 'attention') computedColor = colors.warning;
  else if (tone === 'urgent') computedColor = colors.danger;
  else if (tone === 'info') computedColor = colors.info;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        {icon ? <View style={[styles.iconContainer, { backgroundColor: computedColor + '15' }]}>{icon}</View> : null}
      </View>
      <Text style={[styles.value, { color: computedColor }]} numberOfLines={1}>
        {value}
      </Text>
      {displaySub ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {displaySub}
        </Text>
      ) : null}
      {trend ? (
        <View style={styles.trendContainer}>
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
    flex: 1,
    minWidth: 140,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  value: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  trendContainer: {
    marginTop: spacing.xs,
  },
  trendText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.success,
    fontWeight: typography.fontWeights.semibold,
  },
});
