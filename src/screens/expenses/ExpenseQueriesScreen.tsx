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
import { ExpenseQuery } from '../../types';
import {
  MessageSquare,
  CheckCircle2,
  CornerDownRight,
  User,
  ShieldCheck,
  Calendar,
  AlertCircle,
  X,
  Clock,
} from 'lucide-react-native';

export const ExpenseQueriesScreen: React.FC<{ route?: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { queries, respondExpenseQuery, expenses } = useHrms();
  const { session, hasRole } = useAuth();

  const expenseIdFilter = route?.params?.expenseId;
  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';

  const [selectedQuery, setSelectedQuery] = useState<ExpenseQuery | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [responseError, setResponseError] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const accessibleQueries = useMemo(() => {
    let list = queries;
    if (!isHrOrAdmin) {
      list = list.filter((q) => q.employeeId === activeEmpId);
    }
    if (expenseIdFilter) {
      list = list.filter(
        (q) => q.expenseId === expenseIdFilter || q.id === expenseIdFilter
      );
    }
    return list;
  }, [queries, isHrOrAdmin, activeEmpId, expenseIdFilter]);

  const handleOpenReplyModal = (item: ExpenseQuery) => {
    setSelectedQuery(item);
    setResponseMsg('');
    setResponseError('');
  };

  const handleResolve = async () => {
    if (!selectedQuery) return;

    if (!responseMsg || responseMsg.trim().length < 3) {
      setResponseError('Clarification response must be at least 3 characters.');
      return;
    }

    try {
      setIsReplying(true);
      await respondExpenseQuery(selectedQuery.id, responseMsg.trim());

      setSelectedQuery(null);
      setResponseMsg('');
      setResponseError('');

      Alert.alert(
        'Clarification Submitted',
        'Your response has been appended to the claim. The claim status has returned to Pending for HR re-audit without creating a duplicate record.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      setResponseError(err.message || 'Failed to submit clarification response.');
    } finally {
      setIsReplying(false);
    }
  };

  const renderQueryCard = ({ item }: { item: ExpenseQuery }) => {
    const parentExpense = expenses.find(
      (e) => e.id === item.expenseId || e.expenseNumber === item.expenseId
    );
    const isOwner = item.employeeId === activeEmpId;
    const isResolved = item.status === 'Resolved' || Boolean(item.responseMessage);

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerRefWrap}>
            <MessageSquare size={16} color={colors.primary} />
            <Text style={styles.claimRef}>
              Claim #{parentExpense?.expenseNumber || item.expenseId}
            </Text>
          </View>
          <StatusBadge
            status={isResolved ? 'Resolved' : 'Pending'}
            size="small"
          />
        </View>

        {parentExpense && (
          <View style={styles.parentMeta}>
            <Text style={styles.parentTitle}>
              {parentExpense.employeeName} • {parentExpense.category}
            </Text>
            <Text style={styles.parentAmount}>
              ₹{Number(parentExpense.requestedAmount || parentExpense.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        )}

        <View style={styles.threadContainer}>
          <View style={styles.queryBubble}>
            <View style={styles.bubbleHeader}>
              <ShieldCheck size={13} color={colors.semantic.warning} />
              <Text style={styles.bubbleSender}>
                {item.raisedBy || 'HR & Audit Officer'}
              </Text>
              <Text style={styles.bubbleTime}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-CA') : 'Recent'}
              </Text>
            </View>
            <Text style={styles.queryText}>{item.queryMessage}</Text>
          </View>

          {item.responseMessage ? (
            <View style={styles.replyBubble}>
              <View style={styles.bubbleHeader}>
                <CornerDownRight size={13} color={colors.primary} />
                <Text style={styles.replySender}>
                  {item.employeeName || 'Staff Member'} (Clarification)
                </Text>
                <Text style={styles.bubbleTime}>
                  {item.repliedAt ? new Date(item.repliedAt).toLocaleDateString('en-CA') : 'Replied'}
                </Text>
              </View>
              <Text style={styles.replyText}>{item.responseMessage}</Text>
              <View style={styles.resubmitNotice}>
                <CheckCircle2 size={12} color={colors.semantic.success} />
                <Text style={styles.resubmitText}>
                  Re-submitted for audit on existing claim record
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.replyActionBox}>
              <Button
                title={isOwner ? 'Submit Clarification Reply' : 'Enter Employee Clarification'}
                variant="primary"
                size="small"
                onPress={() => handleOpenReplyModal(item)}
                style={{ backgroundColor: colors.semantic.warning }}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Expense Queries"
        subtitle={
          expenseIdFilter
            ? `Clarifications for #${expenseIdFilter}`
            : 'Interactive audit threads between staff and HR'
        }
        showBack
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={accessibleQueries}
        keyExtractor={(item) => item.id}
        renderItem={renderQueryCard}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Queries Open"
            message={
              expenseIdFilter
                ? 'No active clarification queries on this claim.'
                : 'All expense claims are in compliance with zero pending queries.'
            }
            icon={<CheckCircle2 size={44} color={colors.primary} />}
          />
        }
      />

      <Modal statusBarTranslucent visible={!!selectedQuery} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Respond to Clarification Query</Text>
                <Text style={styles.modalSub}>
                  Claim #{selectedQuery?.expenseId}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedQuery(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.queryExcerptBox}>
              <Text style={styles.excerptLabel}>AUDITOR QUERY:</Text>
              <Text style={styles.excerptText}>{selectedQuery?.queryMessage}</Text>
            </View>

            {responseError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={colors.semantic.error} />
                <Text style={styles.errorText}>{responseError}</Text>
              </View>
            ) : null}

            <Input
              label="Your Explanation / Clarification (Min 3 chars) *"
              placeholder="e.g. Attached original GST tax invoice from HPCL depot; fuel was utilized exclusively for Bhilwara site generator transit..."
              value={responseMsg}
              onChangeText={(val) => {
                setResponseMsg(val);
                setResponseError('');
              }}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setSelectedQuery(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit & Re-submit Claim"
                variant="primary"
                loading={isReplying}
                onPress={handleResolve}
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerRefWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimRef: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  parentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  parentTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  parentAmount: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
  },
  threadContainer: {
    gap: spacing.xs,
  },
  queryBubble: {
    backgroundColor: `${colors.semantic.warning}12`,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  replyBubble: {
    backgroundColor: `${colors.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.warning,
    flex: 1,
  },
  replySender: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  bubbleTime: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  queryText: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
  },
  replyText: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
  },
  resubmitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}20`,
  },
  resubmitText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.semantic.success,
  },
  replyActionBox: {
    marginTop: spacing.xs,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSub: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  queryExcerptBox: {
    backgroundColor: `${colors.semantic.warning}12`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  excerptLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.semantic.warning,
    letterSpacing: 0.5,
  },
  excerptText: {
    ...typography.caption,
    color: colors.text.primary,
    marginTop: 2,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.semantic.error}15`,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 11,
    color: colors.semantic.error,
    fontWeight: '600',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
