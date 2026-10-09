import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input } from '../../components';
import {
  ShieldCheck,
  IndianRupee,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Paperclip,
  Eye,
  History,
  Briefcase,
  Calendar,
  X,
  FileText,
} from 'lucide-react-native';

export const ExpenseReviewScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { expenses, reviewExpense, raiseExpenseQuery } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);

  const pendingExpenses = expenses.filter(
    (e) => e.status === 'Pending' || e.status === 'Queried'
  );

  const routeExpenseId = route?.params?.expenseId;
  const initialExpenseId =
    routeExpenseId ||
    (pendingExpenses.length > 0 ? pendingExpenses[0].id : expenses[0]?.id);

  const [currentExpenseId, setCurrentExpenseId] = useState<string | undefined>(initialExpenseId);

  React.useEffect(() => {
    if (route?.params?.expenseId) {
      setCurrentExpenseId(route.params.expenseId);
    }
  }, [route?.params?.expenseId]);

  const expense = expenses.find(
    (e) => e.id === currentExpenseId || e.expenseNumber === currentExpenseId
  );

  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialError, setPartialError] = useState('');

  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');
  const [queryError, setQueryError] = useState('');

  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [auditRemarks, setAuditRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!expense) {
    return (
      <View style={styles.container}>
        <AppHeader title="Audit & Review Queue" showBack onBack={() => navigation.goBack()} />
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>No pending expense claims to review.</Text>
          <Button
            title="Return to Expenses"
            variant="outline"
            style={{ marginTop: 16 }}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  const requested = Number(expense.requestedAmount || expense.amount || 0);

  const handleFullApproval = async () => {
    try {
      setIsProcessing(true);
      await reviewExpense(expense.id, {
        status: 'Approved',
        approvedAmount: requested,
        remarks: auditRemarks.trim() || 'Verified against company exploration travel policy and approved in full.',
      });

      Alert.alert(
        'Expense Claim Approved',
        `Full requested amount of ₹${requested.toLocaleString('en-IN')} approved. The claim has been forwarded to Finance for disbursement.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed to approve expense.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPartialModal = () => {
    const defaultPartial = Math.round(requested * 0.7);
    setPartialAmount(String(defaultPartial));
    setPartialError('');
    setShowPartialModal(true);
  };

  const handleConfirmPartial = async () => {
    const val = parseFloat(partialAmount);

    if (isNaN(val) || val <= 0) {
      setPartialError('Approved amount must be a positive number greater than ₹0.');
      return;
    }

    if (val > requested) {
      setPartialError(
        `Over-approval Blocked: Approved amount (₹${val.toLocaleString('en-IN')}) cannot exceed requested amount (₹${requested.toLocaleString('en-IN')}).`
      );
      return;
    }

    if (val === requested) {
      setPartialError('For full amount approval, please use the Full Approval action.');
      return;
    }

    try {
      setIsProcessing(true);
      setShowPartialModal(false);

      await reviewExpense(expense.id, {
        status: 'Partially Approved',
        approvedAmount: val,
        remarks:
          auditRemarks.trim() ||
          `Sanctioned ₹${val.toLocaleString('en-IN')} per policy tariff; balance ₹${(requested - val).toLocaleString('en-IN')} disallowed.`,
      });

      Alert.alert(
        'Partial Approval Recorded',
        `Claim sanctioned at ₹${val.toLocaleString('en-IN')}; ₹${(requested - val).toLocaleString('en-IN')} rejected as out-of-policy.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record partial approval.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenQueryModal = () => {
    setQueryMessage('');
    setQueryError('');
    setShowQueryModal(true);
  };

  const handleRaiseQuery = async () => {
    if (!queryMessage || queryMessage.trim().length < 5) {
      setQueryError('Clarification question must be at least 5 characters.');
      return;
    }

    try {
      setIsProcessing(true);
      setShowQueryModal(false);
      await raiseExpenseQuery(expense.id, queryMessage.trim());

      Alert.alert(
        'Clarification Query Dispatched',
        'Claim status set to Queried. The employee has been notified to reply with clarification.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to raise query.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject this expense claim of ₹${requested.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Claim',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await reviewExpense(expense.id, {
                status: 'Rejected',
                approvedAmount: 0,
                remarks: auditRemarks.trim() || 'Rejected during HR compliance audit.',
              });

              Alert.alert('Claim Rejected', 'Expense claim has been rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject claim.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Audit & Review"
        subtitle={`Claim #${expense.expenseNumber || expense.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {pendingExpenses.length > 1 && (
        <View style={styles.queueContainer}>
          <Text style={styles.queueLabel}>
            Audit Queue ({Math.max(1, pendingExpenses.findIndex((p) => p.id === expense.id) + 1)} of {pendingExpenses.length}):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.queueScroll}>
            {pendingExpenses.map((pe) => {
              const isSelected = pe.id === expense.id;
              return (
                <TouchableOpacity
                  key={pe.id}
                  onPress={() => setCurrentExpenseId(pe.id)}
                  style={[styles.queueChip, isSelected && styles.queueChipActive]}
                >
                  <Text style={[styles.queueChipText, isSelected && styles.queueChipTextActive]}>
                    #{pe.expenseNumber || pe.id} • {pe.employeeName?.split(' ')[0]} (₹{Number(pe.requestedAmount || pe.amount || 0).toLocaleString('en-IN')})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.empTitle}>{expense.employeeName}</Text>
              <Text style={styles.deptText}>
                {expense.department} • {expense.employeeId}
              </Text>
            </View>
            <StatusBadge status={expense.status} size="small" />
          </View>

          <View style={styles.metaRow}>
            <Calendar size={13} color={colors.text.secondary} />
            <Text style={styles.metaText}>Incurred Date: {expense.date}</Text>
          </View>

          <View style={styles.metaRow}>
            <Briefcase size={13} color={colors.text.secondary} />
            <Text style={styles.metaText}>Project: {expense.project}</Text>
          </View>

          <Text style={styles.categoryBadge}>{expense.category}</Text>

          <View style={styles.descBox}>
            <Text style={styles.descLabel}>EMPLOYEE JUSTIFICATION:</Text>
            <Text style={styles.descText}>{expense.description}</Text>
          </View>

          <View style={styles.amountGrid}>
            <View style={styles.amtCol}>
              <Text style={styles.amtLabel}>REQUESTED</Text>
              <Text style={styles.amtVal}>₹{requested.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.amtCol}>
              <Text style={[styles.amtLabel, { color: colors.semantic.success }]}>APPROVED</Text>
              <Text style={[styles.amtVal, { color: colors.semantic.success }]}>
                ₹{Number(expense.approvedAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.amtCol}>
              <Text style={[styles.amtLabel, { color: colors.semantic.error }]}>REJECTED</Text>
              <Text style={[styles.amtVal, { color: colors.semantic.error }]}>
                ₹{Number(expense.rejectedAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {expense.receiptFileName ? (
            <TouchableOpacity
              style={styles.receiptButton}
              onPress={() => setShowReceiptModal(true)}
            >
              <Paperclip size={15} color={colors.primary} />
              <Text style={styles.receiptBtnText} numberOfLines={1}>
                View Receipt: {expense.receiptFileName}
              </Text>
              <Eye size={15} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.noReceiptBox}>
              <Text style={styles.noReceiptText}>No receipt attached by employee</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>HR Auditor Remarks</Text>
          <Input
            placeholder="Enter reason for approval, partial approval deductions, or rejection..."
            value={auditRemarks}
            onChangeText={setAuditRemarks}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actionGrid}>
            <Button
              title="Full Approval"
              variant="primary"
              loading={isProcessing}
              onPress={handleFullApproval}
              style={{ backgroundColor: colors.semantic.success }}
            />

            <Button
              title="Partial Approval"
              variant="outline"
              loading={isProcessing}
              onPress={handleOpenPartialModal}
            />

            <Button
              title="Raise Clarification Query"
              variant="secondary"
              loading={isProcessing}
              onPress={handleOpenQueryModal}
            />

            <Button
              title="Reject Claim Entirely"
              variant="outline"
              loading={isProcessing}
              onPress={handleReject}
              style={{ borderColor: colors.semantic.error }}
            />
          </View>
        </Card>

        {Array.isArray(expense.auditHistory) && expense.auditHistory.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.historyHead}>
              <History size={16} color={colors.text.secondary} />
              <Text style={styles.sectionTitle}>Audit Trail History</Text>
            </View>

            {expense.auditHistory.map((a, idx) => (
              <View key={a.id || idx} style={styles.historyItem}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyAction}>{a.action}</Text>
                  <Text style={styles.historyMeta}>
                    {a.actor} • {new Date(a.timestamp).toLocaleDateString('en-CA')}
                  </Text>
                  {a.details ? <Text style={styles.historyDetails}>{a.details}</Text> : null}
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Modal visible={showPartialModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Partial Amount Approval</Text>
            <Text style={styles.modalSub}>
              Requested Amount: ₹{requested.toLocaleString('en-IN')}
            </Text>

            {partialError ? (
              <View style={styles.modalErrorBox}>
                <AlertTriangle size={15} color={colors.semantic.error} />
                <Text style={styles.modalErrorText}>{partialError}</Text>
              </View>
            ) : null}

            <Input
              label="Approved Payable Amount (INR ₹)"
              placeholder="e.g. 6000"
              keyboardType="numeric"
              value={partialAmount}
              onChangeText={(val) => {
                setPartialAmount(val);
                setPartialError('');
              }}
              leftIcon={<IndianRupee size={16} color={colors.text.secondary} />}
            />

            {parseFloat(partialAmount) > 0 && parseFloat(partialAmount) <= requested && (
              <View style={styles.deductionPreview}>
                <Text style={styles.deductLabel}>Disallowed / Deducted Amount:</Text>
                <Text style={styles.deductVal}>
                  ₹{(requested - parseFloat(partialAmount)).toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowPartialModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Partial"
                variant="primary"
                onPress={handleConfirmPartial}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showQueryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Raise Clarification Query</Text>
            <Text style={styles.modalSub}>
              Claim status will transition to 'Queried' and await staff reply.
            </Text>

            {queryError ? (
              <View style={styles.modalErrorBox}>
                <AlertTriangle size={15} color={colors.semantic.error} />
                <Text style={styles.modalErrorText}>{queryError}</Text>
              </View>
            ) : null}

            <Input
              label="Question / Clarification Required (Min 5 chars) *"
              placeholder="e.g. Please provide GST tax breakdown invoice for hotel stay..."
              value={queryMessage}
              onChangeText={(val) => {
                setQueryMessage(val);
                setQueryError('');
              }}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowQueryModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Send Query"
                variant="primary"
                onPress={handleRaiseQuery}
                style={{ flex: 1, backgroundColor: colors.semantic.warning }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReceiptModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.receiptHead}>
              <Text style={styles.modalHeading}>Receipt Verification</Text>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptViewerBox}>
              <FileText size={48} color={colors.primary} />
              <Text style={styles.receiptViewerName}>{expense.receiptFileName}</Text>
              <Text style={styles.receiptViewerMeta}>
                Claim #{expense.expenseNumber || expense.id} • ₹{requested.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.receiptVerifiedBadge}>✓ Scanned Proof Attached</Text>
            </View>

            <Button
              title="Close"
              variant="secondary"
              onPress={() => setShowReceiptModal(false)}
              style={{ marginTop: spacing.md }}
            />
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
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
  },
  notFoundBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  empTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  deptText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  categoryBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d9488',
    marginTop: spacing.xs,
  },
  descBox: {
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: 14,
    color: '#0f172a',
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  amountGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.sm,
    padding: 12,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amtCol: {
    flex: 1,
    alignItems: 'center',
  },
  amtLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  amtVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primary}12`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  receiptBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  noReceiptBox: {
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  noReceiptText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  actionGrid: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  historyAction: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  historyMeta: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  historyDetails: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 420,
    padding: spacing.md,
  },
  modalHeading: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.semantic.error}15`,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  modalErrorText: {
    fontSize: 11,
    color: colors.semantic.error,
    fontWeight: '600',
    flex: 1,
  },
  deductionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: `${colors.semantic.error}10`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  deductLabel: {
    ...typography.caption,
    color: colors.semantic.error,
    fontWeight: '600',
  },
  deductVal: {
    ...typography.caption,
    color: colors.semantic.error,
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  receiptHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  receiptViewerBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  receiptViewerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  receiptViewerMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  receiptVerifiedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.success,
    marginTop: spacing.sm,
  },
  queueContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  queueLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  queueScroll: {
    gap: 8,
  },
  queueChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  queueChipActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  queueChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  queueChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
