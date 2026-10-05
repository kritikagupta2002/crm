import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFinance, useHrms } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatCard } from '../../components';
import { ShieldCheck, IndianRupee, FileCheck2, Scale, Percent } from 'lucide-react-native';

export const TaxComplianceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { invoices, vendorBills } = useFinance();
  const { payslips } = useHrms();

  const { totalGstOutward, totalItc, netGstPayable, totalTds194C } = useMemo(() => {
    const outward = invoices.reduce((acc, inv) => acc + (inv.cgst + inv.sgst + inv.igst), 0);
    const itc = vendorBills
      .filter((b) => b.itcEligible)
      .reduce((acc, b) => acc + b.gstAmount, 0);
    const net = Math.max(0, outward - itc);
    const tds194C = vendorBills.reduce((acc, b) => acc + b.tdsAmount, 0);
    return {
      totalGstOutward: outward,
      totalItc: itc,
      netGstPayable: net,
      totalTds194C: tds194C,
    };
  }, [invoices, vendorBills]);

  // TDS on Salaries under Section 192 from Payslips
  const totalTdsSalary = useMemo(() => {
    return payslips.reduce((acc, p) => acc + p.tdsDeduction, 0);
  }, [payslips]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Tax Compliance & GST"
        subtitle="Statutory TDS returns & GSTR-1/3B reconciliation"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrap}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Goods & Services Tax (GST) Engine</Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>GSTR-3B Auto-Offset</Text>
            </View>
          </View>

          <View style={styles.calcRow}>
            <View style={styles.calcBox}>
              <Text style={styles.calcLabel}>OUTWARD TAX (GSTR-1)</Text>
              <Text style={styles.calcValue}>₹{totalGstOutward.toLocaleString('en-IN')}</Text>
              <Text style={styles.calcSub}>18% on Invoices</Text>
            </View>

            <View style={styles.calcBox}>
              <Text style={styles.calcLabel}>INPUT CREDIT (GSTR-2B)</Text>
              <Text style={[styles.calcValue, { color: colors.semantic.success }]}>
                ₹{totalItc.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.calcSub}>Vendor Purchases</Text>
            </View>
          </View>

          <View style={styles.netGstBox}>
            <Text style={styles.netGstLabel}>Net Cash GST Liability Payable</Text>
            <Text style={styles.netGstValue}>₹{netGstPayable.toLocaleString('en-IN')}</Text>
          </View>

          <TouchableOpacity
            style={styles.navLinkBtn}
            onPress={() => navigation.navigate('GstOverview')}
          >
            <Text style={styles.navLinkText}>Open Full GST Ledger & Returns Cockpit →</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrap}>
              <Percent size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>TDS Deductions Register</Text>
            </View>
          </View>

          <View style={styles.tdsList}>
            <View style={styles.tdsItem}>
              <View style={styles.tdsItemHeader}>
                <Text style={styles.tdsSectionCode}>Section 194C</Text>
                <Text style={styles.tdsItemAmount}>₹{totalTds194C.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.tdsDescription}>Subcontractor Drilling & Earthworks @ 2%</Text>
            </View>

            <View style={styles.tdsItem}>
              <View style={styles.tdsItemHeader}>
                <Text style={styles.tdsSectionCode}>Section 192</Text>
                <Text style={styles.tdsItemAmount}>₹{totalTdsSalary.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.tdsDescription}>Salaries & Professional Geologists Income Tax</Text>
            </View>

            <View style={styles.tdsItem}>
              <View style={styles.tdsItemHeader}>
                <Text style={styles.tdsSectionCode}>Section 194J</Text>
                <Text style={styles.tdsItemAmount}>₹0</Text>
              </View>
              <Text style={styles.tdsDescription}>Assay Laboratory & Technical Geoscientific Fees @ 10%</Text>
            </View>
          </View>

          <View style={styles.totalTdsRow}>
            <Text style={styles.totalTdsLabel}>Total Statutory TDS Deposit Liability</Text>
            <Text style={styles.totalTdsValue}>
              ₹{(totalTds194C + totalTdsSalary).toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navLinkBtn}
            onPress={() => navigation.navigate('TdsRegister')}
          >
            <Text style={styles.navLinkText}>Open Full TDS Register & Form 16A →</Text>
          </TouchableOpacity>
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  activeTag: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  activeTagText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  calcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  calcBox: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  calcLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  calcValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  calcSub: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
    marginTop: 2,
  },
  netGstBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  netGstLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
  },
  netGstValue: {
    ...typography.h3,
    color: colors.primary,
  },
  tdsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tdsItem: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tdsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  tdsSectionCode: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tdsItemAmount: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tdsDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  totalTdsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
  },
  totalTdsLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalTdsValue: {
    ...typography.h4,
    color: '#F59E0B',
  },
  navLinkBtn: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    alignItems: 'center',
  },
  navLinkText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
