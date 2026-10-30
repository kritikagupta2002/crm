import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Wallet, Receipt, AlertTriangle, Landmark, FileText, Scale, BookOpen, BarChart3, PiggyBank } from 'lucide-react-native';
import { HomeHeader } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, Panel, SplitBar, inr, homeStyles } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useFinance } from '../../context/FinanceContext';

interface FinanceMasterHomeScreenProps {
  navigation: any;
}

const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

/* Finance Master: money in, money out, bills to release and tax due. */
export const FinanceMasterHomeScreen: React.FC<FinanceMasterHomeScreenProps> = ({ navigation }) => {
  const { invoices, vendorBills, taxRecords, gstReturns, updateVendorBillStatus } = useFinance();
  const today = new Date().toISOString().slice(0, 10);

  const unpaid = invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft');
  const due = (i: any) => i.totalAmount - (i.paidAmount || 0);
  const receivable = unpaid.reduce((s, i) => s + due(i), 0);
  const overdue = unpaid.filter((i) => i.status === 'Overdue' || (i.dueDate && i.dueDate < today));
  const billsOpen = vendorBills.filter((b) => b.status !== 'Paid');
  const payable = billsOpen.reduce((s, b) => s + b.totalAmount - (b.tdsAmount || 0), 0);
  const toRelease = vendorBills.filter((b) => b.status === 'Approved');
  const tdsPending = taxRecords.filter((t) => t.status === 'Pending Deposit');
  const gstOpen = gstReturns.filter((g) => g.status !== 'Filed');

  const release = (id: string, label: string, amount: number) =>
    Alert.alert('Release payment', `Pay ${inr(amount)} to ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => updateVendorBillStatus(id, 'Paid', { paidDate: today, paymentMode: 'NEFT' }) },
    ]);

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="FinanceDashboard" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <Panel>
          <Text style={styles.label}>Net position</Text>
          <Text style={[styles.bigValue, { color: receivable - payable >= 0 ? colors.success : colors.danger }]}>{inr(receivable - payable)}</Text>
          <Text style={styles.small}>What clients owe us, less what we owe vendors</Text>
          <View style={{ height: 12 }} />
          <SplitBar
            parts={[
              { label: 'To receive', value: receivable, display: inr(receivable), tone: 'green' },
              { label: 'To pay', value: payable, display: inr(payable), tone: 'amber' },
            ]}
          />
        </Panel>

        <View style={{ height: 12 }} />
        <StatGrid
          items={[
            { label: 'Unpaid invoices', value: unpaid.length, sub: inr(receivable), Icon: Wallet, tone: 'green', onPress: () => navigation.navigate('Receivables') },
            { label: 'Overdue', value: overdue.length, sub: inr(overdue.reduce((s, i) => s + due(i), 0)), Icon: AlertTriangle, tone: overdue.length ? 'red' : 'green', onPress: () => navigation.navigate('Invoices') },
            { label: 'Vendor bills', value: billsOpen.length, sub: inr(payable), Icon: Receipt, tone: 'amber', onPress: () => navigation.navigate('VendorBills') },
            { label: 'TDS to deposit', value: tdsPending.length, sub: inr(tdsPending.reduce((s, t) => s + t.tdsAmount, 0)), Icon: Landmark, tone: tdsPending.length ? 'amber' : 'green', onPress: () => navigation.navigate('TdsRegister') },
          ]}
        />

        <SectionTitle title="Payments to release" count={toRelease.length} action="Bills" onAction={() => navigation.navigate('VendorBills')} />
        <ActionList
          empty="No approved bills waiting for payment."
          items={toRelease.slice(0, 5).map((b) => ({
            key: b.id,
            title: b.vendorName,
            sub: `${b.billNo} · ${b.category || 'Vendor bill'}${b.dueDate ? ` · due ${shortDate(b.dueDate)}` : ''}`,
            Icon: Receipt,
            tone: 'amber',
            right: (
              <TouchableOpacity style={styles.payBtn} onPress={() => release(b.id, b.vendorName, b.totalAmount - (b.tdsAmount || 0))}>
                <Text style={styles.payText}>Pay {inr(b.totalAmount - (b.tdsAmount || 0))}</Text>
              </TouchableOpacity>
            ),
          }))}
        />

        <SectionTitle title="Overdue from clients" count={overdue.length} />
        <ActionList
          empty="Nothing overdue."
          items={overdue.slice(0, 4).map((i) => ({
            key: i.id,
            title: i.clientName,
            sub: `${i.invoiceNo} · due ${shortDate(i.dueDate)}`,
            Icon: AlertTriangle,
            tone: 'red',
            tag: inr(due(i)),
            onPress: () => navigation.navigate('Invoices'),
          }))}
        />

        <SectionTitle title="Tax" />
        <ActionList
          items={[
            ...gstOpen.slice(0, 3).map((g) => ({
              key: g.id,
              title: `${g.returnType} · ${g.period}`,
              sub: `Due ${shortDate(g.dueDate)}`,
              Icon: FileText,
              tone: (g.status === 'Due Soon' ? 'amber' : g.status === 'Ready to File' ? 'blue' : 'slate') as any,
              tag: g.status,
              onPress: () => navigation.navigate('GstOverview'),
            })),
            { key: 'rep', title: 'Financial reports', sub: 'Profit & loss, GST, TDS, by project', Icon: BarChart3, tone: 'teal', onPress: () => navigation.navigate('FinancialReports') },
            { key: 'bud', title: 'Budget & cost', sub: 'Project budgets against spend', Icon: PiggyBank, tone: 'gold', onPress: () => navigation.navigate('BudgetCost') },
            { key: 'tax', title: 'Tax compliance', sub: 'TDS, GST and advance tax', Icon: Scale, tone: 'teal', onPress: () => navigation.navigate('TaxCompliance') },
            { key: 'vou', title: 'Vouchers', sub: 'Payment, receipt and journal entries', Icon: BookOpen, tone: 'teal', onPress: () => navigation.navigate('Vouchers') },
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  bigValue: { fontFamily: fonts.serif, fontSize: 28, marginTop: 2 },
  small: { fontSize: 12, color: colors.textMuted },
  payBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8 },
  payText: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
});
