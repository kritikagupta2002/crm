import React from 'react';
import { View, Text } from 'react-native';
import { Card, StatusBadge } from '../../../../components';
import { colors, spacing } from '../../../../theme';
import { styles } from './employeeDetailStyles';

interface EmployeeSalaryTabProps {
  emp: any;
  salaryStructure: any;
  empPayslips: any[];
}

export const EmployeeSalaryTab: React.FC<EmployeeSalaryTabProps> = ({
  emp,
  salaryStructure,
  empPayslips,
}) => {
  return (
    <View style={styles.tabSection}>
      {salaryStructure ? (
        <Card style={styles.card}>
          <Text style={styles.sectionHeading}>Monthly Compensation Structure</Text>

          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Basic Monthly Wage</Text>
            <Text style={styles.salaryVal}>₹{salaryStructure.baseSalary?.toLocaleString()}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>House Rent Allowance (HRA)</Text>
            <Text style={styles.salaryVal}>₹{salaryStructure.hra?.toLocaleString()}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Field & Special Allowance</Text>
            <Text style={styles.salaryVal}>₹{salaryStructure.specialAllowance?.toLocaleString()}</Text>
          </View>
          <View style={[styles.salaryRow, styles.totalSalaryRow]}>
            <Text style={styles.totalSalaryLabel}>Gross Monthly Emoluments</Text>
            <Text style={styles.totalSalaryVal}>
              ₹{(
                (salaryStructure.baseSalary || 0) +
                (salaryStructure.hra || 0) +
                (salaryStructure.specialAllowance || 0)
              ).toLocaleString()}
            </Text>
          </View>

          <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>Statutory Deductions</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Provident Fund (PF - 12%)</Text>
            <Text style={[styles.salaryVal, { color: colors.danger }]}>
              -₹{salaryStructure.pfDeduction?.toLocaleString() || '1,800'}
            </Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Professional Tax (PT)</Text>
            <Text style={[styles.salaryVal, { color: colors.danger }]}>
              -₹{salaryStructure.ptDeduction?.toLocaleString() || '200'}
            </Text>
          </View>
          <View style={[styles.salaryRow, styles.netSalaryRow]}>
            <Text style={styles.netSalaryLabel}>Net Take-Home Pay</Text>
            <Text style={styles.netSalaryVal}>
              ₹{salaryStructure.netSalary?.toLocaleString() || '52,000'}
            </Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.sectionHeading}>Salary Baseline</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Contract Base Salary</Text>
            <Text style={styles.salaryVal}>₹{(emp.baseSalary || 50000).toLocaleString()}</Text>
          </View>
          <Text style={styles.helperNotice}>
            Detailed salary structure will be processed when payroll cycles run.
          </Text>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.sectionHeading}>Issued Payslips</Text>
        {empPayslips.length === 0 ? (
          <Text style={styles.emptyNote}>No historical payslips generated yet.</Text>
        ) : (
          empPayslips.map(ps => (
            <View key={ps.id} style={styles.payslipRow}>
              <View>
                <Text style={styles.payslipMonth}>{ps.month} {ps.year}</Text>
                <Text style={styles.payslipNet}>Net: ₹{ps.netSalary?.toLocaleString()}</Text>
              </View>
              <StatusBadge status={ps.status || 'Paid'} size="small" />
            </View>
          ))
        )}
      </Card>
    </View>
  );
};
