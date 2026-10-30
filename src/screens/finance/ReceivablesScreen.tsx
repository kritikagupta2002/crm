import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Wallet, CheckCircle2, AlertTriangle, Clock, Send } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid, inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useFinance } from '../../context/FinanceContext';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';
import { formatDate } from '../../fieldDatabase/utils/date';

const MODES = ['NEFT/RTGS', 'Cheque', 'UPI', 'Cash'];
const BUCKETS = ['all', '0-30', '31-60', '61-90', '90+'] as const;

/* Days past the due date, put in the aging bucket the web's receivables use. */
const bucketOf = (due: string) => {
  const days = Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

/* What clients owe: every raised invoice, what came in against it, what is left and how old it is. */
export const ReceivablesScreen: React.FC<{ navigation: any }> = () => {
  const { invoices, updateInvoiceStatus } = useFinance();
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>('all');
  const [picked, setPicked] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState(MODES[0]);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(
    () =>
      invoices
        .filter((i) => i.status !== 'Draft')
        .map((i) => {
          const received = i.paidAmount || 0;
          const outstanding = Math.max(0, i.totalAmount - received);
          const overdue = outstanding > 0 && !!i.dueDate && i.dueDate < today;
          return { ...i, received, outstanding, overdue, bucket: i.dueDate ? bucketOf(i.dueDate) : '0-30' };
        })
        .sort((a, b) => b.outstanding - a.outstanding),
    [invoices, today],
  );
  const shown = rows.filter((r) => bucket === 'all' || (r.outstanding > 0 && r.bucket === bucket));
  const sum = (list: any[], k: string) => list.reduce((s, r) => s + (r[k] || 0), 0);

  const record = async () => {
    const value = Number(amount);
    if (!picked || !Number.isFinite(value) || value <= 0) return Alert.alert('Collection', 'Enter the amount received.');
    if (value > picked.outstanding) return Alert.alert('Collection', 'The amount cannot be more than what is outstanding.');
    setBusy(true);
    try {
      const paid = picked.received + value;
      await updateInvoiceStatus(picked.id, paid >= picked.totalAmount ? 'Paid' : 'Partially Paid', paid, mode);
      setPicked(null);
    } catch (e: any) {
      Alert.alert('Collection', e?.message || 'Could not record the collection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={fd.root}>
      <AppHeader title="Receivables" subtitle="What clients owe, and how old it is" />
      <ScrollView contentContainerStyle={fd.body}>
        <StatGrid
          items={[
            { label: 'Invoiced', value: inr(sum(rows, 'totalAmount')), sub: `${rows.length} invoices`, Icon: Wallet, tone: 'teal' },
            { label: 'Collected', value: inr(sum(rows, 'received')), Icon: CheckCircle2, tone: 'green' },
            { label: 'Outstanding', value: inr(sum(rows, 'outstanding')), sub: `${rows.filter((r) => r.outstanding > 0).length} invoices`, Icon: Clock, tone: 'amber' },
            { label: 'Overdue', value: inr(sum(rows.filter((r) => r.overdue), 'outstanding')), sub: `${rows.filter((r) => r.overdue).length} past due`, Icon: AlertTriangle, tone: 'red' },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {BUCKETS.map((b) => (
            <TouchableOpacity key={b} onPress={() => setBucket(b)} style={[styles.chip, bucket === b && styles.chipOn]}>
              <Text style={[styles.chipText, bucket === b && styles.chipTextOn]}>{b === 'all' ? 'All' : `${b} days`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {shown.length === 0 ? <Empty text="Nothing outstanding in this range." /> : null}
        {shown.map((r) => (
          <View key={r.id} style={[fd.card, styles.row]}>
            <View style={styles.head}>
              <Text style={styles.no}>{r.invoiceNo}</Text>
              <View style={[styles.pill, { backgroundColor: r.outstanding === 0 ? colors.successBg : r.overdue ? colors.dangerBg : colors.warningBg }]}>
                <Text style={[styles.pillText, { color: r.outstanding === 0 ? colors.successText : r.overdue ? colors.dangerText : colors.warningText }]}>
                  {r.outstanding === 0 ? 'Settled' : r.overdue ? 'Overdue' : r.received ? 'Part paid' : 'Due'}
                </Text>
              </View>
            </View>
            <Text style={styles.client}>{r.clientName}</Text>
            <Text style={fd.muted}>
              Raised {formatDate(r.date)} · due {r.dueDate ? formatDate(r.dueDate) : '—'}
            </Text>
            <View style={styles.amounts}>
              <View style={styles.amount}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amountValue}>{inr(r.totalAmount)}</Text>
              </View>
              <View style={styles.amount}>
                <Text style={styles.amountLabel}>Received</Text>
                <Text style={[styles.amountValue, { color: colors.successText }]}>{inr(r.received)}</Text>
              </View>
              <View style={styles.amount}>
                <Text style={styles.amountLabel}>Outstanding</Text>
                <Text style={[styles.amountValue, r.outstanding > 0 && { color: colors.dangerText }]}>{inr(r.outstanding)}</Text>
              </View>
            </View>
            {r.outstanding > 0 ? (
              <View style={styles.actions}>
                <FdButton
                  title="Record collection"
                  onPress={() => {
                    setPicked(r);
                    setAmount(String(r.outstanding));
                    setMode(MODES[0]);
                  }}
                  style={{ flex: 1, height: 40 }}
                />
                <FdButton title="Remind" Icon={Send} kind="outline" onPress={() => Alert.alert('Reminder', `A payment reminder for ${r.invoiceNo} goes to ${r.clientName}.`)} style={{ height: 40 }} />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!picked} transparent animationType="slide" onRequestClose={() => setPicked(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Record collection</Text>
            {picked ? (
              <Text style={fd.muted}>
                {picked.invoiceNo} · {picked.clientName} · outstanding {inr(picked.outstanding)}
              </Text>
            ) : null}
            <Text style={styles.label}>AMOUNT RECEIVED (₹)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
            <Text style={styles.label}>MODE</Text>
            <View style={styles.modes}>
              {MODES.map((m) => (
                <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.chip, mode === m && styles.chipOn]}>
                  <Text style={[styles.chipText, mode === m && styles.chipTextOn]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actions}>
              <FdButton title="Cancel" kind="outline" onPress={() => setPicked(null)} style={{ flex: 1 }} />
              <FdButton title="Save" onPress={record} busy={busy} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.textInverse },
  row: { marginBottom: 10, gap: 3 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  no: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  client: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  amounts: { flexDirection: 'row', gap: 8, marginTop: 10 },
  amount: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: 8 },
  amountLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  amountValue: { fontFamily: fonts.serif, fontSize: 15, color: colors.textPrimary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  label: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary, marginTop: 14, marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 16, color: colors.textPrimary },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
