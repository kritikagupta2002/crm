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
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { FinanceVoucher } from '../../types';
import {
  Scale,
  Search,
  Plus,
  IndianRupee,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Eye,
  Filter,
} from 'lucide-react-native';

const DEBIT_ACCOUNTS = [
  '5002 - Direct Field Drilling Rig Expenses',
  '5003 - Mineral Assay & Laboratory Testing',
  '5100 - Geological Staff Salaries Expense',
  '5001 - Field Exploration Direct Expense',
  '1002 - HDFC Bank Jaipur Corporate Account',
  '1200 - Accounts Receivable Control',
  '2201 - TDS Payable (Statutory)',
  '5200 - Office Administration & Rent',
  '5300 - Travel & Field Per Diem Expense',
];

const CREDIT_ACCOUNTS = [
  '1002 - HDFC Bank Jaipur Corporate Account',
  '2001 - Accounts Payable (Vendors & Contractors)',
  '4001 - Geological Survey & Drilling Revenue',
  '2100 - Salaries Payable Control Account',
  '1200 - Accounts Receivable Control',
  '2201 - TDS Payable (Statutory)',
  '1001 - Petty Cash Account',
];

const VOUCHER_TYPES = [
  'All',
  'Journal Voucher',
  'Payment Voucher',
  'Receipt Voucher',
  'Sales Journal',
  'Purchase Journal',
  'Bank Voucher',
] as const;

export const VouchersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { vouchers, createVoucher } = useHrms();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FinanceVoucher | null>(null);

  // New voucher form fields
  const [voucherType, setVoucherType] = useState<
    'Journal Voucher' | 'Payment Voucher' | 'Receipt Voucher' | 'Sales Journal' | 'Purchase Journal' | 'Bank Voucher'
  >('Journal Voucher');
  const [reference, setReference] = useState('');
  const [debitAccount, setDebitAccount] = useState(DEBIT_ACCOUNTS[0]);
  const [creditAccount, setCreditAccount] = useState(CREDIT_ACCOUNTS[0]);
  const [debitAmount, setDebitAmount] = useState('10000');
  const [creditAmount, setCreditAmount] = useState('10000');
  const [narration, setNarration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom account inputs
  const [isCustomDebit, setIsCustomDebit] = useState(false);
  const [customDebit, setCustomDebit] = useState('');
  const [isCustomCredit, setIsCustomCredit] = useState(false);
  const [customCredit, setCustomCredit] = useState('');

  const canManage = hasRole(['Admin', 'Accountant']);

  // Parity computation
  const drNum = parseFloat(debitAmount) || 0;
  const crNum = parseFloat(creditAmount) || 0;
  const isBalanced = drNum > 0 && crNum > 0 && Math.abs(drNum - crNum) < 0.001;
  const difference = Math.abs(drNum - crNum);

  // Global Ledger Audit Totals
  const totalDebits = useMemo(
    () => vouchers.reduce((sum, v) => sum + (v.debitAmount || v.amount), 0),
    [vouchers]
  );
  const totalCredits = useMemo(
    () => vouchers.reduce((sum, v) => sum + (v.creditAmount || v.amount), 0),
    [vouchers]
  );
  const ledgerBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const q = search.toLowerCase();
      const matchesSearch =
        v.voucherNumber.toLowerCase().includes(q) ||
        v.narration.toLowerCase().includes(q) ||
        v.debitAccount.toLowerCase().includes(q) ||
        v.creditAccount.toLowerCase().includes(q) ||
        (v.referenceId && v.referenceId.toLowerCase().includes(q));
      const matchesType = selectedType === 'All' || v.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [vouchers, search, selectedType]);

  const handlePostEntry = async () => {
    if (!isBalanced) {
      Alert.alert(
        'Out of Balance',
        `Double-entry rules require Total Debits strictly equal Total Credits.\nCurrent difference: ₹${difference.toLocaleString('en-IN')}`
      );
      return;
    }

    if (drNum <= 0) {
      Alert.alert('Validation Error', 'Transaction monetary value must be strictly greater than zero.');
      return;
    }

    const finalDebit = (isCustomDebit ? customDebit : debitAccount).trim();
    const finalCredit = (isCustomCredit ? customCredit : creditAccount).trim();

    if (!finalDebit || !finalCredit) {
      Alert.alert('Account Required', 'Please specify both Debit and Credit ledger accounts.');
      return;
    }

    if (finalDebit === finalCredit) {
      Alert.alert('Double-Entry Violation', 'Debit and Credit accounts must be distinct entities.');
      return;
    }

    if (!narration.trim()) {
      Alert.alert('Narration Required', 'Please provide an accounting narration for the journal voucher.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createVoucher({
        voucherNumber: `JV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        type: voucherType,
        date: new Date().toISOString().split('T')[0],
        debitAccount: finalDebit,
        creditAccount: finalCredit,
        debitAmount: drNum,
        creditAmount: crNum,
        amount: drNum,
        status: 'Posted',
        referenceId: reference.trim() || undefined,
        referenceType: reference.trim() ? 'manual' : undefined,
        narration: narration.trim(),
      });

      setShowAddModal(false);
      setNarration('');
      setReference('');
      setDebitAmount('10000');
      setCreditAmount('10000');
      setIsCustomDebit(false);
      setIsCustomCredit(false);
      Alert.alert('Voucher Posted', `Journal voucher posted to general ledger for ₹${drNum.toLocaleString('en-IN')}`);
    } catch (err: any) {
      Alert.alert('Posting Error', err.message || 'Failed to post voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVoucherCard = ({ item }: { item: FinanceVoucher }) => {
    const dr = item.debitAmount || item.amount;
    const cr = item.creditAmount || item.amount;
    const balancedItem = dr === cr;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedVoucher(item)}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tagWrap}>
              <Text style={styles.vNumber}>{item.voucherNumber}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.dateText}>{item.date}</Text>
              <StatusBadge status={item.status || 'Posted'} size="sm" />
            </View>
          </View>

          {/* Double-Entry Ledger Box */}
          <View style={styles.ledgerBox}>
            <View style={styles.ledgerRow}>
              <View style={[styles.drCrTagWrap, styles.drBg]}>
                <Text style={styles.drTag}>Dr</Text>
              </View>
              <Text style={styles.accountText} numberOfLines={1}>
                {item.debitAccount}
              </Text>
              <Text style={[styles.amountText, styles.drText]}>
                ₹{dr.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.ledgerRow}>
              <View style={[styles.drCrTagWrap, styles.crBg]}>
                <Text style={styles.crTag}>Cr</Text>
              </View>
              <Text style={[styles.accountText, { paddingLeft: 6 }]} numberOfLines={1}>
                {item.creditAccount}
              </Text>
              <Text style={[styles.amountText, styles.crText]}>
                ₹{cr.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Narration */}
          <Text style={styles.narrationText} numberOfLines={2}>
            <Text style={{ fontWeight: '700', color: colors.text.primary }}>Narration: </Text>
            {item.narration}
          </Text>

          {/* Metadata Footer */}
          <View style={styles.cardFooter}>
            {item.referenceId ? (
              <View style={styles.refBadge}>
                <Text style={styles.refText}>
                  Ref: {item.referenceType ? `${item.referenceType.toUpperCase()} ` : ''}#{item.referenceId}
                </Text>
              </View>
            ) : (
              <Text style={styles.refTextMuted}>Manual General Posting</Text>
            )}

            <View style={styles.parityIndicator}>
              {balancedItem ? (
                <View style={styles.balancedPill}>
                  <CheckCircle2 size={12} color={colors.semantic.success} />
                  <Text style={styles.balancedText}>Balanced</Text>
                </View>
              ) : (
                <View style={styles.diffPill}>
                  <AlertTriangle size={12} color={colors.semantic.error} />
                  <Text style={styles.diffText}>Unbalanced</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Double-Entry Vouchers"
        subtitle="General ledger, journal & payment vouchers"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canManage ? (
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addHeaderText}>Post JV</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Audit Balance Verification Card */}
      <View style={styles.auditCard}>
        <View style={styles.auditHeader}>
          <View style={styles.auditIconWrap}>
            <BookOpen size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.auditTitle}>General Ledger Parity Verification</Text>
            <Text style={styles.auditSubtitle}>
              Statutory Indian double-entry accounting audit trail
            </Text>
          </View>
          <View style={styles.parityBadgeWrap}>
            {ledgerBalanced ? (
              <View style={styles.parityOkBadge}>
                <CheckCircle2 size={13} color={colors.semantic.success} />
                <Text style={styles.parityOkText}>Balanced</Text>
              </View>
            ) : (
              <View style={styles.parityErrBadge}>
                <AlertTriangle size={13} color={colors.semantic.error} />
                <Text style={styles.parityErrText}>
                  Diff: ₹{Math.abs(totalDebits - totalCredits).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.auditStatsRow}>
          <View style={styles.auditStatCol}>
            <Text style={styles.auditStatLabel}>TOTAL DEBITS (DR)</Text>
            <Text style={styles.auditStatValue}>₹{totalDebits.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.auditDivider} />
          <View style={styles.auditStatCol}>
            <Text style={styles.auditStatLabel}>TOTAL CREDITS (CR)</Text>
            <Text style={styles.auditStatValue}>₹{totalCredits.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.auditDivider} />
          <View style={styles.auditStatCol}>
            <Text style={styles.auditStatLabel}>TOTAL ENTRIES</Text>
            <Text style={styles.auditStatValue}>{vouchers.length}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by voucher #, account, narration, ref..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      {/* Filter Type Chips */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={VOUCHER_TYPES}
          keyExtractor={item => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedType === item && styles.filterChipActive]}
              onPress={() => setSelectedType(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Vouchers List */}
      <FlatList
        data={filteredVouchers}
        keyExtractor={item => item.id}
        renderItem={renderVoucherCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Vouchers Found"
            message={
              search
                ? 'No journal vouchers match your search criteria.'
                : 'General ledger is currently empty. Post a double-entry journal voucher to begin.'
            }
            icon={<Scale size={42} color={colors.text.tertiary} />}
          />
        }
      />

      {/* Post Double-Entry Journal Entry Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Double-Entry Journal Entry</Text>
                <Text style={styles.modalSubtitle}>
                  Post balanced debit and credit allocations to general ledger
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Classification */}
              <Text style={styles.fieldLabel}>Voucher Classification</Text>
              <View style={styles.typeChipsGrid}>
                {[
                  'Journal Voucher',
                  'Payment Voucher',
                  'Receipt Voucher',
                  'Sales Journal',
                  'Purchase Journal',
                  'Bank Voucher',
                ].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, voucherType === t && styles.typeChipActive]}
                    onPress={() => setVoucherType(t as any)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        voucherType === t && styles.typeChipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Supporting Reference */}
              <Input
                label="Supporting Document Reference"
                placeholder="e.g. INV-2026-001 / BILL-89 / BOARD-APPROVAL"
                value={reference}
                onChangeText={setReference}
              />

              {/* Double-Entry Ledger Rows Box */}
              <View style={styles.deFormBox}>
                <Text style={styles.deFormTitle}>DOUBLE-ENTRY ALLOCATION</Text>

                {/* Debit Head */}
                <Text style={styles.fieldLabel}>Debit Account (Dr.)</Text>
                {!isCustomDebit ? (
                  <View style={styles.accountSelectorBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accChipScroll}>
                      {DEBIT_ACCOUNTS.map(acc => (
                        <TouchableOpacity
                          key={acc}
                          style={[styles.accChip, debitAccount === acc && styles.accChipActiveDr]}
                          onPress={() => setDebitAccount(acc)}
                        >
                          <Text style={[styles.accChipText, debitAccount === acc && styles.accChipTextActive]}>
                            {acc.split(' - ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.selectedAccLabel}>{debitAccount}</Text>
                    <TouchableOpacity onPress={() => setIsCustomDebit(true)}>
                      <Text style={styles.customAccLink}>+ Enter Custom Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Input
                      placeholder="e.g. 5005 - Diamond Core Bit Tooling"
                      value={customDebit}
                      onChangeText={setCustomDebit}
                    />
                    <TouchableOpacity onPress={() => setIsCustomDebit(false)}>
                      <Text style={styles.customAccLink}>← Back to Preset Accounts</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Input
                  label="Debit Amount (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={debitAmount}
                  onChangeText={val => {
                    setDebitAmount(val);
                    // Helpful synchronization convenience
                    if (!creditAmount || creditAmount === debitAmount) {
                      setCreditAmount(val);
                    }
                  }}
                  leftIcon={<IndianRupee size={15} color={colors.text.secondary} />}
                />

                <View style={styles.formSeparator} />

                {/* Credit Head */}
                <Text style={styles.fieldLabel}>Credit Account (Cr.)</Text>
                {!isCustomCredit ? (
                  <View style={styles.accountSelectorBox}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accChipScroll}>
                      {CREDIT_ACCOUNTS.map(acc => (
                        <TouchableOpacity
                          key={acc}
                          style={[styles.accChip, creditAccount === acc && styles.accChipActiveCr]}
                          onPress={() => setCreditAccount(acc)}
                        >
                          <Text style={[styles.accChipText, creditAccount === acc && styles.accChipTextActive]}>
                            {acc.split(' - ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.selectedAccLabel}>{creditAccount}</Text>
                    <TouchableOpacity onPress={() => setIsCustomCredit(true)}>
                      <Text style={styles.customAccLink}>+ Enter Custom Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Input
                      placeholder="e.g. 2005 - State Bank of India Current A/c"
                      value={customCredit}
                      onChangeText={setCustomCredit}
                    />
                    <TouchableOpacity onPress={() => setIsCustomCredit(false)}>
                      <Text style={styles.customAccLink}>← Back to Preset Accounts</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Input
                  label="Credit Amount (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={creditAmount}
                  onChangeText={setCreditAmount}
                  leftIcon={<IndianRupee size={15} color={colors.text.secondary} />}
                />

                {/* Double-Entry Parity Live Status Banner */}
                <View
                  style={[
                    styles.parityLiveBanner,
                    isBalanced ? styles.parityLiveOk : styles.parityLiveErr,
                  ]}
                >
                  <View style={styles.parityLiveLeft}>
                    {isBalanced ? (
                      <CheckCircle2 size={16} color={colors.semantic.success} />
                    ) : (
                      <AlertTriangle size={16} color={colors.semantic.error} />
                    )}
                    <Text
                      style={[
                        styles.parityLiveText,
                        { color: isBalanced ? colors.semantic.success : colors.semantic.error },
                      ]}
                    >
                      {isBalanced
                        ? '✓ Balanced Entry (Debit = Credit)'
                        : `⚠ Out of Balance: ₹${difference.toLocaleString('en-IN')} diff`}
                    </Text>
                  </View>
                  <Text style={styles.parityLiveAmount}>
                    ₹{drNum.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Narration */}
              <Input
                label="Accounting Narration / Remarks *"
                placeholder="Being field exploration expenses incurred at Korba block..."
                value={narration}
                onChangeText={setNarration}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.deRule}>
                * Under Indian Accounting Standards (Ind AS), every transaction must maintain strict parity between Total Debits and Total Credits. Unbalanced entries cannot be saved.
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Post Accounting Entry"
                variant="primary"
                loading={isSubmitting}
                disabled={!isBalanced || drNum <= 0 || !narration.trim()}
                onPress={handlePostEntry}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <Modal visible={!!selectedVoucher} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.detailVNumber}>{selectedVoucher.voucherNumber}</Text>
                  <Text style={styles.detailVType}>{selectedVoucher.type}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedVoucher(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>POSTING DATE</Text>
                    <Text style={styles.detailMetaVal}>{selectedVoucher.date}</Text>
                  </View>
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>AUDIT STATUS</Text>
                    <StatusBadge status={selectedVoucher.status || 'Posted'} size="sm" />
                  </View>
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>CROSS REFERENCE</Text>
                    <Text style={styles.detailMetaVal}>
                      {selectedVoucher.referenceId
                        ? `${selectedVoucher.referenceType || 'DOC'} #${selectedVoucher.referenceId}`
                        : 'Manual Entry'}
                    </Text>
                  </View>
                </View>

                {/* Double Entry Table */}
                <View style={styles.detailLedgerTable}>
                  <View style={styles.detailLedgerHeader}>
                    <Text style={[styles.detailTableColHead, { flex: 2 }]}>LEDGER ACCOUNT</Text>
                    <Text style={[styles.detailTableColHead, { width: 80, textAlign: 'right' }]}>DEBIT (₹)</Text>
                    <Text style={[styles.detailTableColHead, { width: 80, textAlign: 'right' }]}>CREDIT (₹)</Text>
                  </View>

                  {/* Debit Line */}
                  <View style={styles.detailLedgerLine}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.detailAccName}>
                        <Text style={styles.drTagInline}>Dr. </Text>
                        {selectedVoucher.debitAccount}
                      </Text>
                    </View>
                    <Text style={[styles.detailLineAmount, { width: 80, textAlign: 'right', color: colors.semantic.success }]}>
                      ₹{(selectedVoucher.debitAmount || selectedVoucher.amount).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.detailLineAmount, { width: 80, textAlign: 'right', color: colors.text.tertiary }]}>
                      -
                    </Text>
                  </View>

                  {/* Credit Line */}
                  <View style={styles.detailLedgerLine}>
                    <View style={{ flex: 2, paddingLeft: 12 }}>
                      <Text style={styles.detailAccName}>
                        <Text style={styles.crTagInline}>To </Text>
                        {selectedVoucher.creditAccount}
                      </Text>
                    </View>
                    <Text style={[styles.detailLineAmount, { width: 80, textAlign: 'right', color: colors.text.tertiary }]}>
                      -
                    </Text>
                    <Text style={[styles.detailLineAmount, { width: 80, textAlign: 'right', color: colors.semantic.warning }]}>
                      ₹{(selectedVoucher.creditAmount || selectedVoucher.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Total Parity Row */}
                  <View style={styles.detailLedgerTotalRow}>
                    <Text style={[styles.detailTotalLabel, { flex: 2 }]}>TOTAL (BALANCED)</Text>
                    <Text style={[styles.detailTotalAmount, { width: 80, textAlign: 'right' }]}>
                      ₹{(selectedVoucher.debitAmount || selectedVoucher.amount).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.detailTotalAmount, { width: 80, textAlign: 'right' }]}>
                      ₹{(selectedVoucher.creditAmount || selectedVoucher.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Narration */}
                <View style={styles.detailNarrationBox}>
                  <Text style={styles.detailNarrationLabel}>NARRATION & PURPOSE</Text>
                  <Text style={styles.detailNarrationText}>{selectedVoucher.narration}</Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Close"
                  variant="secondary"
                  onPress={() => setSelectedVoucher(null)}
                  style={{ flex: 1 }}
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  addHeaderText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  auditCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.sm,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  auditIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  auditSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
  },
  parityBadgeWrap: {
    alignSelf: 'flex-start',
  },
  parityOkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.semantic.success}15`,
    borderWidth: 1,
    borderColor: `${colors.semantic.success}40`,
  },
  parityOkText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  parityErrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.semantic.error}15`,
    borderWidth: 1,
    borderColor: `${colors.semantic.error}40`,
  },
  parityErrText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.error,
  },
  auditStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  auditStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  auditDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  auditStatLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  auditStatValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterScroll: {
    paddingBottom: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
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
    marginBottom: spacing.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vNumber: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  typeBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  ledgerBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  drCrTagWrap: {
    width: 26,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drBg: {
    backgroundColor: `${colors.semantic.success}20`,
  },
  crBg: {
    backgroundColor: `${colors.semantic.warning}20`,
  },
  drTag: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.semantic.success,
  },
  crTag: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.semantic.warning,
  },
  accountText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  amountText: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  drText: {
    color: colors.semantic.success,
  },
  crText: {
    color: colors.text.primary,
  },
  narrationText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
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
  refBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  refTextMuted: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  parityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balancedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balancedText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diffText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
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
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  typeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  deFormBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  deFormTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  accountSelectorBox: {
    marginBottom: spacing.xs,
  },
  accChipScroll: {
    marginBottom: 4,
  },
  accChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: 6,
  },
  accChipActiveDr: {
    backgroundColor: `${colors.semantic.success}20`,
    borderColor: colors.semantic.success,
  },
  accChipActiveCr: {
    backgroundColor: `${colors.semantic.warning}20`,
    borderColor: colors.semantic.warning,
  },
  accChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  accChipTextActive: {
    color: colors.text.primary,
  },
  selectedAccLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  customAccLink: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  formSeparator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xs,
  },
  parityLiveBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
  },
  parityLiveOk: {
    backgroundColor: `${colors.semantic.success}15`,
    borderColor: `${colors.semantic.success}40`,
  },
  parityLiveErr: {
    backgroundColor: `${colors.semantic.error}15`,
    borderColor: `${colors.semantic.error}40`,
  },
  parityLiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parityLiveText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  parityLiveAmount: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
  },
  deRule: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  // Detail Modal Styles
  detailModalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  detailVNumber: {
    ...typography.h3,
    color: colors.text.primary,
  },
  detailVType: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  detailMetaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  detailMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailMetaLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  detailMetaVal: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  detailLedgerTable: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailLedgerHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: 4,
  },
  detailTableColHead: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  detailLedgerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  drTagInline: {
    fontWeight: '800',
    color: colors.semantic.success,
  },
  crTagInline: {
    fontWeight: '800',
    color: colors.semantic.warning,
  },
  detailAccName: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '600',
  },
  detailLineAmount: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  detailLedgerTotalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 2,
  },
  detailTotalLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.secondary,
  },
  detailTotalAmount: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  detailNarrationBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  detailNarrationLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
  },
  detailNarrationText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
