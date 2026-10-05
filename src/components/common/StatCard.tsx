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
  trend?: string | { value: string; isPositive?: boolean };
  color?: string;
  tone?: 'good' | 'info' | 'attention' | 'urgent' | string;
  chart?: React.ReactNode;
  style?: ViewStyle;
}

const StatCardInner: React.FC<StatCardProps> = ({
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
  chart,
  style,
}) => {
  const displayTitle = title || label || '';
  const displaySub = subtitle || subtext || caption;

  let computedColor = color || colors.primaryDark;
  if (tone === 'good') computedColor = colors.success;
  else if (tone === 'attention') computedColor = colors.warning;
  else if (tone === 'urgent') computedColor = colors.danger;
  else if (tone === 'info') computedColor = colors.info;

  const trendText = typeof trend === 'string' ? trend : trend?.value;
  const isPositive = typeof trend === 'object' ? trend?.isPositive ?? true : true;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: computedColor + '12' }]}>
            {icon}
          </View>
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.value, { color: computedColor }]} numberOfLines={1}>
            {value}
          </Text>
          {displaySub ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {displaySub}
            </Text>
          ) : null}
        </View>
        {chart ? <View style={styles.chartWrap}>{chart}</View> : null}
      </View>

      {trendText ? (
        <View style={[styles.trendBadge, !isPositive && styles.trendBadgeNegative]}>
          <Text style={[styles.trendText, !isPositive && styles.trendTextNegative]}>{trendText}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const StatCard = React.memo(StatCardInner);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
    flex: 1,
    minWidth: 125,
    marginBottom: spacing.xs + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.semibold,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  value: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    marginBottom: 2,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: typography.fontSizes.xxs + 1,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.medium,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  chartWrap: {
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.successBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
  },
  trendBadgeNegative: {
    backgroundColor: colors.dangerBg,
  },
  trendText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.successText,
    fontWeight: typography.fontWeights.bold,
  },
  trendTextNegative: {
    color: colors.dangerText,
  },
});
