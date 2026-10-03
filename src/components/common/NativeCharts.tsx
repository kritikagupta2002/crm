import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface NativeBarChartProps {
  data: BarDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  formatValue?: (val: number) => string;
}

export const NativeBarChart: React.FC<NativeBarChartProps> = ({
  data,
  primaryLabel = 'Primary',
  secondaryLabel,
  primaryColor = '#2A8089',
  secondaryColor = '#C8943A',
  height = 180,
  formatValue = (v) => String(v),
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No data available for chart</Text>
      </View>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.value, d.secondaryValue || 0)),
    1
  );

  const chartHeight = height - 40;
  const barWidth = Math.max(14, Math.min(28, 260 / (data.length * (secondaryLabel ? 2.5 : 1.8))));

  return (
    <View style={styles.chartWrapper}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.legendText}>{primaryLabel}</Text>
        </View>
        {secondaryLabel && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: secondaryColor }]} />
            <Text style={styles.legendText}>{secondaryLabel}</Text>
          </View>
        )}
      </View>

      {/* SVG Canvas */}
      <Svg width="100%" height={chartHeight + 30} viewBox={`0 0 ${data.length * 55 + 20} ${chartHeight + 30}`}>
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = chartHeight * (1 - pct) + 10;
          return (
            <G key={`grid-${i}`}>
              <Line x1="10" y1={y} x2={data.length * 55 + 10} y2={y} stroke="#EDF1F3" strokeWidth="1" strokeDasharray="3,3" />
            </G>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const xCenter = 30 + index * 55;
          const h1 = (d.value / maxValue) * chartHeight;
          const y1 = chartHeight - h1 + 10;

          if (secondaryLabel && d.secondaryValue !== undefined) {
            const h2 = (d.secondaryValue / maxValue) * chartHeight;
            const y2 = chartHeight - h2 + 10;
            const bW = barWidth * 0.85;

            return (
              <G key={`bar-group-${index}`}>
                <Rect x={xCenter - bW - 2} y={y1} width={bW} height={Math.max(2, h1)} fill={primaryColor} rx={3} />
                <Rect x={xCenter + 2} y={y2} width={bW} height={Math.max(2, h2)} fill={secondaryColor} rx={3} />
                <SvgText
                  x={xCenter}
                  y={chartHeight + 24}
                  fill="#7C8B96"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </G>
            );
          }

          return (
            <G key={`bar-single-${index}`}>
              <Rect x={xCenter - barWidth / 2} y={y1} width={barWidth} height={Math.max(2, h1)} fill={primaryColor} rx={4} />
              <SvgText
                x={xCenter}
                y={chartHeight + 24}
                fill="#7C8B96"
                fontSize="10"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

interface DistributionBarRow {
  label: string;
  count: number;
  percentage: number;
  color?: string;
  note?: string;
}

interface NativeDistributionListProps {
  rows: DistributionBarRow[];
  defaultColor?: string;
}

export const NativeDistributionList: React.FC<NativeDistributionListProps> = ({
  rows,
  defaultColor = '#2A8089',
}) => {
  if (!rows || rows.length === 0) {
    return <Text style={styles.emptyText}>No distribution data</Text>;
  }

  return (
    <View style={styles.distList}>
      {rows.map((row, index) => (
        <View key={`dist-${index}`} style={styles.distRow}>
          <View style={styles.distHeader}>
            <Text style={styles.distLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <View style={styles.distValueGroup}>
              <Text style={styles.distCount}>{row.count}</Text>
              <Text style={styles.distPct}>({row.percentage}%)</Text>
            </View>
          </View>
          <View style={styles.distTrack}>
            <View
              style={[
                styles.distFill,
                { width: `${Math.min(100, Math.max(0, row.percentage))}%`, backgroundColor: row.color || defaultColor },
              ]}
            />
          </View>
          {row.note && <Text style={styles.distNote}>{row.note}</Text>}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    paddingVertical: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: borderRadius.md,
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  distList: {
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  distRow: {
    gap: 4,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
    flex: 1,
  },
  distValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distCount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  distPct: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.secondary,
  },
  distTrack: {
    height: 7,
    backgroundColor: '#EDF1F3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 4,
  },
  distNote: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.tertiary,
  },
});
