import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button, StatusBadge, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { formatExactCurrency as formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { Quote } from '../../types';

interface QuoteApprovalsScreenProps {
  navigation: any;
}

const keyExtractor = (item: Quote) => item.id;

export const QuoteApprovalsScreen: React.FC<QuoteApprovalsScreenProps> = ({ navigation }) => {
  const { quotes, approveQuote } = useCrm();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pendingQuotes = useMemo(
    () => quotes.filter((q) => q.status === 'Pending Approval'),
    [quotes]
  );

  const handleApprove = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      try {
        await approveQuote(id, 'Authorized by Director for client delivery.');
        Alert.alert('Approved', 'Quotation authorized. Ready for client submission.');
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [approveQuote]
  );

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Director Approvals Queue"
          subtitle={`${pendingQuotes.length} quotations awaiting executive sign-off`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.policyNotice}>
        <ShieldCheck size={18} color={colors.primary} />
        <Text style={styles.policyText}>
          Director Authorization Policy: Quotations exceeding ₹5,00,000 or with discounts &gt; 10% require executive board sign-off before transmission to clients.
        </Text>
      </View>

      {pendingQuotes.length === 0 ? (
        <EmptyState
          title="No Pending Approvals"
          description="All high-value technical quotations have been authorized."
          icon={<CheckCircle size={48} color={colors.success} />}
        />
      ) : (
        <FlatList
          data={pendingQuotes}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.quoteCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.quoteNo}>{item.quoteNo}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <Text style={styles.clientName}>{item.clientName}</Text>
              <Text style={styles.projectTitle}>{item.projectTitle}</Text>

              <View style={styles.itemsTable}>
                {item.lineItems.map((li) => (
                  <View key={li.id} style={styles.itemRow}>
                    <Text style={styles.itemDesc} numberOfLines={1}>{li.description}</Text>
                    <Text style={styles.itemQty}>{li.quantity} {li.unit}</Text>
                    <Text style={styles.itemAmount}>{formatCurrency(li.amount)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Subtotal:</Text>
                  <Text style={styles.sumVal}>{formatCurrency(item.subtotal)}</Text>
                </View>
                {item.discount > 0 ? (
                  <View style={styles.sumRow}>
                    <Text style={[styles.sumLabel, { color: colors.warningText }]}>Discount:</Text>
                    <Text style={[styles.sumVal, { color: colors.warningText }]}>- {formatCurrency(item.discount)}</Text>
                  </View>
                ) : null}
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>GST (18%):</Text>
                  <Text style={styles.sumVal}>+ {formatCurrency(item.gstAmount)}</Text>
                </View>
                <View style={[styles.sumRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Value:</Text>
                  <Text style={styles.totalVal}>{formatCurrency(item.total)}</Text>
                </View>
              </View>

              <View style={styles.btnRow}>
                <Button
                  title="Approve Quotation"
                  onPress={() => handleApprove(item.id)}
                  loading={actionLoadingId === item.id}
                  variant="primary"
                  size="md"
                  style={styles.approveBtn}
                />
              </View>
            </Card>
          )}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  policyText: {
    fontSize: typography.fontSizes.xs,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  quoteCard: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quoteNo: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  clientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
    color: '#0f172a',
  },
  projectTitle: {
    fontSize: typography.fontSizes.xs,
    color: '#64748b',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  itemsTable: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemDesc: {
    fontSize: typography.fontSizes.xs,
    color: '#334155',
    flex: 2,
    fontWeight: '500',
  },
  itemQty: {
    fontSize: typography.fontSizes.xxs,
    color: '#64748b',
    flex: 1,
    textAlign: 'center',
  },
  itemAmount: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
  },
  summaryBox: {
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sumLabel: {
    fontSize: typography.fontSizes.xs,
    color: '#64748b',
  },
  sumVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    minHeight: 44,
  },
});
