import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Receipt,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  QrCode,
  CreditCard,
} from 'lucide-react-native';
import { clientTheme } from './clientTheme';
import { FinanceInvoice } from '../../../types';

interface ClientInvoicesTabProps {
  myInvoices: FinanceInvoice[];
  filteredInvoices: FinanceInvoice[];
  invoiceFilter: 'all' | 'pending' | 'paid';
  setInvoiceFilter: (v: 'all' | 'pending' | 'paid') => void;
  totalContractValue: number;
  totalPaidAmount: number;
  totalOutstanding: number;
  onOpenInvoiceDetail: (i: FinanceInvoice) => void;
  onOpenInvoicePay: (i: FinanceInvoice) => void;
}

export const ClientInvoicesTab: React.FC<ClientInvoicesTabProps> = ({
  myInvoices,
  filteredInvoices,
  invoiceFilter,
  setInvoiceFilter,
  totalPaidAmount,
  totalOutstanding,
  onOpenInvoiceDetail,
  onOpenInvoicePay,
}) => {
  const pendingCount = myInvoices.filter((i) => i.status !== 'Paid').length;
  const paidCount = myInvoices.filter((i) => i.status === 'Paid').length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* 1. FINANCIAL SUMMARY KPI STRIP */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>TOTAL SETTLED</Text>
          <Text style={[styles.kpiVal, { color: clientTheme.colors.emerald }]}>
            ₹{(totalPaidAmount / 100000).toFixed(2)}L
          </Text>
          <Text style={styles.kpiSub}>{paidCount} paid vouchers</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>OUTSTANDING DUE</Text>
          <Text
            style={[
              styles.kpiVal,
              { color: totalOutstanding > 0 ? clientTheme.colors.crimson : clientTheme.colors.emerald },
            ]}
          >
            ₹{(totalOutstanding / 100000).toFixed(2)}L
          </Text>
          <Text style={styles.kpiSub}>
            {pendingCount > 0 ? `${pendingCount} invoices pending` : 'All cleared'}
          </Text>
        </View>
      </View>

      {/* 2. FILTER PILLS */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[styles.filterPill, invoiceFilter === 'all' && styles.filterPillActive]}
          onPress={() => setInvoiceFilter('all')}
        >
          <Text style={[styles.filterPillText, invoiceFilter === 'all' && styles.filterPillTextActive]}>
            All Invoices ({myInvoices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, invoiceFilter === 'pending' && styles.filterPillActive]}
          onPress={() => setInvoiceFilter('pending')}
        >
          <Text style={[styles.filterPillText, invoiceFilter === 'pending' && styles.filterPillTextActive]}>
            Pending Due ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, invoiceFilter === 'paid' && styles.filterPillActive]}
          onPress={() => setInvoiceFilter('paid')}
        >
          <Text style={[styles.filterPillText, invoiceFilter === 'paid' && styles.filterPillTextActive]}>
            Settled / Paid ({paidCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. INVOICES LIST */}
      {filteredInvoices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Receipt size={44} color={clientTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No invoices found</Text>
          <Text style={styles.emptySub}>
            Invoices issued for completed exploration milestones will appear here.
          </Text>
        </View>
      ) : (
        filteredInvoices.map((inv) => {
          const isPaid = inv.status === 'Paid';
          const isOverdue = inv.status === 'Overdue';
          const taxTotal = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);

          return (
            <View key={inv.id} style={styles.invoiceCard}>
              {/* Card Top */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.invNoText}>{inv.invoiceNo}</Text>
                  <Text style={styles.invDateText}>Date: {inv.date || inv.invoiceDate}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isPaid && styles.statusBadgePaid,
                    isOverdue && styles.statusBadgeOverdue,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isPaid && styles.statusBadgeTextPaid,
                      isOverdue && styles.statusBadgeTextOverdue,
                    ]}
                  >
                    {inv.status}
                  </Text>
                </View>
              </View>

              {/* Project Title */}
              <Text style={styles.projectTitleText} numberOfLines={1}>
                {inv.projectTitle || 'Geological Exploration & Coring Services'}
              </Text>
              <Text style={styles.dueDateText}>Payment Due By: {inv.dueDate}</Text>

              {/* Tax & Amount Breakdown Box */}
              <View style={styles.amountBox}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Taxable Base:</Text>
                  <Text style={styles.amountVal}>₹{(inv.baseAmount || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Statutory GST (18%):</Text>
                  <Text style={styles.amountVal}>+ ₹{taxTotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.amountRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Invoiced:</Text>
                  <Text style={styles.totalVal}>₹{inv.totalAmount.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Actions Row */}
              {!isPaid ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    activeOpacity={0.75}
                    onPress={() => onOpenInvoiceDetail(inv)}
                  >
                    <Text style={styles.detailBtnText}>View Breakdown</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.85}
                    onPress={() => onOpenInvoicePay(inv)}
                  >
                    <QrCode size={18} color="#ffffff" />
                    <Text style={styles.payBtnText}>Pay with UPI QR</Text>
                    <ArrowRight size={17} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settledRow}
                  activeOpacity={0.8}
                  onPress={() => onOpenInvoiceDetail(inv)}
                >
                  <CheckCircle2 size={18} color={clientTheme.colors.emerald} />
                  <Text style={styles.settledText}>
                    Paid & Settled • View Tax Invoice
                  </Text>
                  <ChevronRight size={18} color={clientTheme.colors.emerald} />
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: clientTheme.colors.sandstone,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  kpiCol: {
    flex: 1,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: clientTheme.colors.sandstoneBorder,
    marginHorizontal: 16,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: clientTheme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiVal: {
    fontSize: clientTheme.typography.statNumber,
    fontWeight: '900',
    color: clientTheme.colors.navy,
  },
  kpiSub: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: clientTheme.radius.full,
    backgroundColor: clientTheme.colors.surface,
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
  },
  filterPillActive: {
    backgroundColor: clientTheme.colors.navy,
    borderColor: clientTheme.colors.navy,
  },
  filterPillText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '600',
    color: clientTheme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: clientTheme.colors.sandstoneBorder,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
    marginTop: 12,
  },
  emptySub: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  invoiceCard: {
    backgroundColor: clientTheme.colors.surface,
    borderRadius: clientTheme.radius.lg,
    padding: 18,
    borderWidth: 1.2,
    borderColor: clientTheme.colors.sandstoneBorder,
    ...clientTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invNoText: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '900',
    color: clientTheme.colors.navy,
    letterSpacing: 0.2,
  },
  invDateText: {
    fontSize: clientTheme.typography.badge,
    color: clientTheme.colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: clientTheme.radius.sm,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusBadgePaid: {
    backgroundColor: clientTheme.colors.emeraldSubtle,
    borderColor: '#a7f3d0',
  },
  statusBadgeOverdue: {
    backgroundColor: clientTheme.colors.crimsonSubtle,
    borderColor: '#fecaca',
  },
  statusBadgeText: {
    fontSize: clientTheme.typography.badge,
    fontWeight: '700',
    color: clientTheme.colors.goldDark,
  },
  statusBadgeTextPaid: {
    color: clientTheme.colors.emeraldDark,
  },
  statusBadgeTextOverdue: {
    color: clientTheme.colors.crimson,
  },
  projectTitleText: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
    marginBottom: 2,
  },
  dueDateText: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textMuted,
    marginBottom: 12,
  },
  amountBox: {
    backgroundColor: clientTheme.colors.sandstone,
    borderRadius: clientTheme.radius.md,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: clientTheme.typography.bodySm,
    color: clientTheme.colors.textSecondary,
    fontWeight: '500',
  },
  amountVal: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: clientTheme.colors.sandstoneBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: clientTheme.typography.bodyMd,
    fontWeight: '800',
    color: clientTheme.colors.navy,
  },
  totalVal: {
    fontSize: clientTheme.typography.titleMd,
    fontWeight: '900',
    color: clientTheme.colors.navy,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailBtn: {
    flex: 1,
    height: 48,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.sandstoneDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.textSecondary,
  },
  payBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: clientTheme.radius.md,
    backgroundColor: clientTheme.colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payBtnText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: '#ffffff',
  },
  settledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: clientTheme.colors.emeraldSubtle,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: clientTheme.radius.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  settledText: {
    fontSize: clientTheme.typography.bodySm,
    fontWeight: '700',
    color: clientTheme.colors.emeraldDark,
    flex: 1,
  },
});
