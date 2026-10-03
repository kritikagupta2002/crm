import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

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
  return (
    <View style={[styles.container, style]}>
      {options.map((opt, idx) => {
        const isSelected = selectedIndex === idx;
        return (
          <TouchableOpacity
            key={opt}
            activeOpacity={0.8}
            onPress={() => onSelect(idx)}
            style={[styles.segment, isSelected ? styles.selectedSegment : null]}
          >
            <Text style={[styles.label, isSelected ? styles.selectedLabel : null]}>
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  selectedSegment: {
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  selectedLabel: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});
