import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Scale, BookOpen } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid, inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useFinance } from '../../context/FinanceContext';
import { Empty, fd } from '../../fieldDatabase/components/ui';
import { formatDate } from '../../fieldDatabase/utils/date';

const TYPES = ['All', 'Receipts', 'Payments'] as const;
/* Cash moves are the vouchers that touch a bank or cash account: debited, money came in; credited, it went out. */
const isCash = (account?: string) => /bank|cash/i.test(account || '');
const isReceipt = (v: any) => isCash(v.debitAccount) && !isCash(v.creditAccount);
const isPayment = (v: any) => isCash(v.creditAccount) && !isCash(v.debitAccount);

/* The cash and bank ledger: money in from clients, money out to vendors, from the posted vouchers. */
export const PaymentsReceiptsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { vouchers } = useFinance();
  const [type, setType] = useState<(typeof TYPES)[number]>('All');

  const moves = useMemo(
    () =>
      vouchers
        .filter((v) => isReceipt(v) || isPayment(v))
        .map((v) => ({ ...v, inflow: isReceipt(v) }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [vouchers],
  );
  const shown = moves.filter((m) => type === 'All' || (type === 'Receipts' ? m.inflow : !m.inflow));
  const received = moves.filter((m) => m.inflow).reduce((s, m) => s + m.amount, 0);
  const paid = moves.filter((m) => !m.inflow).reduce((s, m) => s + m.amount, 0);

  return (
    <View style={fd.root}>
      <AppHeader title="Payments & Receipts" subtitle="Money in from clients, money out to vendors" />
      <ScrollView contentContainerStyle={fd.body}>
        <StatGrid
          items={[
            { label: 'Received', value: inr(received), sub: `${moves.filter((m) => m.inflow).length} receipts`, Icon: ArrowDownLeft, tone: 'green' },
            { label: 'Paid out', value: inr(paid), sub: `${moves.filter((m) => !m.inflow).length} payments`, Icon: ArrowUpRight, tone: 'amber' },
            { label: 'Net cash', value: inr(received - paid), Icon: Scale, tone: received - paid >= 0 ? 'teal' : 'red' },
            { label: 'All vouchers', value: vouchers.length, sub: 'Day book', Icon: BookOpen, tone: 'slate', onPress: () => navigation.navigate('Vouchers') },
          ]}
        />

        <View style={styles.tabs}>
          {TYPES.map((t) => (
            <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.tab, type === t && styles.tabOn]}>
              <Text style={[styles.tabText, type === t && styles.tabTextOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {shown.length === 0 ? <Empty text="No transactions yet." /> : null}
        {shown.map((m) => (
          <View key={m.id} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: m.inflow ? colors.successBg : colors.warningBg }]}>
              {m.inflow ? <ArrowDownLeft size={17} color={colors.success} /> : <ArrowUpRight size={17} color={colors.warning} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.party} numberOfLines={1}>
                {(m.inflow ? m.creditAccount : m.debitAccount)?.replace(/^\d+\s*-\s*/, '') || m.narration}
              </Text>
              <Text style={fd.muted} numberOfLines={1}>
                {m.voucherNumber} · {m.reference || '—'} · {m.date ? formatDate(m.date) : ''}
              </Text>
            </View>
            <Text style={[styles.amount, { color: m.inflow ? colors.successText : colors.textPrimary }]}>
              {m.inflow ? '+' : '−'}
              {inr(m.amount)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  tabOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.textInverse },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  party: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  amount: { fontFamily: fonts.serif, fontSize: 15 },
});
