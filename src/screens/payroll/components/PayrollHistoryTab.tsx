import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { History, ChevronRight } from 'lucide-react-native';
import { Card, StatusBadge, EmptyState } from '../../../components/common';
import { colors } from '../../../theme';
import { PayrollRun } from '../../../types';
import { styles } from './payrollStyles';

interface PayrollHistoryTabProps {
  payrollRuns: PayrollRun[];
  onNavigatePayslips: () => void;
}

export const PayrollHistoryTab: React.FC<PayrollHistoryTabProps> = ({
  payrollRuns,
  onNavigatePayslips,
}) => {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>HISTORICAL AUDIT ARCHIVE</Text>

      {payrollRuns.length === 0 ? (
        <EmptyState
          icon={<History size={40} color={colors.text.tertiary} />}
          title="No payroll run yet"
          description="Completed monthly payroll executions will be archived here for financial audit and compliance."
        />
      ) : (
        payrollRuns.map((run) => (
          <Card key={run.id} style={styles.runCard}>
            <View style={styles.runHeader}>
              <View>
                <Text style={styles.runMonth}>{run.month}</Text>
                <Text style={styles.runDate}>Executed: {run.processedDate}</Text>
              </View>
              <StatusBadge status={run.status || 'Completed'} size="sm" />
            </View>

            <View style={styles.runMetaGrid}>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>STAFF PROCESSED</Text>
                <Text style={styles.runMetaVal}>{run.totalEmployees} Personnel</Text>
              </View>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>TOTAL GROSS</Text>
                <Text style={styles.runMetaVal}>₹{run.totalGross.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>TOTAL DEDUCTIONS</Text>
                <Text style={[styles.runMetaVal, { color: colors.semantic.danger }]}>
                  -₹{run.totalDeductions.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>NET DISBURSED</Text>
                <Text style={[styles.runMetaVal, { color: colors.semantic.success }]}>
                  ₹{run.totalNetDisbursed.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.runFooter}>
              <Text style={styles.runAuthor}>Authorized By: {run.processedBy}</Text>
              <TouchableOpacity
                style={styles.runViewSlipsBtn}
                onPress={onNavigatePayslips}
              >
                <Text style={styles.runViewSlipsText}>View Payslips</Text>
                <ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </View>
  );
};
