import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  AppHeader,
  Card,
  Button,
  StatusBadge,
  EmptyState,
  PayslipQrCode,
} from '../../components';
import { Payslip } from '../../types';
import {
  FileText,
  Share2,
  Printer,
  Eye,
  Search,
  X,
  Compass,
  Building,
  CheckCircle2,
  Calendar,
  CreditCard,
  RotateCcw,
} from 'lucide-react-native';

export const PayslipsScreen: React.FC<{ route?: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { payslips, employees } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR', 'Accountant']);
  const activeEmpId =
    session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';

  const payslipIdParam = route?.params?.payslipId;

  // Role-based visibility: regular staff can ONLY see their own payslips
  const accessiblePayslips = useMemo(() => {
    if (isHrOrAdmin) {
      return payslips;
    }
    return payslips.filter(
      (p) =>
        p.employeeId === activeEmpId ||
        (session?.accountType === 'team' &&
          (session as any).name &&
          p.employeeName?.toLowerCase() === (session as any).name.toLowerCase())
    );
  }, [payslips, isHrOrAdmin, activeEmpId, session]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Preview modal
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // If navigated with payslipIdParam, auto-open that payslip
  useEffect(() => {
    if (payslipIdParam) {
      const target = accessiblePayslips.find((p) => p.id === payslipIdParam);
      if (target) {
        setSelectedSlip(target);
        setIsPreviewOpen(true);
      }
    }
  }, [payslipIdParam, accessiblePayslips]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    accessiblePayslips.forEach((p) => {
      if (p.month) set.add(p.month);
    });
    return ['All', ...Array.from(set)];
  }, [accessiblePayslips]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    accessiblePayslips.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return ['All', ...Array.from(set)];
  }, [accessiblePayslips]);

  const filteredPayslips = useMemo(() => {
    return accessiblePayslips.filter((p) => {
      const matchSearch =
        p.payslipNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.payslipNumber && p.payslipNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (!isHrOrAdmin
          ? true
          : p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMonth =
        selectedMonthFilter === 'All' || p.month === selectedMonthFilter;

      const matchDept =
        selectedDeptFilter === 'All' ||
        (p.department && p.department.toLowerCase() === selectedDeptFilter.toLowerCase());

      const matchStatus =
        selectedStatusFilter === 'All' ||
        (p.paymentStatus || p.status || 'Paid').toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchSearch && matchMonth && matchDept && matchStatus;
    });
  }, [
    accessiblePayslips,
    searchQuery,
    selectedMonthFilter,
    selectedDeptFilter,
    selectedStatusFilter,
    isHrOrAdmin,
  ]);

  const handleOpenPreview = (slip: Payslip) => {
    setSelectedSlip(slip);
    setIsPreviewOpen(true);
  };

  const handleSharePayslip = async (slip: Payslip) => {
    const shareMessage = `BANSAL GEO SOLUTIONS PVT. LTD.
SALARY PAYSLIP - ${slip.month.toUpperCase()}
------------------------------------------
Ref: ${slip.payslipNumber || slip.payslipNo}
Staff: ${slip.employeeName} (${slip.employeeId})
Department: ${slip.department || 'Operations'}
Designation: ${slip.designation || 'Specialist'}

Paid Days: ${slip.paidDays || slip.payableDays} / ${slip.workingDays || 30}
Gross Earnings: Rs. ${slip.grossEarnings.toLocaleString('en-IN')}
Total Deductions: Rs. ${slip.totalDeductions.toLocaleString('en-IN')}
Net Salary Transferred: Rs. ${(slip.netSalary || slip.netTakeHome).toLocaleString('en-IN')}
Amount in Words: ${slip.netSalaryInWords || 'Indian Rupees Only'}
Transaction Ref: ${slip.transactionRef || 'NEFT-COMPLETED'}

Digitally Certified under IT Act 2000.`;

    try {
      await Share.share({
        title: `Payslip_${slip.payslipNo}`,
        message: shareMessage,
      });
    } catch {
      Alert.alert(
        'Export Payslip',
        `Official Salary Slip ${slip.payslipNo} ready for PDF export.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isHrOrAdmin ? 'Employee Payslip Vault' : 'My Payslips'}
        subtitle={
          isHrOrAdmin
            ? 'Official company salary statements with Indian statutory breakdowns'
            : 'Your monthly salary slips, earnings, and statutory tax deductions'
        }
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search & Filter Header */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isHrOrAdmin
                ? 'Search by payslip #, name, or employee ID...'
                : 'Search my payslips by month or ref #...'
            }
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {availableMonths.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.filterChip,
                selectedMonthFilter === m && styles.filterChipActive,
              ]}
              onPress={() => setSelectedMonthFilter(m)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedMonthFilter === m && styles.filterChipTextActive,
                ]}
              >
                {m === 'All' ? 'All Months' : m}
              </Text>
            </TouchableOpacity>
          ))}

          {isHrOrAdmin &&
            availableDepartments.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.filterChip,
                  selectedDeptFilter === d && styles.filterChipActive,
                ]}
                onPress={() => setSelectedDeptFilter(d)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDeptFilter === d && styles.filterChipTextActive,
                  ]}
                >
                  {d === 'All' ? 'All Departments' : d}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        <View style={styles.resultRow}>
          <Text style={styles.resultCountText}>
            Showing {filteredPayslips.length} payslip statement
            {filteredPayslips.length === 1 ? '' : 's'}
          </Text>
          {(selectedMonthFilter !== 'All' ||
            selectedDeptFilter !== 'All' ||
            searchQuery) && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSelectedMonthFilter('All');
                setSelectedDeptFilter('All');
                setSelectedStatusFilter('All');
                setSearchQuery('');
              }}
            >
              <RotateCcw size={12} color={colors.semantic.danger} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredPayslips.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} color={colors.text.tertiary} />}
            title="No payslips available"
            description={
              isHrOrAdmin
                ? 'No finalized payslips match your current search or filter criteria.'
                : 'No salary slips have been disbursed to your account yet.'
            }
          />
        ) : (
          filteredPayslips.map((slip) => (
            <Card
              key={slip.id}
              style={styles.slipCard}
              onPress={() => handleOpenPreview(slip)}
            >
              <View style={styles.slipHeader}>
                <View style={styles.slipRefWrap}>
                  <Text style={styles.slipRefNo}>
                    {slip.payslipNumber || slip.payslipNo}
                  </Text>
                  <View style={styles.slipPeriodBadge}>
                    <Text style={styles.slipPeriodText}>{slip.month}</Text>
                  </View>
                </View>
                <StatusBadge status={slip.paymentStatus || slip.status || 'Paid'} size="sm" />
              </View>

              {/* Show Employee info if HR / Admin */}
              {isHrOrAdmin ? (
                <View style={styles.empInfoBox}>
                  <Text style={styles.empName}>{slip.employeeName}</Text>
                  <Text style={styles.empMeta}>
                    {slip.employeeId} • {slip.designation || 'Staff'} • {slip.department || 'Operations'}
                  </Text>
                </View>
              ) : null}

              {/* Financial Snapshot */}
              <View style={styles.finGrid}>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>GROSS SALARY</Text>
                  <Text style={styles.finVal}>₹{slip.grossEarnings.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>DEDUCTIONS</Text>
                  <Text style={[styles.finVal, { color: colors.semantic.danger }]}>
                    -₹{slip.totalDeductions.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>NET PAY</Text>
                  <Text style={[styles.finVal, { color: colors.semantic.success }]}>
                    ₹{(slip.netSalary || slip.netTakeHome).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Text style={styles.paidDaysNotice}>
                  Paid: {slip.paidDays || slip.payableDays} / {slip.workingDays || 30} Days
                </Text>
                <View style={styles.actionBtnsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleSharePayslip(slip)}
                  >
                    <Share2 size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <Button
                    title="View Payslip"
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye size={12} color={colors.primary} />}
                    onPress={() => handleOpenPreview(slip)}
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* OFFICIAL SALARY STATEMENT PREVIEW MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={isPreviewOpen && !!selectedSlip}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPreviewOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Top Bar */}
            <View style={styles.modalTopBar}>
              <View>
                <Text style={styles.modalSheetTitle}>Official Salary Statement</Text>
                <Text style={styles.modalSheetSubtitle}>
                  {selectedSlip?.payslipNumber || selectedSlip?.payslipNo}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsPreviewOpen(false)}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedSlip && (
              <ScrollView contentContainerStyle={styles.statementScroll}>
                {/* Formal Printable Document Card */}
                <View style={styles.statementPaper}>
                  {/* Corporate Branding Header */}
                  <View style={styles.paperHeader}>
                    <View style={styles.brandingRow}>
                      <View style={styles.corpLogoBox}>
                        <Compass size={24} color="#FEC13D" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.corpCompanyName}>
                          Bansal Geo Solutions Pvt. Ltd.
                        </Text>
                        <Text style={styles.corpAddress}>
                          604, 607 & 612, Okay Plus Square, Madhyam Marg, Mansarovar, Jaipur, Rajasthan - 302020
                        </Text>
                        <Text style={styles.corpCinGst}>
                          CIN: U14290RJ2022PTC083921 • GSTIN: 08AAFCB4920M1Z8
                        </Text>
                      </View>
                    </View>

                    <View style={styles.periodBanner}>
                      <Text style={styles.periodBannerText}>
                        PAYSLIP FOR {selectedSlip.month.toUpperCase()}
                      </Text>
                      <Text style={styles.periodRefText}>
                        Ref: {selectedSlip.payslipNumber || selectedSlip.payslipNo}
                      </Text>
                    </View>
                  </View>

                  {/* Employee Demographics Grid */}
                  <View style={styles.demographicsGrid}>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>EMPLOYEE NAME</Text>
                      <Text style={styles.demoVal}>{selectedSlip.employeeName}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>EMPLOYEE ID</Text>
                      <Text style={[styles.demoVal, styles.demoId]}>
                        {selectedSlip.employeeId}
                      </Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>DESIGNATION</Text>
                      <Text style={styles.demoVal}>{selectedSlip.designation || 'Staff'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>DEPARTMENT</Text>
                      <Text style={styles.demoVal}>{selectedSlip.department || 'Operations'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>PAN NUMBER</Text>
                      <Text style={styles.demoVal}>{selectedSlip.pan || 'AAAPL1234F'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>UAN (PF)</Text>
                      <Text style={styles.demoVal}>{selectedSlip.uan || '100923847291'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>BANK NAME</Text>
                      <Text style={styles.demoVal}>{selectedSlip.bankName || 'HDFC Bank Ltd.'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>ACCOUNT NUMBER</Text>
                      <Text style={styles.demoVal}>{selectedSlip.accountNumber || '•••• •••• 8901'}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>WORKING DAYS</Text>
                      <Text style={styles.demoVal}>{selectedSlip.workingDays || 30}</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>PAID DAYS</Text>
                      <Text style={[styles.demoVal, { color: colors.semantic.success }]}>
                        {selectedSlip.paidDays || selectedSlip.payableDays}
                      </Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>LOSS OF PAY (LOP)</Text>
                      <Text style={styles.demoVal}>{selectedSlip.lopDays || 0} Days</Text>
                    </View>
                    <View style={styles.demoItem}>
                      <Text style={styles.demoLabel}>PAYMENT MODE</Text>
                      <Text style={styles.demoVal}>Direct NEFT Transfer</Text>
                    </View>
                  </View>

                  {/* Earnings vs Deductions Breakdown */}
                  <View style={styles.breakdownTable}>
                    {/* Headers */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.thText, { flex: 1 }]}>EARNINGS</Text>
                      <Text style={styles.thAmt}>AMOUNT</Text>
                      <Text style={[styles.thText, { flex: 1, paddingLeft: 8 }]}>DEDUCTIONS</Text>
                      <Text style={styles.thAmt}>AMOUNT</Text>
                    </View>

                    {/* Basic & PF */}
                    <View style={styles.tr}>
                      <Text style={styles.tdLabel}>Basic Salary</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.basic || Math.round(selectedSlip.grossEarnings * 0.4)).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>Provident Fund (PF 12%)</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.providentFund || selectedSlip.epfDeduction || 1800).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* HRA & PT */}
                    <View style={styles.tr}>
                      <Text style={styles.tdLabel}>House Rent (HRA)</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.hra || Math.round(selectedSlip.grossEarnings * 0.2)).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>Professional Tax (PT)</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.professionalTax || selectedSlip.ptDeduction || 200).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Special & ESI */}
                    <View style={styles.tr}>
                      <Text style={styles.tdLabel}>Special Allowance</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.specialAllowance || 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>ESI Contribution</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.esi || selectedSlip.esiDeduction || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Conveyance & TDS */}
                    <View style={styles.tr}>
                      <Text style={styles.tdLabel}>Conveyance Allowance</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.conveyance || 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>Tax Deducted at Source (TDS)</Text>
                      <Text style={styles.tdVal}>
                        ₹{(selectedSlip.tds || selectedSlip.tdsDeduction || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Site Allowance */}
                    {selectedSlip.siteAllowance ? (
                      <View style={styles.tr}>
                        <Text style={styles.tdLabel}>Site / Field Allowance</Text>
                        <Text style={styles.tdVal}>
                          ₹{selectedSlip.siteAllowance.toLocaleString('en-IN')}
                        </Text>
                        <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>Other Adjustments</Text>
                        <Text style={styles.tdVal}>₹{(selectedSlip.otherDeductions || 0).toLocaleString('en-IN')}</Text>
                      </View>
                    ) : null}

                    {/* Bonus */}
                    {selectedSlip.bonus ? (
                      <View style={styles.tr}>
                        <Text style={styles.tdLabel}>Performance Bonus</Text>
                        <Text style={styles.tdVal}>₹{selectedSlip.bonus.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.tdLabel, { paddingLeft: 8 }]}>-</Text>
                        <Text style={styles.tdVal}>-</Text>
                      </View>
                    ) : null}

                    {/* Totals Subrow */}
                    <View style={styles.trTotal}>
                      <Text style={styles.totalHead}>Gross Earnings</Text>
                      <Text style={styles.totalAmt}>
                        ₹{selectedSlip.grossEarnings.toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.totalHead, { paddingLeft: 8 }]}>Total Deductions</Text>
                      <Text style={[styles.totalAmt, { color: colors.semantic.danger }]}>
                        -₹{selectedSlip.totalDeductions.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Net Take Home High-Contrast Gold/Dark Banner */}
                  <View style={styles.netTakeHomeBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.netBannerTitle}>NET SALARY TRANSFERRED</Text>
                      <Text style={styles.netWordsText}>
                        Amount in words:{' '}
                        <Text style={styles.netWordsBold}>
                          {selectedSlip.netSalaryInWords || 'Indian Rupees Only'}
                        </Text>
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.netAmtDisplay}>
                        ₹{(selectedSlip.netSalary || selectedSlip.netTakeHome).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.netTxRef}>
                        Ref: {selectedSlip.transactionRef || 'NEFT-COMPLETED'}
                      </Text>
                    </View>
                  </View>

                  {/* Digital Certification Vector QR Code */}
                  <View style={styles.qrSectionWrap}>
                    <PayslipQrCode
                      value={JSON.stringify({
                        doc: 'BGSPL-PAYSLIP',
                        empId: selectedSlip.employeeId,
                        month: selectedSlip.month,
                        net: selectedSlip.netSalary || selectedSlip.netTakeHome,
                        ref: selectedSlip.transactionRef,
                        verified: true,
                      })}
                      slipId={selectedSlip.id}
                      size={68}
                    />
                  </View>

                  {/* Signoff Footer */}
                  <View style={styles.signoffFooter}>
                    <View>
                      <Text style={styles.signoffName}>Chhavi Bansal</Text>
                      <Text style={styles.signoffRole}>Director - Finance & Administration</Text>
                      <Text style={styles.signoffCorp}>Bansal Geo Solutions Pvt. Ltd.</Text>
                    </View>
                    <Text style={styles.itActNotice}>
                      This is a computer-generated salary slip and does not require an ink physical signature under the IT Act 2000.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Bottom Actions */}
            <View style={styles.modalBottomActions}>
              <Button
                title="Close"
                variant="outline"
                onPress={() => setIsPreviewOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Share / Save PDF"
                variant="primary"
                leftIcon={<Share2 size={16} color="#FFFFFF" />}
                onPress={() => selectedSlip && handleSharePayslip(selectedSlip)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.primary,
    padding: 0,
  },
  filterScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCountText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtnText: {
    ...typography.caption,
    color: colors.semantic.danger,
    fontWeight: '700',
  },
  slipCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slipRefWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slipRefNo: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  slipPeriodBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  slipPeriodText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  empInfoBox: {
    marginBottom: spacing.sm,
  },
  empName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  empMeta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  finGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  finCol: {
    alignItems: 'center',
  },
  finLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  finVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  paidDaysNotice: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconBtn: {
    padding: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    padding: spacing.lg,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  modalSheetTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  modalSheetSubtitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  statementScroll: {
    paddingBottom: spacing.lg,
  },
  statementPaper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  paperHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#1A2430',
    paddingBottom: spacing.sm,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  corpLogoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#1A2430',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpCompanyName: {
    ...typography.body,
    fontWeight: '800',
    color: '#1A2430',
    textTransform: 'uppercase',
  },
  corpAddress: {
    ...typography.caption,
    fontSize: 9,
    color: '#64748B',
    lineHeight: 12,
  },
  corpCinGst: {
    ...typography.caption,
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#64748B',
    marginTop: 2,
  },
  periodBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  periodBannerText: {
    ...typography.caption,
    fontWeight: '800',
    color: '#92400E',
    fontSize: 10,
  },
  periodRefText: {
    ...typography.caption,
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#92400E',
  },
  demographicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  demoItem: {
    width: '48%',
    marginBottom: 4,
  },
  demoLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  demoVal: {
    ...typography.caption,
    fontWeight: '600',
    color: '#0F172A',
    fontSize: 10,
  },
  demoId: {
    color: '#2563EB',
    fontWeight: '700',
  },
  breakdownTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thText: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
  },
  thAmt: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    width: 60,
    textAlign: 'right',
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tdLabel: {
    ...typography.caption,
    fontSize: 9,
    color: '#475569',
    flex: 1,
  },
  tdVal: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    color: '#0F172A',
    width: 60,
    textAlign: 'right',
  },
  trTotal: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  totalAmt: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    width: 60,
    textAlign: 'right',
  },
  netTakeHomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2430',
    borderWidth: 2,
    borderColor: '#FEC13D',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  netBannerTitle: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: '#FEC13D',
    letterSpacing: 0.5,
  },
  netWordsText: {
    ...typography.caption,
    fontSize: 9,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginTop: 2,
  },
  netWordsBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  netAmtDisplay: {
    ...typography.h3,
    color: '#FEC13D',
    fontWeight: '800',
  },
  netTxRef: {
    ...typography.caption,
    fontSize: 8,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  qrSectionWrap: {
    alignItems: 'center',
  },
  signoffFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  signoffName: {
    ...typography.caption,
    fontWeight: '700',
    color: '#0F172A',
  },
  signoffRole: {
    ...typography.caption,
    fontSize: 8,
    color: '#64748B',
  },
  signoffCorp: {
    ...typography.caption,
    fontSize: 8,
    color: '#94A3B8',
  },
  itActNotice: {
    ...typography.caption,
    fontSize: 7,
    color: '#94A3B8',
    maxWidth: 160,
    textAlign: 'right',
  },
  modalBottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
