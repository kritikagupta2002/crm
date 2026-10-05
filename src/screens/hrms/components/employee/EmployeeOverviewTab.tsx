import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, CalendarDays, Clock, ShieldCheck, Phone } from 'lucide-react-native';
import { Card } from '../../../../components';
import { colors, spacing } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeOverviewTabProps {
  emp: any;
  tenureYears: string;
  totalAvailableLeaves: number;
  empAttendanceLength: number;
  onCall: (phone?: string) => void;
}

export const EmployeeOverviewTab: React.FC<EmployeeOverviewTabProps> = ({
  emp,
  tenureYears,
  totalAvailableLeaves,
  empAttendanceLength,
  onCall,
}) => {
  return (
    <View style={styles.tabSection}>
      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Calendar size={18} color={colors.primary} />
          <Text style={styles.kpiValue}>{tenureYears} yrs</Text>
          <Text style={styles.kpiLabel}>Tenure</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <CalendarDays size={18} color={colors.success} />
          <Text style={[styles.kpiValue, { color: colors.success }]}>
            {totalAvailableLeaves}
          </Text>
          <Text style={styles.kpiLabel}>Leave Balance</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <Clock size={18} color={colors.warning} />
          <Text style={[styles.kpiValue, { color: colors.warning }]}>
            {empAttendanceLength}
          </Text>
          <Text style={styles.kpiLabel}>Punches</Text>
        </Card>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Employment Snapshot</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Reporting Manager</Text>
            <Text style={styles.dataValue}>
              {emp.employment?.reportingManager || emp.employment?.managerName || 'Dr. Amit Kumar Bansal'}
            </Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Joining Date</Text>
            <Text style={styles.dataValue}>{emp.employment?.joiningDate || '2022-01-10'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Employment Type</Text>
            <Text style={styles.dataValue}>{emp.employment?.employmentType || 'Full-Time'}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Work Location</Text>
            <Text style={styles.dataValue}>{emp.employment?.workLocation || 'Jaipur HQ'}</Text>
          </View>
          {emp.employment?.project ? (
            <View style={[styles.dataItem, { width: '100%' }]}>
              <Text style={styles.dataLabel}>Current Project</Text>
              <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
                {emp.employment.project}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      {emp.emergency?.name ? (
        <Card style={styles.card}>
          <View style={styles.emergencyHeader}>
            <ShieldCheck size={18} color={colors.danger} />
            <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>Emergency Contact</Text>
          </View>
          <View style={styles.emergencyBody}>
            <View>
              <Text style={styles.emergencyName}>{emp.emergency.name}</Text>
              <Text style={styles.emergencyRel}>{emp.emergency.relationship}</Text>
            </View>
            {emp.emergency?.phone ? (
              <TouchableOpacity
                style={styles.emergencyCallBtn}
                onPress={() => onCall(emp.emergency?.phone)}
              >
                <Phone size={14} color="#FFFFFF" />
                <Text style={styles.emergencyCallBtnText}>{emp.emergency.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>
      ) : null}
    </View>
  );
};
