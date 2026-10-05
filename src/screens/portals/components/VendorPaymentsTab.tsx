import React from 'react';
import { View, Text } from 'react-native';
import { IndianRupee, CreditCard } from 'lucide-react-native';
import { Card, StatusBadge, EmptyState } from '../../../components';
import { colors, spacing } from '../../../theme';
import { WorkOrder } from '../../../types';
import { styles } from './vendorPortalStyles';

interface VendorPaymentsTabProps {
  totalContract: number;
  totalPaid: number;
  myWorkOrders: WorkOrder[];
}

export const VendorPaymentsTab: React.FC<VendorPaymentsTabProps> = ({
  totalContract,
  totalPaid,
  myWorkOrders,
}) => {
  const paidBillsList = myWorkOrders.flatMap((w) =>
    w.milestoneBills.filter((b) => b.status === 'Paid')
  );

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Remittance & TDS Tracking</Text>
        <Text style={styles.sectionSub}>
          Verified electronic disbursements and tax deductions
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>TOTAL CONTRACT VALUE</Text>
          <Text style={styles.summaryBoxVal}>
            ₹{(totalContract / 100000).toFixed(2)} L
          </Text>
        </Card>
        <Card style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>TOTAL RECEIVED (NET)</Text>
          <Text
            style={[
              styles.summaryBoxVal,
              { color: colors.semantic.success },
            ]}
          >
            ₹{(totalPaid / 100000).toFixed(2)} L
          </Text>
        </Card>
      </View>

      <Text style={styles.subSectionTitle}>Payment Disbursement History</Text>

      {paidBillsList.length === 0 ? (
        <EmptyState
          title="No Remittances Disbursed"
          message="Disbursed electronic payments and UTR transactions will appear here."
          icon={<IndianRupee size={40} color={colors.text.tertiary} />}
        />
      ) : (
        myWorkOrders.map((wo) => {
          const paidBills = wo.milestoneBills.filter((b) => b.status === 'Paid');
          if (paidBills.length === 0) return null;

          return (
            <View key={wo.id} style={{ gap: spacing.sm }}>
              {paidBills.map((b) => (
                <Card key={b.id} style={styles.paymentCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.woCode}>
                      {wo.woNumber} · {b.invoiceNo || b.billNo}
                    </Text>
                    <StatusBadge status="paid" size="small" />
                  </View>
                  <Text style={styles.woTitle}>{wo.projectTitle}</Text>

                  <View style={styles.paymentBreakdown}>
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>Gross Invoiced</Text>
                      <Text style={styles.payVal}>
                        ₹{b.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {b.tdsRate && b.tdsRate > 0 ? (
                      <View style={styles.payRow}>
                        <Text style={styles.payLabel}>
                          TDS Withheld ({b.tdsRate}%)
                        </Text>
                        <Text
                          style={[
                            styles.payVal,
                            { color: colors.semantic.danger },
                          ]}
                        >
                          -₹
                          {Math.round(
                            b.amount * (b.tdsRate / 100)
                          ).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : null}
                    <View style={[styles.payRow, styles.netPayRow]}>
                      <Text style={styles.netPayLabel}>
                        Net Remitted via RTGS
                      </Text>
                      <Text style={styles.netPayVal}>
                        ₹
                        {(b.tdsRate
                          ? Math.round(b.amount * (1 - b.tdsRate / 100))
                          : b.amount
                        ).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {b.utrNo || b.utrRef ? (
                    <View style={styles.utrTag}>
                      <CreditCard size={12} color={colors.primary} />
                      <Text style={styles.utrText}>
                        UTR: {b.utrNo || b.utrRef} | Paid on{' '}
                        {b.paidDate || b.date || 'Today'}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          );
        })
      )}
    </View>
  );
};
