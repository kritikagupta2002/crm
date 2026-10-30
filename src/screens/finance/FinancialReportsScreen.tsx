import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Download } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useFinance } from '../../context/FinanceContext';
import { useHrms } from '../../context/HrmsContext';
import { FdButton, SectionHead, fd } from '../../fieldDatabase/components/ui';
import { workbookBytes } from '../../fieldDatabase/utils/xlsx';
import { saveWorkbook } from '../../fieldDatabase/utils/save';
import { projectMoney } from './projectMoney';

/* Financial year April–March, as the books keep it. */
const fyStart = (d = new Date()) => `${d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1}-04-01`;
const PERIODS = [
  { key: 'fy', label: 'This FY', from: fyStart() },
  { key: 'month', label: 'This month', from: new Date().toISOString().slice(0, 8) + '01' },
  { key: 'all', label: 'All', from: '0000' },
] as const;

const Line: React.FC<{ label: string; value: number; strong?: boolean; minus?: boolean }> = ({ label, value, strong, minus }) => (
  <View style={[styles.line, strong && styles.lineStrong]}>
    <Text style={[styles.lineLabel, strong && styles.strong]}>{label}</Text>
    <Text style={[styles.lineValue, strong && styles.strongValue, value < 0 && { color: colors.danger }]}>
      {minus && value ? '− ' : ''}
      {inr(Math.abs(value))}
    </Text>
  </View>
);

/* Profit and loss, GST and TDS for a period, and money by project; the same tables go out as an Excel file. */
export const FinancialReportsScreen: React.FC<{ navigation: any }> = () => {
  const { projects, workOrders } = useCrm();
  const { invoices, vendorBills, taxRecords } = useFinance();
  const { expenses } = useHrms();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['key']>('fy');
  const [busy, setBusy] = useState(false);
  const from = PERIODS.find((p) => p.key === period)!.from;
  const inPeriod = (d?: string) => (d || '') >= from;

  const r = useMemo(() => {
    const inv = invoices.filter((i) => i.status !== 'Draft' && inPeriod(i.date));
    const bills = vendorBills.filter((b) => inPeriod(b.date));
    const claims = (expenses || []).filter((e: any) => inPeriod(e.date) && ['Approved', 'Partially Approved', 'Settled'].includes(e.status));
    const revenue = inv.reduce((s, i) => s + (i.baseAmount || 0), 0);
    const vendor = bills.reduce((s, b) => s + (b.baseAmount || 0), 0);
    const field = claims.reduce((s: number, e: any) => s + (e.approvedAmount || e.requestedAmount || 0), 0);
    const outGst = inv.reduce((s, i) => s + (i.cgst || 0) + (i.sgst || 0) + (i.igst || 0), 0);
    const inGst = bills.filter((b) => b.itcEligible).reduce((s, b) => s + (b.gstAmount || 0), 0);
    const tds = taxRecords.filter((t) => inPeriod(t.paymentDate || t.depositDueDate || ''));
    return {
      revenue,
      vendor,
      field,
      profit: revenue - vendor - field,
      outGst,
      inGst,
      tdsDeposited: tds.filter((t) => t.status === 'Deposited').reduce((s, t) => s + t.tdsAmount, 0),
      tdsPending: tds.filter((t) => t.status !== 'Deposited').reduce((s, t) => s + t.tdsAmount, 0),
      byProject: projects.map((p: any) => ({ p, ...projectMoney(p, { invoices: inv, vendorBills: bills, workOrders, expenses: claims }) })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, vendorBills, expenses, taxRecords, projects, workOrders, from]);

  const margin = r.revenue ? Math.round((r.profit / r.revenue) * 1000) / 10 : 0;

  const exportExcel = async () => {
    setBusy(true);
    try {
      const label = PERIODS.find((p) => p.key === period)!.label;
      const bytes = workbookBytes([
        {
          name: 'Profit and Loss',
          title: `Bansal Geo Solutions · Profit & Loss · ${label}`,
          header: ['Line', 'Amount (₹)'],
          rows: [
            ['Revenue (invoices, before GST)', r.revenue],
            ['Vendor costs (bills, before GST)', r.vendor],
            ['Field expenses (approved claims)', r.field],
            ['Profit', r.profit],
            ['Margin %', margin],
          ],
          widths: [40, 18],
        },
        {
          name: 'GST and TDS',
          header: ['Line', 'Amount (₹)'],
          rows: [
            ['Output GST on invoices', r.outGst],
            ['Input GST credit on bills', r.inGst],
            ['Net GST payable', r.outGst - r.inGst],
            ['TDS deposited', r.tdsDeposited],
            ['TDS to deposit', r.tdsPending],
          ],
          widths: [40, 18],
        },
        {
          name: 'Projects',
          header: ['Project', 'Code', 'Client', 'Revenue (₹)', 'Vendor cost (₹)', 'Field expenses (₹)', 'Margin (₹)'],
          rows: r.byProject.map((x: any) => [x.p.title, x.p.projectCode, x.p.clientName, x.revenue, x.vendor, x.field, x.revenue - x.cost]),
          widths: [42, 20, 28, 16, 16, 18, 16],
        },
      ]);
      await saveWorkbook(bytes, `Financial_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e: any) {
      Alert.alert('Reports', e?.message || 'Could not make the file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={fd.root}>
      <AppHeader title="Financial Reports" subtitle="Profit & loss, GST, TDS and projects" />
      <ScrollView contentContainerStyle={fd.body}>
        <View style={styles.tabs}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[styles.tab, period === p.key && styles.tabOn]}>
              <Text style={[styles.tabText, period === p.key && styles.tabTextOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FdButton title="Export to Excel" Icon={Download} kind="outline" onPress={exportExcel} busy={busy} />

        <SectionHead title="Profit & Loss" />
        <View style={fd.card}>
          <Line label="Revenue (invoices, before GST)" value={r.revenue} />
          <Line label="Vendor costs" value={r.vendor} minus />
          <Line label="Field expenses" value={r.field} minus />
          <Line label="Profit" value={r.profit} strong />
          <Text style={[fd.muted, { marginTop: 6 }]}>Margin {margin}%</Text>
        </View>

        <SectionHead title="GST" />
        <View style={fd.card}>
          <Line label="Output GST on invoices" value={r.outGst} />
          <Line label="Input credit on bills" value={r.inGst} minus />
          <Line label="Net GST payable" value={r.outGst - r.inGst} strong />
        </View>

        <SectionHead title="TDS" />
        <View style={fd.card}>
          <Line label="Deposited" value={r.tdsDeposited} />
          <Line label="To deposit" value={r.tdsPending} strong />
        </View>

        <SectionHead title="By project" />
        {r.byProject.map((x: any) => (
          <View key={x.p.id} style={[fd.card, { marginBottom: 8 }]}>
            <Text style={styles.project} numberOfLines={1}>
              {x.p.title}
            </Text>
            <Text style={fd.muted}>{x.p.clientName}</Text>
            <View style={styles.cols}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Revenue</Text>
                <Text style={styles.colValue}>{inr(x.revenue)}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Cost</Text>
                <Text style={styles.colValue}>{inr(x.cost)}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Margin</Text>
                <Text style={[styles.colValue, x.revenue - x.cost < 0 && { color: colors.danger }]}>{inr(x.revenue - x.cost)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  tabOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.textInverse },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  lineStrong: { borderBottomWidth: 0, paddingTop: 12 },
  lineLabel: { fontSize: 13.5, color: colors.textSecondary, flex: 1 },
  lineValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  strong: { fontWeight: '700', color: colors.textPrimary },
  strongValue: { fontFamily: fonts.serif, fontSize: 18 },
  project: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  cols: { flexDirection: 'row', gap: 8, marginTop: 8 },
  col: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: 8 },
  colLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted },
  colValue: { fontFamily: fonts.serif, fontSize: 14.5, color: colors.textPrimary, marginTop: 2 },
});
