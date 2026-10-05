import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Card, StatusBadge, EmptyState } from '../../../../components';
import { colors } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeAttendanceTabProps {
  empAttendance: any[];
}

export const EmployeeAttendanceTab: React.FC<EmployeeAttendanceTabProps> = ({
  empAttendance,
}) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Recent Attendance Punches</Text>
        {empAttendance.length === 0 ? (
          <EmptyState
            title="No Attendance Logs"
            message="No attendance punch records found for this employee."
            icon={<Clock size={36} color={colors.text.tertiary} />}
          />
        ) : (
          empAttendance.slice(0, 10).map((att, i) => (
            <View key={att.id || i} style={styles.logRow}>
              <View style={styles.logDateBlock}>
                <Text style={styles.logDate}>{att.date}</Text>
                <Text style={styles.logLocation}>{att.location || 'Jaipur HQ'}</Text>
              </View>
              <View style={styles.logTimes}>
                <Text style={styles.logTimeText}>In: {att.punchIn || '--:--'}</Text>
                <Text style={styles.logTimeText}>Out: {att.punchOut || '--:--'}</Text>
              </View>
              <StatusBadge status={att.status} size="small" />
            </View>
          ))
        )}
      </Card>
    </View>
  );
};
