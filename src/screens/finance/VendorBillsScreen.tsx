import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { useFinance, useAuth, useCrm } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  AppHeader,
  Card,
  StatusBadge,
  Button,
  Input,
  EmptyState,
} from '../../components';
import { VendorBill, Vendor, WorkOrder } from '../../types';
import {
  FileSpreadsheet,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
  Building,
  CreditCard,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';

export const VendorBillsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { vendorBills, recordVendorBill, updateVendorBillStatus } = useFinance();
  const { vendors } = useCrm();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedItc, setSelectedItc] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [billToPay, setBillToPay] = useState<VendorBill | null>(null);
  const [paymentMode, setPaymentMode] = useState<'NEFT/RTGS' | 'UPI' | 'Cheque'>('NEFT/RTGS');
  const [bankAccount, setBankAccount] = useState('HDFC Bank Corporate A/c (..4910)');
  const [utrRef, setUtrRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [billNo, setBillNo] = useState('');
  const [category, setCategory] = useState('Drilling & Coring');
  const [baseAmount, setBaseAmount] = useState('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [tdsCategory, setTdsCategory] = useState<'194C' | '194J'>('194C');
  const [itcEligible, setItcEligible] = useState(true);
  const [selectedWoId, setSelectedWoId] = useState('');
  const [notes, setNotes] = useState('Verified against field drilling logs & core delivery memo.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = hasRole(['Admin', 'Accountant', 'admin', 'accountant']);

  useEffect(() => {
    if (vendors && vendors.length > 0 && !selectedVendorId) {
      const active = vendors.find((v) => v.empanelledStatus === 'Active' || (v as any).status === 'Active');
      if (active) {
        setSelectedVendorId(active.id);
        if (active.category) setCategory(active.category);
        if (active.tds && typeof active.tds === 'object') {
          setTdsCategory(active.tds.section as '194C' | '194J');
        }
      }
    }
  }, [vendors, selectedVendorId]);

  const activeVendors = useMemo(() => {
    return vendors.filter((v) => v.empanelledStatus === 'Active' || (v as any).status === 'Active');
  }, [vendors]);

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const v = vendors.find((item) => item.id === vendorId);
    if (v) {
      if (v.category) setCategory(v.category);
      if (v.tds && typeof v.tds === 'object') {
        setTdsCategory(v.tds.section as '194C' | '194J');
      } else if (v.category && (v.category.includes('Lab') || v.category.includes('Assay'))) {
        setTdsCategory('194J');
      } else {
        setTdsCategory('194C');
      }
    }
  };

  const categories = [
    'Drilling & Coring',
    'Assay & Testing',
    'Equipment Lease',
    'Field Logistics',
    'Survey & Mapping',
    'Consumables',
  ];

  const numBase = parseFloat(baseAmount) || 0;
  const numGst = Math.round((numBase * taxRate) / 100);
  const tdsPct = tdsCategory === '194J' ? 0.10 : 0.02;
  const numTds = Math.round(numBase * tdsPct);
  const numNetPayable = numBase + numGst - numTds;

  const statusOptions = ['All', 'Pending Approval', 'Approved', 'Paid', 'Overdue'];

  const filteredBills = useMemo(() => {
    return vendorBills.filter((b) => {
      const bNum = (b.billNo || b.billNumber || '').toLowerCase();
      const vName = (b.vendorName || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();

      const matchesSearch =
        bNum.includes(search.toLowerCase()) ||
        vName.includes(search.toLowerCase()) ||
        cat.includes(search.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        b.status.toLowerCase() === selectedStatus.toLowerCase() ||
        (selectedStatus === 'Pending Approval' && b.status === 'Unpaid');

      const matchesItc =
        selectedItc === 'All' ||
        (selectedItc === 'Eligible' && b.itcEligible) ||
        (selectedItc === 'Ineligible' && !b.itcEligible);

      return matchesSearch && matchesStatus && matchesItc;
    });
  }, [vendorBills, search, selectedStatus, selectedItc]);

  const handleCreateBill = async () => {
    if (!billNo.trim()) {
      Alert.alert('Validation Error', 'Please enter the vendor bill/invoice number.');
      return;
    }

    const duplicate = vendorBills.some(
      (b) =>
        (b.billNo && b.billNo.toLowerCase() === billNo.trim().toLowerCase()) ||
        (b.billNumber && b.billNumber.toLowerCase() === billNo.trim().toLowerCase())
    );
    if (duplicate) {
      Alert.alert(
        'Duplicate Bill Number',
        `Bill number "${billNo.trim()}" has already been recorded in the system. Duplicate bill numbers are blocked.`
      );
      return;
    }

    if (!selectedVendorId) {
      Alert.alert('Validation Error', 'Please select an active empanelled vendor.');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor) {
      Alert.alert('Validation Error', 'Selected vendor not found in vendor master.');
      return;
    }

    if (vendor.empanelledStatus !== 'Active' && (vendor as any).status !== 'Active') {
      Alert.alert(
        'Inactive Vendor',
        `Vendor "${vendor.name}" is "${vendor.empanelledStatus || 'Inactive'}". Bills can only be processed for active vendors.`
      );
      return;
    }

    if (numBase <= 0) {
      Alert.alert('Validation Error', 'Base taxable amount must be strictly greater than ₹0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await recordVendorBill({
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorGstin: vendor.gstin,
        billNo: billNo.trim(),
        category,
        baseAmount: numBase,
        taxRate,
        tdsCategory,
        tdsRate: tdsPct,
        itcEligible,
        notes,
        workOrderId: selectedWoId || undefined,
      });

      setShowAddModal(false);
      setBillNo('');
      setBaseAmount('');
      Alert.alert(
        'Vendor Bill Recorded',
        `Bill ${created.billNo} from ${created.vendorName} recorded. Purchase Journal voucher & Section ${tdsCategory} TDS deduction generated.`
      );
    } catch (err: any) {
      Alert.alert('Recording Failed', err.message || 'Could not record vendor bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveBill = async (b: VendorBill) => {
    Alert.alert(
      'Approve Vendor Bill',
      `Approve Bill ${b.billNo} from ${b.vendorName} for payment disbursement?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Bill',
          style: 'default',
          onPress: async () => {
            try {
              await updateVendorBillStatus(b.id, 'Approved');
              if (selectedBill && selectedBill.id === b.id) {
                setSelectedBill({ ...selectedBill, status: 'Approved' });
              }
              Alert.alert('Bill Approved', `Bill ${b.billNo} is now approved for payment disbursement.`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to approve bill.');
            }
          },
        },
      ]
    );
  };

  const openPayModal = (b: VendorBill) => {
    setBillToPay(b);
    setUtrRef(`NEFT-${Date.now().toString().slice(-6)}`);
    setShowPayModal(true);
  };

  const handleConfirmDisbursement = async () => {
    if (!billToPay) return;
    if (!utrRef.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid bank UTR / payment reference.');
      return;
    }

    try {
      setIsPaying(true);
      await updateVendorBillStatus(billToPay.id, 'Paid', {
        paymentMode,
        bankAccount,
        utrRef: utrRef.trim(),
      });

      setShowPayModal(false);
      if (selectedBill && selectedBill.id === billToPay.id) {
        setSelectedBill({ ...selectedBill, status: 'Paid' });
      }
      setBillToPay(null);
      Alert.alert(
        'Payment Disbursed',
        `Disbursement of ₹${(billToPay.totalAmount - billToPay.tdsAmount).toLocaleString(
          'en-IN'
        )} posted to general ledger. Payment Voucher created.`
      );
    } catch (e: any) {
      Alert.alert('Disbursement Error', e.message || 'Could not disburse payment.');
    } finally {
      setIsPaying(false);
    }
  };

  const renderBillCard = ({ item }: { item: VendorBill }) => {
    const netPayable = item.totalAmount - item.tdsAmount;
    const tdsLabel = item.tdsCategory === '194J' ? 'TDS 194J (10%)' : 'TDS 194C (2%)';

    return (
      <Card style={styles.card} onPress={() => setSelectedBill(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Text style={styles.billNumber}>{item.billNo}</Text>
            {item.itcEligible ? (
              <View style={styles.itcBadge}>
                <ShieldCheck size={10} color={colors.semantic.success} />
                <Text style={styles.itcText}>ITC Eligible</Text>
              </View>
            ) : (
              <View style={styles.itcIneligibleBadge}>
                <Text style={styles.itcIneligibleText}>ITC Ineligible</Text>
              </View>
            )}
          </View>
          <StatusBadge status={item.status} size="small" />
        </View>

        <Text style={styles.vendorName}>{item.vendorName}</Text>
        <Text style={styles.categoryText}>{item.category || 'Subcontract Exploration'}</Text>

        <View style={styles.finGrid}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>BASE TAXABLE</Text>
            <Text style={styles.finValue}>₹{item.baseAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>GST ({item.taxRate || 18}%)</Text>
            <Text style={styles.finValue}>₹{item.gstAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>{tdsLabel}</Text>
            <Text style={[styles.finValue, { color: colors.semantic.danger }]}>
              -₹{item.tdsAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>NET PAYABLE</Text>
            <Text style={[styles.finValue, { color: colors.primary, fontWeight: '700' }]}>
              ₹{netPayable.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.datesRow}>
            <Text style={styles.dateText}>Dated: {item.date}</Text>
            {item.dueDate && <Text style={styles.dateText}>Due: {item.dueDate}</Text>}
          </View>

          <View style={styles.cardActionsRow}>
            {canManage && (item.status === 'Pending Approval' || item.status === 'Unpaid') && (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApproveBill(item)}
              >
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            )}
            {canManage && item.status === 'Approved' && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => openPayModal(item)}
              >
                <Text style={styles.payBtnText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Inward Vendor Bills"
        subtitle="Subcontractor AP, Section 194C/194J TDS & GST ITC"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          canManage ? (
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addHeaderText}>Record Bill</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by bill #, vendor name, category..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {statusOptions.map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, selectedStatus === st && styles.filterChipActive]}
            onPress={() => setSelectedStatus(st)}
          >
            <Text
              style={[styles.filterChipText, selectedStatus === st && styles.filterChipTextActive]}
            >
              {st}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {['All', 'Eligible', 'Ineligible'].map((itc) => (
          <TouchableOpacity
            key={itc}
            style={[styles.filterChip, selectedItc === itc && styles.filterChipActive]}
            onPress={() => setSelectedItc(itc)}
          >
            <Text
              style={[styles.filterChipText, selectedItc === itc && styles.filterChipTextActive]}
            >
              ITC: {itc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Vendor Bills Found"
            message={
              search
                ? 'No bills match your search criteria.'
                : 'No subcontractor bills recorded in the payables ledger.'
            }
            icon={<FileSpreadsheet size={40} color={colors.text.tertiary} />}
          />
        }
      />

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Subcontractor Bill</Text>
                <Text style={styles.modalSub}>
                  Inward bill with statutory TDS deduction and GST ITC validation
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.formSectionTitle}>1. ACTIVE VENDOR (VENDOR WORKSPACE DATA)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vendorChipsScroll}>
                {activeVendors.map((v) => {
                  const isSelected = v.id === selectedVendorId;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.vendorChip, isSelected && styles.vendorChipActive]}
                      onPress={() => handleVendorSelect(v.id)}
                    >
                      <Text style={[styles.vendorChipText, isSelected && styles.vendorChipTextActive]}>
                        {v.name}
                      </Text>
                      <Text style={[styles.vendorChipSub, isSelected && styles.vendorChipSubActive]}>
                        {v.category || 'Vendor'} • {v.place}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.formSectionTitle}>2. BILL DETAILS & SCOPE</Text>
              <Input
                label="Bill / Invoice Number (Unique)"
                placeholder="e.g. VB-2026-089"
                value={billNo}
                onChangeText={setBillNo}
              />

              <View style={styles.categoryPickerWrap}>
                <Text style={styles.fieldLabel}>Expense Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, category === c && styles.catChipActive]}
                      onPress={() => {
                        setCategory(c);
                        if (c.includes('Assay') || c.includes('Testing')) {
                          setTdsCategory('194J');
                        } else {
                          setTdsCategory('194C');
                        }
                      }}
                    >
                      <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Input
                label="Base Pre-Tax Amount (₹)"
                placeholder="e.g. 250000"
                keyboardType="numeric"
                value={baseAmount}
                onChangeText={setBaseAmount}
              />

              <Text style={styles.formSectionTitle}>3. STATUTORY TDS & GST ITC</Text>
              <View style={styles.tdsToggleRow}>
                <Text style={styles.fieldLabel}>TDS Withholding Section:</Text>
                <View style={styles.tdsOptions}>
                  <TouchableOpacity
                    style={[styles.tdsBtn, tdsCategory === '194C' && styles.tdsBtnActive]}
                    onPress={() => setTdsCategory('194C')}
                  >
                    <Text style={[styles.tdsBtnText, tdsCategory === '194C' && styles.tdsBtnTextActive]}>
                      194C (Contractor 2%)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tdsBtn, tdsCategory === '194J' && styles.tdsBtnActive]}
                    onPress={() => setTdsCategory('194J')}
                  >
                    <Text style={[styles.tdsBtnText, tdsCategory === '194J' && styles.tdsBtnTextActive]}>
                      194J (Assays/Tech 10%)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itcToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Input Tax Credit (ITC) Eligible</Text>
                  <Text style={styles.toggleSub}>
                    {itcEligible ? 'Claimable against output GST liability' : 'Ineligible for tax credit'}
                  </Text>
                </View>
                <Switch
                  value={itcEligible}
                  onValueChange={setItcEligible}
                  trackColor={{ false: '#CBD5E1', true: colors.semantic.success }}
                />
              </View>

              <View style={styles.computationBox}>
                <View style={styles.compRow}>
                  <Text style={styles.compLabel}>Base Taxable Amount:</Text>
                  <Text style={styles.compVal}>₹{numBase.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.compRow}>
                  <Text style={styles.compLabel}>GST ({taxRate}%):</Text>
                  <Text style={styles.compVal}>+₹{numGst.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.compRow}>
                  <Text style={styles.compLabel}>
                    TDS Deduction ({tdsCategory} @ {(tdsPct * 100).toFixed(0)}%):
                  </Text>
                  <Text style={[styles.compVal, { color: colors.semantic.danger }]}>
                    -₹{numTds.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.compRow, styles.compTotalRow]}>
                  <Text style={styles.compTotalLabel}>NET DISBURSEMENT PAYABLE:</Text>
                  <Text style={styles.compTotalVal}>₹{numNetPayable.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Record Bill"
                  onPress={handleCreateBill}
                  loading={isSubmitting}
                  style={{ flex: 2 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showPayModal && billToPay && (
        <Modal visible={showPayModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Disburse Vendor Payment</Text>
                  <Text style={styles.modalSub}>
                    Bill {billToPay.billNo} • {billToPay.vendorName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowPayModal(false)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContent}>
                <View style={styles.paySummaryBox}>
                  <Text style={styles.paySummaryLabel}>Net Payable Disbursed (Base + GST - TDS):</Text>
                  <Text style={styles.paySummaryAmount}>
                    ₹{(billToPay.totalAmount - billToPay.tdsAmount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.paySummarySub}>
                    Gross: ₹{billToPay.totalAmount.toLocaleString('en-IN')} • TDS 194C/J Deducted: ₹{billToPay.tdsAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Disbursement Bank Account</Text>
                  <Input
                    value={bankAccount}
                    onChangeText={setBankAccount}
                    placeholder="e.g. HDFC Bank Corporate A/c (..4910)"
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Payment Mode</Text>
                  <View style={styles.payModeRow}>
                    {(['NEFT/RTGS', 'UPI', 'Cheque'] as const).map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.payModeBtn, paymentMode === mode && styles.payModeBtnActive]}
                        onPress={() => setPaymentMode(mode)}
                      >
                        <Text style={[styles.payModeText, paymentMode === mode && styles.payModeTextActive]}>
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Input
                  label="Bank UTR / Transaction Reference"
                  placeholder="e.g. HDFC202609281014"
                  value={utrRef}
                  onChangeText={setUtrRef}
                />

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setShowPayModal(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Post Payment Voucher"
                    onPress={handleConfirmDisbursement}
                    loading={isPaying}
                    style={{ flex: 2 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {selectedBill && (
        <Modal visible={!!selectedBill} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedBill.billNo}</Text>
                  <Text style={styles.modalSub}>Inward Subcontractor Invoice</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBill(null)}>
                  <X size={22} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.detailDocContent} showsVerticalScrollIndicator={false}>
                <View style={styles.detailVendorBox}>
                  <Text style={styles.billToLabel}>VENDOR DETAILS</Text>
                  <Text style={styles.billToName}>{selectedBill.vendorName}</Text>
                  {selectedBill.vendorGstin && (
                    <Text style={styles.billToGstin}>GSTIN: {selectedBill.vendorGstin}</Text>
                  )}
                  <Text style={styles.detailCategory}>Category: {selectedBill.category}</Text>
                  <View style={styles.detailDatesRow}>
                    <Text style={styles.docDate}>Bill Date: {selectedBill.date}</Text>
                    {selectedBill.dueDate && <Text style={styles.docDate}>Due Date: {selectedBill.dueDate}</Text>}
                  </View>
                </View>

                <View style={styles.docTotalsBox}>
                  <View style={styles.docTotRow}>
                    <Text style={styles.docTotLabel}>Base Pre-Tax Amount:</Text>
                    <Text style={styles.docTotVal}>₹{selectedBill.baseAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.docTotRow}>
                    <Text style={styles.docTotLabel}>GST ({selectedBill.taxRate || 18}%):</Text>
                    <Text style={styles.docTotVal}>₹{selectedBill.gstAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.docTotRow}>
                    <Text style={styles.docTotLabel}>Total Bill Amount:</Text>
                    <Text style={styles.docTotVal}>₹{selectedBill.totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.docTotRow}>
                    <Text style={styles.docTotLabel}>Statutory TDS Deducted ({selectedBill.tdsCategory || '194C'}):</Text>
                    <Text style={[styles.docTotVal, { color: colors.semantic.danger }]}>
                      -₹{selectedBill.tdsAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.docTotRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>NET DISBURSEMENT PAYABLE:</Text>
                    <Text style={styles.grandTotalVal}>
                      ₹{(selectedBill.totalAmount - selectedBill.tdsAmount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.complianceBox}>
                  <Text style={styles.complianceTitle}>STATUTORY COMPLIANCE STATUS</Text>
                  <View style={styles.compItemRow}>
                    <Text style={styles.compItemLabel}>Input Tax Credit (ITC):</Text>
                    <Text
                      style={[
                        styles.compItemVal,
                        { color: selectedBill.itcEligible ? colors.semantic.success : colors.text.tertiary },
                      ]}
                    >
                      {selectedBill.itcEligible ? 'Eligible (Included in GSTR-3B)' : 'Ineligible'}
                    </Text>
                  </View>
                  <View style={styles.compItemRow}>
                    <Text style={styles.compItemLabel}>TDS Challan Deposit:</Text>
                    <Text style={styles.compItemVal}>Section {selectedBill.tdsCategory || '194C'} (Queued in TDS Register)</Text>
                  </View>
                  {selectedBill.notes && (
                    <Text style={styles.detailNotes}>Notes: {selectedBill.notes}</Text>
                  )}
                </View>

                <View style={styles.docActionButtons}>
                  {canManage && (selectedBill.status === 'Pending Approval' || selectedBill.status === 'Unpaid') && (
                    <Button
                      title="Approve Bill"
                      icon={<CheckCircle2 size={16} color="#ffffff" />}
                      onPress={() => {
                        handleApproveBill(selectedBill);
                      }}
                      style={{ flex: 1 }}
                    />
                  )}
                  {canManage && selectedBill.status === 'Approved' && (
                    <Button
                      title="Disburse Payment"
                      icon={<CreditCard size={16} color="#ffffff" />}
                      onPress={() => {
                        setSelectedBill(null);
                        openPayModal(selectedBill);
                      }}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </ScrollView>
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  billNumber: {
    ...typography.labelLarge,
    fontWeight: '700',
    color: '#B45309',
  },
  itcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itcText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  itcIneligibleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itcIneligibleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  vendorName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  categoryText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  finGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  finItem: {
    flex: 1,
  },
  finLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  finValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  datesRow: {
    gap: 2,
  },
  dateText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  approveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.success,
  },
  payBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  addHeaderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.titleMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  formContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  formSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  vendorChipsScroll: {
    flexDirection: 'row',
  },
  vendorChip: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 150,
  },
  vendorChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  vendorChipText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  vendorChipTextActive: {
    color: '#92400E',
  },
  vendorChipSub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  vendorChipSubActive: {
    color: '#B45309',
  },
  categoryPickerWrap: {
    gap: 4,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  catChipsScroll: {
    flexDirection: 'row',
  },
  catChip: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  catChipActive: {
    backgroundColor: colors.primary,
  },
  catChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  tdsToggleRow: {
    gap: 6,
  },
  tdsOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tdsBtn: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tdsBtnActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#9333EA',
  },
  tdsBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tdsBtnTextActive: {
    color: '#7E22CE',
    fontWeight: '700',
  },
  itcToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  computationBox: {
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: spacing.xs,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compLabel: {
    ...typography.bodySmall,
    color: '#92400E',
  },
  compVal: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: '#78350F',
  },
  compTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: spacing.xs,
    marginTop: 2,
  },
  compTotalLabel: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: '#92400E',
  },
  compTotalVal: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: '#92400E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  paySummaryBox: {
    backgroundColor: '#F0FDFA',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignItems: 'center',
    gap: 4,
  },
  paySummaryLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  paySummaryAmount: {
    ...typography.titleLarge,
    fontWeight: '800',
    color: colors.primary,
  },
  paySummarySub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  payModeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  payModeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  payModeBtnActive: {
    backgroundColor: colors.primary,
  },
  payModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  payModeTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  detailDocContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  detailVendorBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  billToLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  billToName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  billToGstin: {
    fontSize: 11,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  detailCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  detailDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  docDate: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  docTotalsBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  docTotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docTotLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  docTotVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    ...typography.bodyMedium,
    fontWeight: '800',
    color: colors.primary,
  },
  grandTotalVal: {
    ...typography.titleSmall,
    fontWeight: '800',
    color: colors.primary,
  },
  complianceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  complianceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  compItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compItemLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  compItemVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailNotes: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  docActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
