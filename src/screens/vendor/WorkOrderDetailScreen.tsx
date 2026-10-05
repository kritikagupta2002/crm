import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  X,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { WorkOrderStage } from '../../types';

interface WorkOrderDetailScreenProps {
  route: { params: { woId: string } };
  navigation: any;
}

export const WorkOrderDetailScreen: React.FC<WorkOrderDetailScreenProps> = ({ route, navigation }) => {
  const { woId } = route.params;
  const {
    workOrders,
    startWorkOrder,
    deliverWorkOrder,
    billWorkOrder,
    checkWorkOrderBill,
    payWorkOrder,
  } = useCrm();
  const { role, session } = useAuth();

  const isAccountant = (role as any) === 'accountant' || (role as any) === 'director' || (role as any) === 'admin';
  const isDirector = (role as any) === 'director' || (role as any) === 'admin';

  const wo = workOrders.find((w) => w.id === woId || w.woNumber === woId);

  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [deliveryFiles] = useState<Array<{ name: string; size: number }>>([
    { name: 'Drilling_Core_Lithology_Log.pdf', size: 2400000 },
    { name: 'Field_Survey_Sheets_Attested.pdf', size: 1800000 },
  ]);

  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [billNo, setBillNo] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [billNotes, setBillNotes] = useState<string>('');

  const [showCheckModal, setShowCheckModal] = useState<boolean>(false);
  const [checkDecision, setCheckDecision] = useState<'approved' | 'returned'>('approved');
  const [checkRemarks, setCheckRemarks] = useState<string>('');

  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [utrRef, setUtrRef] = useState<string>('');
  const [selectedTdsSection, setSelectedTdsSection] = useState<string>('194C');
  const [selectedTdsRate, setSelectedTdsRate] = useState<number>(0.02);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!wo) {
    return (
      <ScreenContainer
        scrollable={false}
        header={<AppHeader title="Work Order" showBack onBack={() => navigation.goBack()} />}
      >
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Work Order not found.</Text>
          <Button title="Back to Orders" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  const STAGES: WorkOrderStage[] = ['Issued', 'Started', 'Delivered', 'Billed', 'Verified', 'Paid'];
  const currentStageIdx = STAGES.indexOf(wo.currentStage);

  const contractVal = wo.contractValue || wo.amount || 0;
  const billedVal = wo.billedAmount || (wo.bill ? wo.bill.amount : 0);
  const paidVal = wo.paidAmount || (wo.payment ? wo.payment.gross : 0);
  const unbilledCeiling = Math.max(0, contractVal - billedVal);

  const handleStartWork = async () => {
    Alert.alert(
      'Confirm Contractor Mobilization',
      `Confirm that ${wo.vendorName} has deployed equipment and mobilized staff on site?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Start',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await startWorkOrder(wo.id, 'Contractor mobilized rigs and survey instruments on site.');
              Alert.alert('Status Updated', 'Work Order transitioned to "Started". Field operations in progress.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleExecuteDelivery = async () => {
    if (!deliveryNotes.trim()) {
      Alert.alert('Completion Notes Required', 'Please provide a summary of completed field deliverables.');
      return;
    }

    try {
      setIsProcessing(true);
      await deliverWorkOrder(wo.id, {
        notes: deliveryNotes.trim(),
        files: deliveryFiles,
      });
      setShowDeliveryModal(false);
      setDeliveryNotes('');
      Alert.alert('Delivery Logged', 'Work Order transitioned to "Delivered". Delivery report recorded.');
    } catch (e: any) {
      Alert.alert('Delivery Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteBill = async () => {
    const amt = Number(billAmount);
    if (!billNo.trim() || !amt || amt <= 0) {
      Alert.alert('Invalid Invoice', 'Please provide a valid bill reference number and positive invoice amount.');
      return;
    }

    if (amt > unbilledCeiling + 0.01) {
      Alert.alert(
        'Ceiling Exceeded',
        `Invoice amount (${formatCurrency(amt)}) exceeds remaining unbilled contract ceiling of ${formatCurrency(unbilledCeiling)}.`
      );
      return;
    }

    try {
      setIsProcessing(true);
      await billWorkOrder(wo.id, {
        billNo: billNo.trim(),
        amount: amt,
        tdsRate: selectedTdsRate,
        notes: billNotes.trim(),
      });
      setShowBillModal(false);
      setBillNo('');
      setBillAmount('');
      Alert.alert('Bill Recorded', 'Invoice submitted into 3-way reconciliation queue.');
    } catch (e: any) {
      Alert.alert('Billing Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCheck = async () => {
    if (checkDecision === 'returned' && !checkRemarks.trim()) {
      Alert.alert('Reason Required', 'Please enter specific discrepancy reasons for returning the bill to the vendor.');
      return;
    }

    try {
      setIsProcessing(true);
      await checkWorkOrderBill(wo.id, checkDecision, {
        note: checkRemarks.trim() || (checkDecision === 'approved' ? 'Matched with field survey logs' : 'Billing rate mismatch'),
        actorName: (session as any)?.name || 'Accountant',
      });
      setShowCheckModal(false);
      setCheckRemarks('');
      if (checkDecision === 'approved') {
        Alert.alert('3-Way Match Verified', 'Bill approved. Ready for payment disbursement.');
      } else {
        Alert.alert('Bill Returned', 'Bill returned to vendor. Stage reverted to Delivered waiting for corrected invoice.');
      }
    } catch (e: any) {
      Alert.alert('Verification Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!utrRef.trim()) {
      Alert.alert('UTR Required', 'Please enter the bank electronic transfer UTR reference.');
      return;
    }

    try {
      setIsProcessing(true);
      await payWorkOrder(wo.id, {
        utrRef: utrRef.trim(),
        tdsRate: selectedTdsRate,
        tdsSection: selectedTdsSection,
        actorName: (session as any)?.name || 'Finance Officer',
      });
      setShowPayModal(false);
      setUtrRef('');
      Alert.alert('Disbursement Recorded', 'Payment released! Finance payment voucher generated.');
    } catch (e: any) {
      Alert.alert('Payment Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={wo.woNumber || wo.id}
          subtitle={`Subcontract: ${wo.vendorName}`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.woBadge}>{wo.woNumber || wo.id}</Text>
          <StatusBadge status={wo.currentStage} size="small" />
        </View>

        <Text style={styles.woTitle}>{wo.projectTitle}</Text>
        <Text style={styles.vendorText}>Contractor: {wo.vendorName || wo.vendor}</Text>
        {wo.work && <Text style={styles.scopeText}>{wo.work}</Text>}

        <View style={styles.finGrid}>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>CONTRACT CEILING</Text>
            <Text style={styles.finVal}>{formatCurrency(contractVal)}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>TOTAL BILLED</Text>
            <Text style={styles.finVal}>{formatCurrency(billedVal)}</Text>
          </View>
          <View style={styles.finItem}>
            <Text style={styles.finLabel}>TOTAL PAID</Text>
            <Text style={[styles.finVal, { color: colors.success }]}>{formatCurrency(paidVal)}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.stepperCard}>
        <Text style={styles.sectionTitle}>Milestone Lifecycle Progress</Text>
        <View style={styles.stepperRow}>
          {STAGES.map((s, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <View key={s} style={styles.stepCol}>
                <View
                  style={[
                    styles.stepNode,
                    isDone && styles.stepNodeDone,
                    isCurrent && styles.stepNodeCurrent,
                  ]}
                >
                  {isDone ? (
                    <Check size={12} color={colors.surface} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNodeText,
                        isCurrent && styles.stepNodeTextCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    isDone && styles.stepLabelDone,
                  ]}
                >
                  {s}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={styles.actionPromptCard}>
        <View style={styles.promptHeader}>
          <ShieldCheck size={20} color={colors.primary} />
          <Text style={styles.promptTitle}>Stage Action Required: {wo.currentStage}</Text>
        </View>

        {wo.currentStage === 'Issued' && (
          <View style={styles.stageActionBody}>
            <Text style={styles.promptDesc}>
              Work order has been formally allotted. Waiting for vendor mobilization and commencement on site.
            </Text>
            <Button
              title="Confirm Contractor Start / Mobilization"
              variant="primary"
              loading={isProcessing}
              onPress={handleStartWork}
            />
          </View>
        )}

        {wo.currentStage === 'Started' && (
          <View style={styles.stageActionBody}>
            <Text style={styles.promptDesc}>
              Subcontract execution in progress in the field. When contractor completes tasks, upload completion reports.
            </Text>
            <Button
              title="Submit Work Delivery & Attachments"
              variant="primary"
              onPress={() => setShowDeliveryModal(true)}
            />
          </View>
        )}

        {wo.currentStage === 'Delivered' && (
          <View style={styles.stageActionBody}>
            <Text style={styles.promptDesc}>
              Field work delivered and completion logs attached. Ready for contractor milestone invoice.
            </Text>
            <Text style={styles.unbilledHint}>
              Remaining Unbilled Contract Ceiling: <Text style={{ fontWeight: 'bold' }}>{formatCurrency(unbilledCeiling)}</Text>
            </Text>
            <Button
              title="Submit Milestone Bill"
              variant="primary"
              onPress={() => setShowBillModal(true)}
            />
          </View>
        )}

        {wo.currentStage === 'Billed' && (
          <View style={styles.stageActionBody}>
            <Text style={styles.promptDesc}>
              Invoice {wo.bill?.no} (₹{wo.bill?.amount.toLocaleString('en-IN')}) received. 3-way reconciliation against delivery reports required.
            </Text>
            {isAccountant ? (
              <Button
                title="Perform 3-Way Reconciliation Check"
                variant="primary"
                onPress={() => setShowCheckModal(true)}
              />
            ) : (
              <Text style={styles.roleNotice}>
                Accounts authorization required to verify and reconcile this bill.
              </Text>
            )}
          </View>
        )}

        {wo.currentStage === 'Verified' && (
          <View style={styles.stageActionBody}>
            <Text style={styles.promptDesc}>
              Invoice verified against scope and delivery. Ready for statutory TDS deduction and electronic bank remittance.
            </Text>
            {isAccountant ? (
              <Button
                title="Disburse Payment & Record UTR"
                variant="primary"
                onPress={() => setShowPayModal(true)}
              />
            ) : (
              <Text style={styles.roleNotice}>
                Finance disbursement authorization required.
              </Text>
            )}
          </View>
        )}

        {wo.currentStage === 'Paid' && (
          <View style={styles.stageActionBody}>
            <View style={styles.paidSuccessRow}>
              <CheckCircle2 size={24} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paidTitle}>Disbursement Complete</Text>
                <Text style={styles.paidSub}>
                  UTR: {wo.payment?.ref || 'N/A'} • Gross: ₹{wo.payment?.gross.toLocaleString('en-IN')} • TDS ({wo.payment?.tds.section}): ₹{wo.payment?.tds.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Card>

      {wo.delivery && (
        <Card style={styles.infoCard}>
          <Text style={styles.cardHeading}>Field Delivery Proofs</Text>
          <View style={styles.detailRow}>
            <Text style={styles.dLabel}>Delivery Date</Text>
            <Text style={styles.dVal}>{wo.delivery.on}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.dLabel}>Submitted By</Text>
            <Text style={styles.dVal}>{wo.delivery.by}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.dLabel}>Completion Notes</Text>
            <Text style={styles.dVal}>{wo.delivery.note}</Text>
          </View>

          {wo.delivery.files && wo.delivery.files.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.dLabel}>ATTACHED PROOFS</Text>
              {wo.delivery.files.map((f: any, i: number) => (
                <View key={i} style={styles.fileRow}>
                  <FileText size={16} color={colors.primary} />
                  <Text style={styles.fileName}>{f.name}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {(wo.bill || (wo.returned && wo.returned.length > 0)) && (
        <Card style={styles.infoCard}>
          <Text style={styles.cardHeading}>Billing & Reconciliation History</Text>
          {wo.bill && (
            <View style={styles.activeBillBox}>
              <View style={styles.billHeader}>
                <Text style={styles.billNoText}>Invoice {wo.bill.no}</Text>
                <Text style={styles.billAmtText}>₹{wo.bill.amount.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.billDateText}>Invoiced on {wo.bill.date} by {wo.bill.by}</Text>
              {wo.check && (
                <View style={styles.checkBadge}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={styles.checkBadgeText}>Verified by {wo.check.by}</Text>
                </View>
              )}
            </View>
          )}

          {wo.returned && wo.returned.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.dLabel}>RETURNED / DISCREPANCY BILLS</Text>
              {wo.returned.map((r, i) => (
                <View key={i} style={styles.returnedBillItem}>
                  <RotateCcw size={16} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.returnedTitle}>Invoice {r.no} Returned on {r.returnedOn}</Text>
                    <Text style={styles.returnedReason}>{r.reason}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {wo.history && wo.history.length > 0 && (
        <Card style={styles.infoCard}>
          <Text style={styles.cardHeading}>Subcontract Audit Trail</Text>
          {wo.history.map((h, i) => (
            <View key={i} style={styles.trailItem}>
              <View style={styles.trailDot} />
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <Text style={styles.trailAction}>{h.action}</Text>
                <Text style={styles.trailMeta}>
                  {h.at?.slice(0, 10)} by {h.by}
                  {h.note ? ` — ${h.note}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {showDeliveryModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Record Work Delivery</Text>
                <TouchableOpacity onPress={() => setShowDeliveryModal(false)}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <Text style={styles.fieldLabel}>COMPLETION NOTES / DRILLING FOOTAGE *</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                  placeholder="e.g. Completed 4 boreholes to 250m depth with 94% core recovery..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                />

                <Text style={styles.fieldLabel}>ATTACHED COMPLETION SHEETS</Text>
                {deliveryFiles.map((f, i) => (
                  <View key={i} style={styles.fileChip}>
                    <FileText size={16} color={colors.primary} />
                    <Text style={styles.fileChipText}>{f.name}</Text>
                  </View>
                ))}

                <View style={styles.btnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => setShowDeliveryModal(false)}
                  />
                  <Button
                    title={isProcessing ? 'Submitting...' : 'Confirm Delivery'}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={isProcessing}
                    onPress={handleExecuteDelivery}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showBillModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Submit Milestone Invoice</Text>
                <TouchableOpacity onPress={() => setShowBillModal(false)}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.ceilingNotice}>
                  <Text style={styles.ceilingNoticeText}>
                    Remaining Unbilled Ceiling: {formatCurrency(unbilledCeiling)}
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>INVOICE / BILL NUMBER *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. INV-BGSPL-2026-042"
                  placeholderTextColor={colors.textMuted}
                  value={billNo}
                  onChangeText={setBillNo}
                />

                <Text style={styles.fieldLabel}>BILL AMOUNT (EXCLUDING GST) (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`Max ₹${unbilledCeiling}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={billAmount}
                  onChangeText={setBillAmount}
                />

                <Text style={styles.fieldLabel}>REMARKS / MILESTONE DESCRIPTION</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Milestone 1 — 50% mobilization & first 500m core recovery"
                  placeholderTextColor={colors.textMuted}
                  value={billNotes}
                  onChangeText={setBillNotes}
                />

                <View style={styles.btnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => setShowBillModal(false)}
                  />
                  <Button
                    title={isProcessing ? 'Submitting...' : 'Submit Invoice'}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={isProcessing}
                    onPress={handleExecuteBill}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showCheckModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.centerBackdrop}>
            <Card style={styles.centerCard}>
              <Text style={styles.sheetTitle}>3-Way Reconciliation Check</Text>
              <Text style={styles.reconcileSub}>
                Reconcile Contract WO #{wo.woNumber} vs Delivery Report vs Invoice #{wo.bill?.no} (₹{wo.bill?.amount.toLocaleString('en-IN')}).
              </Text>

              <View style={styles.decisionChoiceRow}>
                <TouchableOpacity
                  style={[
                    styles.choiceChip,
                    checkDecision === 'approved' && styles.choiceChipApproved,
                  ]}
                  onPress={() => setCheckDecision('approved')}
                >
                  <CheckCircle2 size={16} color={checkDecision === 'approved' ? colors.successText : colors.textMuted} />
                  <Text style={[styles.choiceText, checkDecision === 'approved' && styles.choiceTextApproved]}>
                    Match Verified (Approve)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceChip,
                    checkDecision === 'returned' && styles.choiceChipReturned,
                  ]}
                  onPress={() => setCheckDecision('returned')}
                >
                  <RotateCcw size={16} color={checkDecision === 'returned' ? colors.dangerText : colors.textMuted} />
                  <Text style={[styles.choiceText, checkDecision === 'returned' && styles.choiceTextReturned]}>
                    Discrepancy (Return Bill)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>
                {checkDecision === 'approved' ? 'VERIFICATION NOTES' : 'DISCREPANCY GROUNDS *'}
              </Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder={
                  checkDecision === 'approved'
                    ? 'Field log coordinates and footage match contract quantities...'
                    : 'Borehole footage claimed in bill exceeds confirmed survey logs...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                value={checkRemarks}
                onChangeText={setCheckRemarks}
              />

              <View style={styles.btnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setShowCheckModal(false)}
                />
                <Button
                  title={isProcessing ? 'Processing...' : 'Confirm Action'}
                  variant={checkDecision === 'approved' ? 'primary' : 'danger'}
                  style={{ flex: 1 }}
                  disabled={isProcessing}
                  onPress={handleExecuteCheck}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}

      {showPayModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Disburse Electronic Payment</Text>
                <TouchableOpacity onPress={() => setShowPayModal(false)}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.tdsSummaryBox}>
                  <View style={styles.tdsRow}>
                    <Text style={styles.tdsLabel}>Gross Bill Amount</Text>
                    <Text style={styles.tdsVal}>₹{(wo.bill?.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.tdsRow}>
                    <Text style={styles.tdsLabel}>
                      TDS Section {selectedTdsSection} ({(selectedTdsRate * 100).toFixed(1)}%)
                    </Text>
                    <Text style={[styles.tdsVal, { color: colors.danger }]}>
                      - ₹{Math.round((wo.bill?.amount || 0) * selectedTdsRate).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={[styles.tdsRow, styles.tdsTotalRow]}>
                    <Text style={styles.tdsTotalLabel}>Net Electronic Payable</Text>
                    <Text style={styles.tdsTotalVal}>
                      ₹{Math.round((wo.bill?.amount || 0) * (1 - selectedTdsRate)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>TDS STATUTORY SECTION</Text>
                <View style={styles.tdsSectionRow}>
                  {['194C', '194J'].map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.secChip, selectedTdsSection === sec && styles.secChipActive]}
                      onPress={() => {
                        setSelectedTdsSection(sec);
                        setSelectedTdsRate(sec === '194C' ? 0.02 : 0.1);
                      }}
                    >
                      <Text style={[styles.secChipText, selectedTdsSection === sec && styles.secChipTextActive]}>
                        Section {sec} {sec === '194C' ? '(Contractor 2%)' : '(Technical 10%)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>BANK TRANSACTION UTR NUMBER *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. HDFC202610020084729"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={utrRef}
                  onChangeText={setUtrRef}
                />

                <View style={styles.btnRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => setShowPayModal(false)}
                  />
                  <Button
                    title={isProcessing ? 'Disbursing...' : 'Confirm Remittance'}
                    variant="primary"
                    style={{ flex: 1 }}
                    disabled={isProcessing}
                    onPress={handleExecutePayment}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  woBadge: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  woTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  vendorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginBottom: 2,
  },
  scopeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  finGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  finItem: {
    flex: 1,
  },
  finLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  finVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  stepperCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNodeDone: {
    backgroundColor: colors.success,
  },
  stepNodeCurrent: {
    backgroundColor: colors.primary,
  },
  stepNodeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.bold,
  },
  stepNodeTextCurrent: {
    color: colors.surface,
  },
  stepLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  stepLabelDone: {
    color: colors.successText,
  },
  actionPromptCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  promptTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  stageActionBody: {
    marginTop: spacing.xs,
  },
  promptDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  unbilledHint: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  roleNotice: {
    fontSize: typography.fontSizes.xs,
    color: colors.warningText,
    fontStyle: 'italic',
  },
  paidSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paidTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.successText,
  },
  paidSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeading: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  dLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    width: 120,
  },
  dVal: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  fileName: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
  },
  activeBillBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  billNoText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  billAmtText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  billDateText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  checkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  checkBadgeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.successText,
    fontWeight: typography.fontWeights.semibold,
  },
  returnedBillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: 4,
  },
  returnedTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.dangerText,
  },
  returnedReason: {
    fontSize: typography.fontSizes.xxs,
    color: colors.dangerText,
    marginTop: 1,
  },
  trailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  trailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  trailAction: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  trailMeta: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  sheetContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: 4,
  },
  fileChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ceilingNotice: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  ceilingNoticeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  centerCard: {
    width: '100%',
    padding: spacing.lg,
  },
  reconcileSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  decisionChoiceRow: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  choiceChipApproved: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  choiceChipReturned: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
  choiceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  choiceTextApproved: {
    color: colors.successText,
    fontWeight: typography.fontWeights.bold,
  },
  choiceTextReturned: {
    color: colors.dangerText,
    fontWeight: typography.fontWeights.bold,
  },
  tdsSummaryBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
  },
  tdsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tdsLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  tdsVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  tdsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 6,
    marginTop: 2,
  },
  tdsTotalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  tdsTotalVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.heavy,
    color: colors.success,
  },
  tdsSectionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  secChip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  secChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  secChipText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
  },
  secChipTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeights.bold,
  },
});
