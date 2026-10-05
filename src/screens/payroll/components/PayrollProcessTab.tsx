import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  CheckCircle2,
  ShieldCheck,
  Users,
  BadgeIndianRupee,
  Clock,
  Play,
} from 'lucide-react-native';
import { Card, StatCard, Button } from '../../../components/common';
import { colors, spacing } from '../../../theme';
import { PayrollRun } from '../../../types';
import { styles } from './payrollStyles';

interface PayrollProcessTabProps {
  processSuccess: boolean;
  setProcessSuccess: (val: boolean) => void;
  lastProcessedRun: PayrollRun | null;
  activeStaffCount: number;
  selectedCycle: string;
  setSelectedCycle: (cycle: string) => void;
  cycleWorkingDays: number;
  previewBatchGross: number;
  previewBatchDeductions: number;
  previewBatchNet: number;
  processRosterPreview: any[];
  isHrOrAdmin: boolean;
  isProcessing: boolean;
  onExecutePayroll: () => void;
  onNavigatePayslips: () => void;
}

export const PayrollProcessTab: React.FC<PayrollProcessTabProps> = ({
  processSuccess,
  setProcessSuccess,
  lastProcessedRun,
  activeStaffCount,
  selectedCycle,
  setSelectedCycle,
  cycleWorkingDays,
  previewBatchGross,
  previewBatchDeductions,
  previewBatchNet,
  processRosterPreview,
  isHrOrAdmin,
  isProcessing,
  onExecutePayroll,
  onNavigatePayslips,
}) => {
  return (
    <View style={styles.tabContent}>
      {processSuccess ? (
        <Card style={styles.successCard}>
          <View style={styles.successIconBox}>
            <CheckCircle2 size={44} color="#059669" />
          </View>
          <Text style={styles.successTitle}>
            {lastProcessedRun?.month || 'Monthly'} Payroll Finalized
          </Text>
          <Text style={styles.successDesc}>
            All salaries, biometric attendance proration, statutory PF/ESI/PT/TDS remittances, and itemized payslips have been generated and archived in the employee vault.
          </Text>
          <View style={styles.successSummaryBox}>
            <Text style={styles.successSummaryText}>
              Personnel Processed: {lastProcessedRun?.totalEmployees || activeStaffCount}
            </Text>
            <Text style={styles.successSummaryText}>
              Total Gross: ₹{(lastProcessedRun?.totalGross || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.successSummaryText}>
              Net Transferred: ₹{(lastProcessedRun?.totalNetDisbursed || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.successActions}>
            <Button
              title="Process Another Cycle"
              variant="outline"
              onPress={() => setProcessSuccess(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="View Payslips"
              variant="primary"
              onPress={onNavigatePayslips}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Card style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 1: Select Disbursal Cycle</Text>
            <View style={styles.cycleChips}>
              {[
                { key: '2026-09', label: 'September 2026 (Current)' },
                { key: '2026-10', label: 'October 2026 (Upcoming)' },
                { key: '2026-08', label: 'August 2026 (Re-run)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.cycleChip,
                    selectedCycle === item.key && styles.cycleChipActive,
                  ]}
                  onPress={() => setSelectedCycle(item.key)}
                >
                  <Text
                    style={[
                      styles.cycleChipText,
                      selectedCycle === item.key && styles.cycleChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.syncStatusRow}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={styles.syncStatusText}>
                Biometric Attendance Synced • 2026 Statutory Tax Slabs Verified
              </Text>
            </View>
          </Card>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <StatCard
                title="ELIGIBLE HEADCOUNT"
                value={`${activeStaffCount} Staff`}
                caption={`Working days: ${cycleWorkingDays}`}
                icon={<Users size={18} color="#2563EB" />}
              />
            </View>
            <View style={styles.kpiCol}>
              <StatCard
                title="TOTAL GROSS DISBURSAL"
                value={`₹${previewBatchGross.toLocaleString('en-IN')}`}
                caption="Calculated gross"
                icon={<BadgeIndianRupee size={18} color="#059669" />}
              />
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <StatCard
                title="STATUTORY DEDUCTIONS"
                value={`-₹${previewBatchDeductions.toLocaleString('en-IN')}`}
                caption="PF, ESI, PT & TDS"
                icon={<Clock size={18} color="#E11D48" />}
              />
            </View>
            <View style={styles.kpiCol}>
              <StatCard
                title="NET BANK DISBURSAL"
                value={`₹${previewBatchNet.toLocaleString('en-IN')}`}
                caption="Net take-home total"
                icon={<CheckCircle2 size={18} color="#0D9488" />}
              />
            </View>
          </View>

          <Text style={styles.sectionHeader}>
            EMPLOYEE DISBURSAL ROSTER ({processRosterPreview.length})
          </Text>

          {processRosterPreview.map((item) => (
            <Card key={item.emp.id} style={styles.rosterCard}>
              <View style={styles.rosterHeader}>
                <View>
                  <Text style={styles.rosterEmpId}>{item.emp.employeeId}</Text>
                  <Text style={styles.rosterEmpName}>{item.emp.name}</Text>
                  <Text style={styles.rosterEmpDept}>{item.emp.employment?.department}</Text>
                </View>
                <View style={styles.rosterDaysBadge}>
                  <Text style={styles.rosterDaysLabel}>PAYABLE DAYS</Text>
                  <Text style={styles.rosterDaysVal}>
                    {item.paidDays} / {cycleWorkingDays}
                  </Text>
                  {item.lopDays > 0 ? (
                    <Text style={styles.rosterLopText}>{item.lopDays} LOP</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.rosterFinancials}>
                <View style={styles.rosterFinCol}>
                  <Text style={styles.rosterFinLabel}>MONTHLY GROSS</Text>
                  <Text style={styles.rosterFinVal}>
                    ₹{item.proratedGross.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.rosterFinCol}>
                  <Text style={styles.rosterFinLabel}>DEDUCTIONS</Text>
                  <Text style={[styles.rosterFinVal, { color: colors.semantic.danger }]}>
                    -₹{item.deductions.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.rosterFinCol}>
                  <Text style={styles.rosterFinLabel}>NET TAKE-HOME</Text>
                  <Text style={[styles.rosterFinVal, { color: colors.semantic.success }]}>
                    ₹{item.net.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          {isHrOrAdmin && (
            <Button
              title={
                isProcessing
                  ? 'Executing Monthly Disbursal...'
                  : `Execute ${selectedCycle} Payroll Disbursal`
              }
              variant="primary"
              size="lg"
              loading={isProcessing}
              leftIcon={<Play size={18} color="#FFFFFF" />}
              onPress={onExecutePayroll}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>
      )}
    </View>
  );
};
