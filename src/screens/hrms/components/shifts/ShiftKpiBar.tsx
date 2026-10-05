import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors } from '../../../../theme';
import { styles } from './shiftsStyles';

interface ShiftKpiBarProps {
  shiftsCount: number;
  activeShiftsCount: number;
  assignedStaffCount: number;
  onMonthlyRosterPress: () => void;
}

export const ShiftKpiBar: React.FC<ShiftKpiBarProps> = ({
  shiftsCount,
  activeShiftsCount,
  assignedStaffCount,
  onMonthlyRosterPress,
}) => {
  return (
    <View style={styles.kpiContainer}>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiValue}>{shiftsCount}</Text>
        <Text style={styles.kpiLabel}>Total Shifts</Text>
      </View>
      <View style={styles.kpiCard}>
        <Text style={[styles.kpiValue, { color: colors.success }]}>
          {activeShiftsCount}
        </Text>
        <Text style={styles.kpiLabel}>Active Masters</Text>
      </View>
      <View style={styles.kpiCard}>
        <Text style={[styles.kpiValue, { color: colors.primary }]}>
          {assignedStaffCount}
        </Text>
        <Text style={styles.kpiLabel}>Staff Assigned</Text>
      </View>
      <TouchableOpacity
        style={[styles.kpiCard, styles.kpiActionCard]}
        onPress={onMonthlyRosterPress}
      >
        <Calendar size={18} color={colors.primary} />
        <Text style={styles.kpiActionLabel}>Monthly Roster</Text>
      </TouchableOpacity>
    </View>
  );
};
