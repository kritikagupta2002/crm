import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FilePlus2, Receipt, BookOpen, AlertTriangle, Wallet, ClipboardCheck, MessageCircleQuestion } from 'lucide-react-native';
import { HomeHeader } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, inr, homeStyles } from '../../components/home/HomeBlocks';
import { colors, radius } from '../../theme';
import { useFinance } from '../../context/FinanceContext';
import { useCrm } from '../../context/CrmContext';
import { questionsFor } from '../../utils/questions';

interface AccountsExecutiveHomeScreenProps {
  navigation: any;
}

const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

/* Accounts Executive: bills to check, invoices to chase and the day book. */
export const AccountsExecutiveHomeScreen: React.FC<AccountsExecutiveHomeScreenProps> = ({ navigation }) => {
  const { invoices, vendorBills, vouchers, updateVendorBillStatus } = useFinance();
  const { leads } = useCrm();
  const billingQuestions = questionsFor('accounts_executive', leads).filter((q) => q.status === 'Open').length;
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const toCheck = vendorBills.filter((b) => b.status === 'Unpaid' || b.status === 'Pending Approval');
  const unpaid = invoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft');
  const drafts = invoices.filter((i) => i.status === 'Draft');
  const due = (i: any) => i.totalAmount - (i.paidAmount || 0);
  const overdue = unpaid.filter((i) => i.status === 'Overdue' || (i.dueDate && i.dueDate < today));
  const monthVouchers = vouchers.filter((v) => (v.date || '').startsWith(month));

  // Checked against the work order and site record, then Finance Master releases it.
  const passBill = (id: string, label: string) =>
    Alert.alert('Pass bill', `Checked ${label} against the work order? It goes to the Finance Master for payment.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pass', onPress: () => updateVendorBillStatus(id, 'Approved') },
    ]);

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="Invoices" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <StatGrid
          items={[
            { label: 'Bills to check', value: toCheck.length, sub: inr(toCheck.reduce((s, b) => s + b.totalAmount, 0)), Icon: ClipboardCheck, tone: toCheck.length ? 'amber' : 'green', onPress: () => navigation.navigate('VendorBills') },
            { label: 'Unpaid invoices', value: unpaid.length, sub: inr(unpaid.reduce((s, i) => s + due(i), 0)), Icon: Wallet, tone: 'blue', onPress: () => navigation.navigate('Invoices') },
            { label: 'Overdue', value: overdue.length, sub: inr(overdue.reduce((s, i) => s + due(i), 0)), Icon: AlertTriangle, tone: overdue.length ? 'red' : 'green', onPress: () => navigation.navigate('Invoices') },
            { label: 'Vouchers', value: monthVouchers.length, sub: 'This month', Icon: BookOpen, tone: 'teal', onPress: () => navigation.navigate('Vouchers') },
          ]}
        />

        <SectionTitle title="Bills to check" count={toCheck.length} action="All bills" onAction={() => navigation.navigate('VendorBills')} />
        <ActionList
          empty="No vendor bills waiting."
          items={toCheck.slice(0, 5).map((b) => ({
            key: b.id,
            title: b.vendorName,
            sub: `${b.billNo} · ${inr(b.totalAmount)}${b.workOrderId ? ` · WO ${b.workOrderId}` : ''}`,
            Icon: Receipt,
            tone: 'amber',
            right: (
              <TouchableOpacity style={styles.passBtn} onPress={() => passBill(b.id, b.billNo)}>
                <Text style={styles.passText}>Pass</Text>
              </TouchableOpacity>
            ),
          }))}
        />

        <SectionTitle title="Invoices to follow up" count={overdue.length + drafts.length} action="Invoices" onAction={() => navigation.navigate('Invoices')} />
        <ActionList
          empty="All invoices are on time."
          items={[...overdue, ...drafts].slice(0, 5).map((i) => {
            const isDraft = i.status === 'Draft';
            return {
              key: i.id,
              title: i.clientName,
              sub: `${i.invoiceNo} · ${isDraft ? 'draft, not sent' : `due ${shortDate(i.dueDate)}`}`,
              Icon: isDraft ? FilePlus2 : AlertTriangle,
              tone: isDraft ? 'blue' : 'red',
              tag: inr(due(i)),
              onPress: () => navigation.navigate('Invoices'),
            };
          })}
        />

        <SectionTitle title="Record" />
        <ActionList
          items={[
            { key: 'cq', title: 'Billing questions', sub: 'Clients asking about invoices and payments', Icon: MessageCircleQuestion, tone: billingQuestions ? 'amber' : 'green', tag: billingQuestions ? `${billingQuestions} waiting` : 'Clear', onPress: () => navigation.navigate('ClientQuestions') },
            { key: 'inv', title: 'Raise an invoice', sub: 'Bill a client for a milestone', Icon: FilePlus2, tone: 'teal', onPress: () => navigation.navigate('Invoices') },
            { key: 'bill', title: 'Enter a vendor bill', sub: 'Drilling, assay, lease and other bills', Icon: Receipt, tone: 'gold', onPress: () => navigation.navigate('VendorBills') },
            { key: 'vou', title: 'Day book entry', sub: 'Payment, receipt or journal voucher', Icon: BookOpen, tone: 'teal', onPress: () => navigation.navigate('Vouchers') },
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  passBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  passText: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
});
