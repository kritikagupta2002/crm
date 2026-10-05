import React from 'react';
import { View, Text } from 'react-native';
import { Card, StatusBadge } from '../../../../components';
import { styles } from './employeeDetailStyles';

interface EmployeeLeaveTabProps {
  empLeaveBalances: any[];
  empLeaves: any[];
}

export const EmployeeLeaveTab: React.FC<EmployeeLeaveTabProps> = ({
  empLeaveBalances,
  empLeaves,
}) => {
  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Leave Quotas & Balances</Text>
        <View style={styles.balanceGrid}>
          {empLeaveBalances.length === 0 ? (
            <Text style={styles.emptyNote}>Leave balances initialized automatically upon creation.</Text>
          ) : (
            empLeaveBalances.map(b => (
              <View key={b.leaveType} style={styles.balanceItem}>
                <Text style={styles.balanceType}>{b.leaveType}</Text>
                <Text style={styles.balanceAvailable}>{b.available}</Text>
                <Text style={styles.balanceSub}>Used: {b.used} / {b.allocated}</Text>
              </View>
            ))
          )}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Recent Leave Applications</Text>
        {empLeaves.length === 0 ? (
          <Text style={styles.emptyNote}>No leave requests recorded.</Text>
        ) : (
          empLeaves.slice(0, 5).map(l => (
            <View key={l.id} style={styles.leaveReqRow}>
              <View>
                <Text style={styles.leaveReqType}>{l.leaveType} ({l.daysCount || 1} Days)</Text>
                <Text style={styles.leaveReqDates}>
                  {l.startDate} to {l.endDate}
                </Text>
                <Text style={styles.leaveReqReason}>{l.reason}</Text>
              </View>
              <StatusBadge status={l.status} size="small" />
            </View>
          ))
        )}
      </Card>
    </View>
  );
};
