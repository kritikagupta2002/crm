import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input } from '../../components';
import {
  IndianRupee,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CreditCard,
  Building,
} from 'lucide-react-native';

export const ExpenseSettlementScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { expenses, settleExpense } = useHrms();
  const { session, hasRole } = useAuth();

  const isAccountantOrAdmin = hasRole(['Admin', 'Accountant']);

  const approvedExpenses = expenses.filter(
    (e) => e.status === 'Approved' || e.status === 'Partially Approved'
  );
  const routeExpenseId = route?.params?.expenseId;
  const initialExpenseId =
    routeExpenseId ||
    (approvedExpenses.length > 0 ? approvedExpenses[0].id : expenses[0]?.id);

  const [currentExpenseId, setCurrentExpenseId] = useState<string | undefined>(initialExpenseId);

  React.useEffect(() => {
    if (route?.params?.expenseId) {
      setCurrentExpenseId(route.params.expenseId);
    }
  }, [route?.params?.expenseId]);

  const expense = expenses.find((e) => e.id === currentExpenseId || e.expenseNumber === currentExpenseId);

  const [utrRef, setUtrRef] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI' | 'Cheque'>('Bank Transfer');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSettling, setIsSettling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!expense) {
    return (
      <View style={styles.container}>
        <AppHeader title="Finance Settlement" showBack onBack={() => navigation.goBack()} />
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>No expense claims pending finance settlement.</Text>
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

  const payableAmount = Number(expense.approvedAmount || expense.hrApprovedAmount || 0);
  const paymentModes: ('Bank Transfer' | 'UPI' | 'Cheque')[] = ['Bank Transfer', 'UPI', 'Cheque'];

  const handleDisburse = async () => {
    setErrorMessage('');

    if (expense.status !== 'Approved' && expense.status !== 'Partially Approved') {
      setErrorMessage(`Cannot settle claim with status '${expense.status}'. Claim must be Approved by HR first.`);
      return;
    }

    if (payableAmount <= 0) {
      setErrorMessage('Cannot settle a claim with ₹0 sanctioned amount.');
      return;
    }

    if (!utrRef || utrRef.trim().length < 4) {
      setErrorMessage('Valid Disbursement Reference / UTR is required (at least 4 characters).');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (!settlementDate || settlementDate > today) {
      setErrorMessage('Settlement date is required and cannot be in the future.');
      return;
    }

    try {
      setIsSettling(true);
      await settleExpense(expense.id, {
        settlementReference: utrRef.trim(),
        paymentMode,
        settlementDate,
        settledBy: session?.accountType === 'team' ? (session as any).name : 'Finance Officer',
      });

      Alert.alert(
        'Disbursement Executed & Settled',
        `₹${payableAmount.toLocaleString('en-IN')} disbursed to ${expense.employeeName} via ${paymentMode} (UTR: ${utrRef.trim()}). Automated Payment Voucher posted to the Finance Ledger.`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while settling expense claim.');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Finance Settlement"
        subtitle={`Claim #${expense.expenseNumber || expense.id}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {errorMessage ? (
          <View style={styles.errorAlert}>
            <AlertCircle size={16} color={colors.semantic.error} />
            <Text style={styles.errorAlertText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.empTitle}>{expense.employeeName}</Text>
              <Text style={styles.metaText}>
                {expense.department} • {expense.project}
              </Text>
            </View>
            <StatusBadge status={expense.status} size="small" />
          </View>

          <Text style={styles.categoryBadge}>{expense.category}</Text>

          <View style={styles.finGrid}>
            <View style={styles.finBox}>
              <Text style={styles.finLabel}>CLAIMED AMOUNT</Text>
              <Text style={styles.finValue}>
                ₹{Number(expense.requestedAmount || expense.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.finBox, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.finLabel, { color: colors.primary }]}>SANCTIONED PAYABLE</Text>
              <Text style={[styles.finValue, { color: colors.primary }]}>
                ₹{payableAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <Text style={styles.justification} numberOfLines={2}>
            Purpose: {expense.description}
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.bankHeader}>
            <Banknote size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Disbursement Details</Text>
          </View>

          <Text style={styles.fieldLabel}>Payment Mode *</Text>
          <View style={styles.modeChips}>
            {paymentModes.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, paymentMode === mode && styles.modeChipActive]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text style={[styles.modeChipText, paymentMode === mode && styles.modeChipTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Disbursement Reference / UTR Number *"
            placeholder="e.g. UTR-HDFC-994182410"
            value={utrRef}
            onChangeText={(val) => {
              setUtrRef(val);
              setErrorMessage('');
            }}
            leftIcon={<CreditCard size={16} color={colors.text.secondary} />}
          />

          <Input
            label="Disbursement Settlement Date (YYYY-MM-DD) *"
            placeholder="YYYY-MM-DD"
            value={settlementDate}
            onChangeText={(val) => {
              setSettlementDate(val);
              setErrorMessage('');
            }}
            leftIcon={<Calendar size={16} color={colors.text.secondary} />}
          />

          <View style={styles.ledgerPreviewBox}>
            <Text style={styles.ledgerHeading}>FINANCE LEDGER VOUCHER PREVIEW</Text>
            <Text style={styles.ledgerSub}>
              Double-entry voucher will be recorded upon settlement:
            </Text>

            <View style={styles.ledgerRow}>
              <Text style={[styles.drCrTag, { backgroundColor: `${colors.semantic.error}15`, color: colors.semantic.error }]}>
                DR
              </Text>
              <Text style={styles.ledgerAccount} numberOfLines={1}>
                5001 - Field Exploration Direct Expense ({expense.category})
              </Text>
              <Text style={styles.ledgerAmt}>₹{payableAmount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.ledgerRow}>
              <Text style={[styles.drCrTag, { backgroundColor: `${colors.semantic.success}15`, color: colors.semantic.success }]}>
                CR
              </Text>
              <Text style={styles.ledgerAccount} numberOfLines={1}>
                1002 - HDFC Bank Corporate A/c ({paymentMode})
              </Text>
              <Text style={styles.ledgerAmt}>₹{payableAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Button
            title={`Disburse & Settle ₹${payableAmount.toLocaleString('en-IN')}`}
            variant="primary"
            loading={isSettling}
            onPress={handleDisburse}
            style={{ marginTop: spacing.md }}
          />
        </Card>
      </ScrollView>
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
    ...typography.h3,
    color: colors.text.primary,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  categoryBadge: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  finGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  finBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  finValue: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  justification: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  modeChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ledgerPreviewBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ledgerHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  ledgerSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  drCrTag: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ledgerAccount: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
  ledgerAmt: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.semantic.error}15`,
    borderColor: `${colors.semantic.error}40`,
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorAlertText: {
    ...typography.caption,
    color: colors.semantic.error,
    fontWeight: '600',
    flex: 1,
  },
});
