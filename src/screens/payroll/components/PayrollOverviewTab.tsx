import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  BadgeIndianRupee,
  CheckCircle2,
  Clock,
  Users,
  FileSpreadsheet,
  SlidersHorizontal,
  FileText,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import { Card, StatCard, StatusBadge, EmptyState } from '../../../components/common';
import { DonutChart, MiniBarChart } from '../../../components/common/NativeCharts';
import { colors } from '../../../theme';
import { PayrollRun } from '../../../types';
import { styles } from './payrollStyles';

interface PayrollOverviewTabProps {
  totalMonthlyGross: number;
  totalNetTakeHome: number;
  totalMonthlyDeductions: number;
  activeStaffCount: number;
  isHrOrAdmin: boolean;
  payrollRuns: PayrollRun[];
  onOpenProcessTab: () => void;
  onOpenStructuresTab: () => void;
  onOpenHistoryTab: () => void;
  onNavigatePayslips: () => void;
}

export const PayrollOverviewTab: React.FC<PayrollOverviewTabProps> = ({
  totalMonthlyGross,
  totalNetTakeHome,
  totalMonthlyDeductions,
  activeStaffCount,
  isHrOrAdmin,
  payrollRuns,
  onOpenProcessTab,
  onOpenStructuresTab,
  onOpenHistoryTab,
  onNavigatePayslips,
}) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCol}>
          <StatCard
            title="TOTAL MONTHLY GROSS"
            value={
              totalMonthlyGross > 0
                ? `₹${totalMonthlyGross.toLocaleString('en-IN')}`
                : '₹0'
            }
            caption="Gross compensation"
            icon={<BadgeIndianRupee size={18} color="#0D9488" />}
            chart={<MiniBarChart values={[45, 60, 75, 90]} color="#0D9488" height={26} barWidth={5} />}
          />
        </View>
        <View style={styles.kpiCol}>
          <StatCard
            title="NET DISBURSED"
            value={
              totalNetTakeHome > 0
                ? `₹${totalNetTakeHome.toLocaleString('en-IN')}`
                : '₹0'
            }
            caption="Take-home remittance"
            icon={<CheckCircle2 size={18} color="#16A34A" />}
            chart={<DonutChart percentage={totalMonthlyGross > 0 ? Math.round((totalNetTakeHome / totalMonthlyGross) * 100) : 85} color="#10B981" size={38} strokeWidth={5} />}
          />
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCol}>
          <StatCard
            title="TOTAL DEDUCTIONS"
            value={
              totalMonthlyDeductions > 0
                ? `₹${totalMonthlyDeductions.toLocaleString('en-IN')}`
                : '₹0'
            }
            caption="PF, ESI, PT & TDS"
            icon={<Clock size={18} color="#7C3AED" />}
            chart={<MiniBarChart values={[10, 15, 12, 18]} color="#7C3AED" height={26} barWidth={5} />}
          />
        </View>
        <View style={styles.kpiCol}>
          <StatCard
            title="ON PAYROLL"
            value={String(activeStaffCount)}
            caption="Active personnel"
            icon={<Users size={18} color="#D97706" />}
            trend={{ value: 'Compliant', isPositive: true }}
          />
        </View>
      </View>

      <Text style={styles.sectionHeader}>PAYROLL WORKFLOWS</Text>
      <View style={styles.actionGrid}>
        {isHrOrAdmin && (
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onOpenProcessTab}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#EFF6FF' }]}>
              <FileSpreadsheet size={20} color="#2563EB" />
            </View>
            <Text style={styles.tileTitle}>Process Monthly Payroll</Text>
            <Text style={styles.tileSub}>
              Calculate biometric attendance, LOP deductions, and execute disbursal.
            </Text>
            <View style={styles.tileFooter}>
              <Text style={[styles.tileLink, { color: '#2563EB' }]}>Open Wizard</Text>
              <ArrowRight size={14} color="#2563EB" />
            </View>
          </TouchableOpacity>
        )}

        {isHrOrAdmin && (
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onOpenStructuresTab}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#EEF2FF' }]}>
              <SlidersHorizontal size={20} color="#4F46E5" />
            </View>
            <Text style={styles.tileTitle}>CTC & Salary Structures</Text>
            <Text style={styles.tileSub}>
              Configure Basic, HRA, site allowances, PF, ESI, and PT for staff.
            </Text>
            <View style={styles.tileFooter}>
              <Text style={[styles.tileLink, { color: '#4F46E5' }]}>Manage Structures</Text>
              <ArrowRight size={14} color="#4F46E5" />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionTile}
          onPress={onNavigatePayslips}
        >
          <View style={[styles.tileIconBox, { backgroundColor: '#ECFDF5' }]}>
            <FileText size={20} color="#059669" />
          </View>
          <Text style={styles.tileTitle}>Employee Payslip Vault</Text>
          <Text style={styles.tileSub}>
            View, export, and verify digitally certified Bansal Geo salary slips.
          </Text>
          <View style={styles.tileFooter}>
            <Text style={[styles.tileLink, { color: '#059669' }]}>View Payslips</Text>
            <ArrowRight size={14} color="#059669" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSectionHeader}>
        <Text style={styles.sectionHeader}>RECENT PAYROLL BATCHES</Text>
        {payrollRuns.length > 0 && (
          <TouchableOpacity onPress={onOpenHistoryTab}>
            <Text style={styles.seeAllText}>Full History ({payrollRuns.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {payrollRuns.length === 0 ? (
        <EmptyState
          icon={<Clock size={40} color={colors.text.tertiary} />}
          title="No payroll run yet"
          description="Execute your first monthly payroll batch to see historical compensation records here."
        />
      ) : (
        payrollRuns.slice(0, 3).map((run) => (
          <Card key={run.id} style={styles.runCard}>
            <View style={styles.runHeader}>
              <View>
                <Text style={styles.runMonth}>{run.month}</Text>
                <Text style={styles.runDate}>Processed: {run.processedDate}</Text>
              </View>
              <StatusBadge status={run.status || 'Completed'} size="sm" />
            </View>

            <View style={styles.runMetaGrid}>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>HEADCOUNT</Text>
                <Text style={styles.runMetaVal}>{run.totalEmployees} Staff</Text>
              </View>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>TOTAL GROSS</Text>
                <Text style={styles.runMetaVal}>₹{run.totalGross.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.runMetaItem}>
                <Text style={styles.runMetaLabel}>DEDUCTIONS</Text>
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
              <Text style={styles.runAuthor}>Auth: {run.processedBy}</Text>
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
