import React from 'react';
import { View, Text } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Card, StatusBadge } from '../../../../components';
import { colors, spacing } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeExitTabProps {
  empExit: any;
}

export const EmployeeExitTab: React.FC<EmployeeExitTabProps> = ({ empExit }) => {
  if (!empExit) return null;

  return (
    <View style={styles.tabSection}>
      <Card style={styles.card}>
        <View style={styles.exitHeader}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.sectionHeading}>Exit & Full & Final Status</Text>
        </View>

        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Exit Type</Text>
            <Text style={styles.dataValue}>{empExit.exitType}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Resignation Date</Text>
            <Text style={styles.dataValue}>{empExit.resignationDate}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Last Working Day (LWD)</Text>
            <Text style={styles.dataValue}>{empExit.approvedLWD}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Clearance Status</Text>
            <Text style={[styles.dataValue, { color: colors.warning, fontWeight: '700' }]}>
              {empExit.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>Department NOC Clearances</Text>
        {empExit.clearances.map((c: any) => (
          <View key={c.id} style={styles.clearanceItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clearanceDept}>{c.department}</Text>
              <Text style={styles.clearanceReviewer}>{c.reviewerName}</Text>
              <Text style={styles.clearanceNotes}>{c.checklistNotes}</Text>
            </View>
            <StatusBadge status={c.status} size="small" />
          </View>
        ))}

        {empExit.fnf && (
          <View style={styles.fnfBox}>
            <Text style={styles.fnfTitle}>Full & Final Settlement (FnF)</Text>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Gross Payable</Text>
              <Text style={styles.salaryVal}>₹{empExit.fnf.grossPayable?.toLocaleString()}</Text>
            </View>
            <View style={styles.salaryRow}>
              <Text style={styles.salaryLabel}>Total Deductions</Text>
              <Text style={[styles.salaryVal, { color: colors.danger }]}>
                -₹{empExit.fnf.totalDeductions?.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.salaryRow, styles.netSalaryRow]}>
              <Text style={styles.netSalaryLabel}>Net Disbursed Settlement</Text>
              <Text style={styles.netSalaryVal}>₹{empExit.fnf.netPayable?.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
};
