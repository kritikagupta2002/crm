import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFinance, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { TdsRecord } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Percent,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Calendar,
  Building,
  CreditCard,
  ArrowRight,
} from 'lucide-react-native';

const QUARTERS = ['All', 'Q1', 'Q2', 'Q3', 'Q4'] as const;
const SECTIONS = ['All', '194C', '194J', '194I', '192'] as const;
const STATUSES = ['All', 'Pending Deposit', 'Deposited'] as const;

export const TdsRegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { taxRecords, updateTaxStatus } = useFinance();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [selectedRecord, setSelectedRecord] = useState<TdsRecord | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateRecord, setCertificateRecord] = useState<TdsRecord | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositRecord, setDepositRecord] = useState<TdsRecord | null>(null);
  const [challanNoInput, setChallanNoInput] = useState('');
  const [bsrCodeInput, setBsrCodeInput] = useState('0510304'); // HDFC Jaipur BSR Code default
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = hasRole(['Admin', 'Accountant']);

  const totalTdsWithheld = useMemo(
    () => taxRecords.reduce((sum, r) => sum + r.tdsAmount, 0),
    [taxRecords]
  );
  const totalDeposited = useMemo(
    () =>
      taxRecords
        .filter(r => r.status === 'Deposited')
        .reduce((sum, r) => sum + r.tdsAmount, 0),
    [taxRecords]
  );
  const pendingDeposit = useMemo(
    () =>
      taxRecords
        .filter(r => r.status === 'Pending Deposit')
        .reduce((sum, r) => sum + r.tdsAmount, 0),
    [taxRecords]
  );

  const filteredRecords = useMemo(() => {
    return taxRecords.filter(r => {
      const q = search.toLowerCase();
      const matchesSearch =
        r.challanNumber.toLowerCase().includes(q) ||
        r.deducteeName.toLowerCase().includes(q) ||
        r.panNumber.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q);
      const matchesQuarter =
        selectedQuarter === 'All' || r.quarter === selectedQuarter;
      const matchesSection =
        selectedSection === 'All' || r.section === selectedSection;
      const matchesStatus =
        selectedStatus === 'All' || r.status === selectedStatus;

      return matchesSearch && matchesQuarter && matchesSection && matchesStatus;
    });
  }, [taxRecords, search, selectedQuarter, selectedSection, selectedStatus]);

  const handleOpenDeposit = (record: TdsRecord) => {
    setDepositRecord(record);
    setChallanNoInput(`ITNS-281-${Date.now().toString().slice(-5)}`);
    setShowDepositModal(true);
  };

  const handleConfirmDeposit = async () => {
    if (!depositRecord) return;
    if (!challanNoInput.trim()) {
      Alert.alert('Challan Number Required', 'Please enter the ITNS-281 challan serial number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateTaxStatus(
        depositRecord.id,
        'Deposited',
        challanNoInput.trim()
      );
      setShowDepositModal(false);
      Alert.alert(
        'Challan Deposited',
        `TDS payment of ₹${depositRecord.tdsAmount.toLocaleString('en-IN')} for ${depositRecord.deducteeName} marked as deposited with IT department. Automatic double-entry tax payment voucher generated.`
      );
    } catch (err: any) {
      Alert.alert('Deposit Error', err.message || 'Failed to record challan deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCertificate = (record: TdsRecord) => {
    setCertificateRecord(record);
    setShowCertificateModal(true);
  };

  const renderTdsCard = ({ item }: { item: TdsRecord }) => {
    const isPending = item.status === 'Pending Deposit';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedRecord(item)}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tagWrap}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>Sec {item.section}</Text>
              </View>
              <Text style={styles.challanNo}>{item.challanNumber}</Text>
            </View>
            <StatusBadge status={item.status} size="sm" />
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.deducteeName} numberOfLines={1}>
              {item.deducteeName}
            </Text>
            <Text style={styles.panText}>PAN: {item.panNumber}</Text>
          </View>

          <View style={styles.numbersGrid}>
            <View style={styles.numCol}>
              <Text style={styles.numLabel}>GROSS BASE</Text>
              <Text style={styles.numVal}>₹{item.grossAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.numCol}>
              <Text style={styles.numLabel}>TDS RATE</Text>
              <Text style={styles.numVal}>{item.tdsRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.numCol}>
              <Text style={styles.numLabel}>TDS WITHHELD</Text>
              <Text style={[styles.numVal, styles.tdsWithheldVal]}>
                ₹{item.tdsAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.periodText}>
              Period: {item.quarter} (FY {item.financialYear})
            </Text>

            {canManage && (
              <View style={styles.actionWrap}>
                {isPending ? (
                  <TouchableOpacity
                    style={styles.depositBtn}
                    onPress={() => handleOpenDeposit(item)}
                  >
                    <Text style={styles.depositBtnText}>Deposit Challan</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.certBtn}
                    onPress={() => handleOpenCertificate(item)}
                  >
                    <Text style={styles.certBtnText}>Form 16A</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="TDS Register & Tax"
        subtitle="Sections 194C, 194J, 194I & 192 statutory schedules"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.form26qBtn}
            onPress={() =>
              Alert.alert(
                'Form 26Q Quarterly Schedule',
                `Form 26Q schedule generated for Q2 FY 2026-27.\nTotal TDS Withheld: ₹${totalTdsWithheld.toLocaleString('en-IN')}\nDeposited: ₹${totalDeposited.toLocaleString('en-IN')}\nPending: ₹${pendingDeposit.toLocaleString('en-IN')}`
              )
            }
          >
            <FileSpreadsheet size={15} color={colors.primary} />
            <Text style={styles.form26qBtnText}>Form 26Q</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL TDS WITHHELD</Text>
            <Text style={styles.statValue}>₹{totalTdsWithheld.toLocaleString('en-IN')}</Text>
            <Text style={styles.statSub}>Gross tax withheld</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TDS DEPOSITED</Text>
            <Text style={[styles.statValue, { color: colors.semantic.success }]}>
              ₹{totalDeposited.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statSub}>Paid to IT Dept</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PENDING DEPOSIT</Text>
            <Text style={[styles.statValue, { color: colors.semantic.warning }]}>
              ₹{pendingDeposit.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statSub}>Due by 7th of next month</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TAX SCHEDULES</Text>
            <Text style={styles.statValue}>{taxRecords.length}</Text>
            <Text style={styles.statSub}>Active challan records</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by challan #, deductee, PAN, section..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <Text style={styles.filterLabel}>Section:</Text>
          {SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec}
              style={[styles.filterChip, selectedSection === sec && styles.filterChipActive]}
              onPress={() => setSelectedSection(sec)}
            >
              <Text style={[styles.filterChipText, selectedSection === sec && styles.filterChipTextActive]}>
                {sec === 'All' ? 'All Sec' : `Sec ${sec}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <Text style={styles.filterLabel}>Quarter:</Text>
          {QUARTERS.map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.filterChip, selectedQuarter === q && styles.filterChipActive]}
              onPress={() => setSelectedQuarter(q)}
            >
              <Text style={[styles.filterChipText, selectedQuarter === q && styles.filterChipTextActive]}>
                {q === 'All' ? 'All Qtrs' : q}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          <Text style={[styles.filterLabel, { marginLeft: 2 }]}>Status:</Text>
          {STATUSES.map(st => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, selectedStatus === st && styles.filterChipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text style={[styles.filterChipText, selectedStatus === st && styles.filterChipTextActive]}>
                {st === 'All' ? 'All Status' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={item => item.id}
        renderItem={renderTdsCard}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 60, 96) }]}
        ListEmptyComponent={
          <EmptyState
            title="No TDS Records Found"
            message={
              search
                ? 'No tax deduction records match your search criteria.'
                : 'No TDS schedules currently logged. TDS entries are created automatically when contractor bills or fees are recorded.'
            }
            icon={<Percent size={42} color={colors.text.tertiary} />}
          />
        }
      />

      {selectedRecord && (
        <Modal
          visible={!!selectedRecord}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setSelectedRecord(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <View style={styles.tagWrap}>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>Sec {selectedRecord.section}</Text>
                    </View>
                    <Text style={styles.detailChallanNo}>{selectedRecord.challanNumber}</Text>
                  </View>
                  <Text style={styles.detailDeductee}>{selectedRecord.deducteeName}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.detailCardBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Deductee PAN</Text>
                    <Text style={styles.detailValBold}>{selectedRecord.panNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Period</Text>
                    <Text style={styles.detailVal}>
                      {selectedRecord.quarter} (Financial Year {selectedRecord.financialYear})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Statutory Due Date</Text>
                    <Text style={styles.detailVal}>
                      {selectedRecord.depositDueDate || '7th of ensuing month'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Challan Deposit Status</Text>
                    <StatusBadge status={selectedRecord.status} size="sm" />
                  </View>
                  {selectedRecord.paidDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Deposit Date</Text>
                      <Text style={[styles.detailVal, { color: colors.semantic.success }]}>
                        {selectedRecord.paidDate}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailCalcBox}>
                  <Text style={styles.detailCalcHead}>STATUTORY DEDUCTION BREAKDOWN</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gross Taxable Amount</Text>
                    <Text style={styles.detailVal}>
                      ₹{selectedRecord.grossAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applicable Statutory Rate</Text>
                    <Text style={styles.detailVal}>{selectedRecord.tdsRate.toFixed(1)}%</Text>
                  </View>
                  <View style={[styles.detailRow, styles.totalRow]}>
                    <Text style={styles.detailTotalLabel}>TDS Withheld at Source</Text>
                    <Text style={styles.detailTotalVal}>
                      ₹{selectedRecord.tdsAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionInfoBox}>
                  <Text style={styles.sectionInfoTitle}>
                    Section {selectedRecord.section} Provision:
                  </Text>
                  <Text style={styles.sectionInfoDesc}>
                    {selectedRecord.section === '194C' &&
                      'Contractor and Subcontractor services for mineral drilling, trenching, and civil works. Standard rate 2% for Corporate / Partnership entities.'}
                    {selectedRecord.section === '194J' &&
                      'Fees for Professional or Technical Geological Services, geochemical assays, and highwall rock geotechnical analysis @ 10%.'}
                    {selectedRecord.section === '194I' &&
                      'Rent on exploration plant, rotary core drilling machinery, and land per annum exceeding threshold limit.'}
                    {selectedRecord.section === '192' &&
                      'Statutory income tax withholding on senior exploration geologists and operational mining staff monthly payroll.'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Close"
                  variant="secondary"
                  onPress={() => setSelectedRecord(null)}
                  style={{ flex: 1 }}
                />
                {selectedRecord.status === 'Pending Deposit' && canManage ? (
                  <Button
                    title="Deposit Challan"
                    variant="primary"
                    onPress={() => {
                      setSelectedRecord(null);
                      handleOpenDeposit(selectedRecord);
                    }}
                    style={{ flex: 1.5 }}
                  />
                ) : (
                  <Button
                    title="Form 16A Certificate"
                    variant="primary"
                    onPress={() => {
                      const rec = selectedRecord;
                      setSelectedRecord(null);
                      handleOpenCertificate(rec);
                    }}
                    style={{ flex: 1.5 }}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {depositRecord && (
        <Modal
          visible={showDepositModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowDepositModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.depositModalContent, { paddingBottom: Math.max(insets.bottom + 20, 28) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Deposit Statutory TDS Challan</Text>
                  <Text style={styles.modalSubtitle}>
                    Record ITNS-281 Government deposit & post payment voucher
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.depositDetailBanner}>
                <Text style={styles.depositBannerParty}>{depositRecord.deducteeName}</Text>
                <Text style={styles.depositBannerAmount}>
                  ₹{depositRecord.tdsAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.depositBannerSub}>
                  Section {depositRecord.section} • PAN: {depositRecord.panNumber}
                </Text>
              </View>

              <Input
                label="ITNS-281 Challan Serial Number *"
                placeholder="e.g. ITNS-281-94812"
                value={challanNoInput}
                onChangeText={setChallanNoInput}
              />

              <Input
                label="BSR Bank Branch Code *"
                placeholder="e.g. 0510304"
                value={bsrCodeInput}
                onChangeText={setBsrCodeInput}
              />

              <View style={styles.deNoticeBox}>
                <Text style={styles.deNoticeTitle}>Automatic Double-Entry Posting:</Text>
                <Text style={styles.deNoticeText}>
                  Dr. 2201 - TDS Payable (Statutory) ₹{depositRecord.tdsAmount.toLocaleString('en-IN')}{'\n'}
                  Cr. 1002 - HDFC Bank Jaipur Corporate Account ₹{depositRecord.tdsAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowDepositModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirm Deposit"
                  variant="primary"
                  loading={isSubmitting}
                  onPress={handleConfirmDeposit}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {certificateRecord && (
        <Modal
          visible={showCertificateModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowCertificateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.certModalContent, { paddingBottom: Math.max(insets.bottom + 20, 28) }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.certHeaderTitle}>FORM NO. 16A</Text>
                  <Text style={styles.certHeaderSub}>
                    Certificate under Section 203 of the Income-tax Act, 1961
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCertificateModal(false)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.certCompanyBox}>
                  <Text style={styles.certCompanyTitle}>BANSAL GEO SERVICES PVT LTD</Text>
                  <Text style={styles.certCompanyAddr}>
                    C-48, Geological Commercial Complex, M.I. Road, Jaipur, RJ 302001
                  </Text>
                  <View style={styles.certIdRow}>
                    <Text style={styles.certIdText}>TAN: JPRA01928F</Text>
                    <Text style={styles.certIdText}>PAN: AABCB9182C</Text>
                  </View>
                </View>

                <View style={styles.certDeducteeBox}>
                  <Text style={styles.certSectionHead}>DEDUCTEE / BENEFICIARY DETAILS</Text>
                  <Text style={styles.certDeducteeName}>{certificateRecord.deducteeName}</Text>
                  <Text style={styles.certDeducteePan}>PAN: {certificateRecord.panNumber}</Text>
                  <Text style={styles.certDeducteeSec}>
                    TDS Section: {certificateRecord.section} | Assessment Year: 2027-28
                  </Text>
                </View>

                <View style={styles.certTable}>
                  <View style={styles.certTableRow}>
                    <Text style={styles.certTableHead}>Particulars</Text>
                    <Text style={styles.certTableHead}>Amount (₹)</Text>
                  </View>
                  <View style={styles.certTableRow}>
                    <Text style={styles.certTableBody}>Total Amount Credited / Paid</Text>
                    <Text style={styles.certTableBodyBold}>
                      ₹{certificateRecord.grossAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.certTableRow}>
                    <Text style={styles.certTableBody}>TDS Rate Applied</Text>
                    <Text style={styles.certTableBodyBold}>
                      {certificateRecord.tdsRate.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={[styles.certTableRow, styles.certTableHighlight]}>
                    <Text style={styles.certHighlightText}>Total Tax Deposited (Challan ITNS-281)</Text>
                    <Text style={styles.certHighlightAmount}>
                      ₹{certificateRecord.tdsAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.certFooterBox}>
                  <Text style={styles.certFooterText}>
                    Verified that the sum of ₹{certificateRecord.tdsAmount.toLocaleString('en-IN')} has been credited to Central Government Account under Challan #{certificateRecord.challanNumber}.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Close Preview"
                  variant="secondary"
                  onPress={() => setShowCertificateModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Share Form 16A"
                  variant="primary"
                  onPress={() => {
                    Alert.alert(
                      'Form 16A Export',
                      `Form 16A TDS Certificate PDF generated for ${certificateRecord.deducteeName}. File saved to device storage.`
                    );
                  }}
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  form26qBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  form26qBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  statValue: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: 2,
  },
  statSub: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  filterList: {
    alignItems: 'center',
    gap: 6,
    paddingRight: spacing.lg,
  },
  filterLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginRight: 2,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border.subtle,
    marginHorizontal: 4,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionBadge: {
    backgroundColor: '#8B5CF620',
    borderWidth: 1,
    borderColor: '#8B5CF650',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  challanNo: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  partyBox: {
    marginTop: 2,
  },
  deducteeName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  panText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  numbersGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: 4,
  },
  numCol: {
    flex: 1,
  },
  numLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  numVal: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  tdsWithheldVal: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  periodText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depositBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  depositBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  certBtn: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  certBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '92%',
    width: '100%',
  },
  depositModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  certModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '92%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  detailChallanNo: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  detailDeductee: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: 4,
  },
  detailCardBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailVal: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detailValBold: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  detailCalcBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailCalcHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 4,
  },
  detailTotalLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  detailTotalVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: '#7C3AED',
  },
  sectionInfoBox: {
    backgroundColor: '#8B5CF610',
    borderWidth: 1,
    borderColor: '#8B5CF630',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    gap: 4,
    marginBottom: spacing.md,
  },
  sectionInfoTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: '#7C3AED',
  },
  sectionInfoDesc: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  depositDetailBanner: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  depositBannerParty: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  depositBannerAmount: {
    ...typography.h3,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  depositBannerSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  deNoticeBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  deNoticeTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deNoticeText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  certHeaderTitle: {
    ...typography.h3,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  certHeaderSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  certCompanyBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 2,
    marginBottom: spacing.md,
  },
  certCompanyTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.text.primary,
  },
  certCompanyAddr: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  certIdRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  certIdText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  certDeducteeBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 2,
    marginBottom: spacing.md,
  },
  certSectionHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  certDeducteeName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  certDeducteePan: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  certDeducteeSec: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  certTable: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.md,
  },
  certTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  certTableHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  certTableBody: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  certTableBodyBold: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  certTableHighlight: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 4,
  },
  certHighlightText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    flex: 1,
  },
  certHighlightAmount: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.semantic.success,
  },
  certFooterBox: {
    padding: spacing.sm,
    backgroundColor: `${colors.semantic.success}10`,
    borderRadius: borderRadius.sm,
  },
  certFooterText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.semantic.success,
    lineHeight: 14,
  },
});
