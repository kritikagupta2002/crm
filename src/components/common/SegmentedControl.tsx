import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  style?: ViewStyle;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onSelect,
  style,
}) => {
  const isDense = options.length >= 4;

  return (
    <View style={[styles.container, style]}>
      {options.map((opt, idx) => {
        const isSelected = selectedIndex === idx;
        return (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.75}
            onPress={() => onSelect(idx)}
            style={[
              styles.segment,
              isDense && { paddingHorizontal: 2 },
              isSelected ? styles.selectedSegment : null,
            ]}
          >
            <Text
              style={[styles.label, isSelected ? styles.selectedLabel : null]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={isDense ? 0.72 : 0.8}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minHeight: 34,
  },
  selectedSegment: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
});
