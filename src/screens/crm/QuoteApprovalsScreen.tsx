import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button, StatusBadge, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Quote } from '../../types';

interface QuoteApprovalsScreenProps {
  navigation: any;
}

export const QuoteApprovalsScreen: React.FC<QuoteApprovalsScreenProps> = ({ navigation }) => {
  const { quotes, approveQuote } = useCrm();
  const { role } = useAuth();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const pendingQuotes = quotes.filter((q) => q.status === 'Pending Approval');

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await approveQuote(id, 'Authorized by Director for client delivery.');
      Alert.alert('Approved', 'Quotation authorized. Ready for client submission.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

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
          keyExtractor={(item) => item.id}
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

              {/* Line items mini table */}
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
    backgroundColor: colors.primaryBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  policyText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  quoteCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quoteNo: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  clientName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  projectTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemsTable: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    flex: 2,
  },
  itemQty: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  itemAmount: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  summaryBox: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sumLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  sumVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
  },
  btnRow: {
    flexDirection: 'row',
  },
  approveBtn: {
    flex: 1,
  },
});
