import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../../theme';

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
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {displayTitle}
        </Text>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: computedColor + '15' }]}>
            {icon}
          </View>
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.valueAndArrowRow}>
            <Text
              style={[styles.value, { color: computedColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {value}
            </Text>
            {!chart ? (
              <ArrowUpRight size={15} color={computedColor} strokeWidth={2.4} style={styles.arrowIcon} />
            ) : null}
          </View>
          {displaySub ? (
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
    flex: 1,
    minWidth: 110,
    minHeight: 122,
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '700',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  valueAndArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  arrowIcon: {
    marginLeft: 6,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  chartWrap: {
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    marginTop: 6,
    backgroundColor: colors.successBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendBadgeNegative: {
    backgroundColor: colors.dangerBg,
  },
  trendText: {
    fontSize: 10,
    color: colors.successText,
    fontWeight: '800',
  },
  trendTextNegative: {
    color: colors.dangerText,
  },
});
