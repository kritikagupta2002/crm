import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PieChart, Receipt, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid, inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useFinance } from '../../context/FinanceContext';
import { useHrms } from '../../context/HrmsContext';
import { Empty, fd } from '../../fieldDatabase/components/ui';
import { budgetStatus, projectMoney } from './projectMoney';

const TONE: Record<string, { fg: string; bg: string; bar: string }> = {
  'On track': { fg: colors.successText, bg: colors.successBg, bar: colors.success },
  'Near limit': { fg: colors.warningText, bg: colors.warningBg, bar: colors.warning },
  Exceeded: { fg: colors.dangerText, bg: colors.dangerBg, bar: colors.danger },
};

/* Each project's approved budget against what it has cost so far. */
export const BudgetCostScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { projects, workOrders } = useCrm();
  const { invoices, vendorBills } = useFinance();
  const { expenses } = useHrms();

  const rows = useMemo(
    () =>
      projects.map((p: any) => {
        const m = projectMoney(p, { invoices, vendorBills, workOrders, expenses });
        const budget = p.baselineBudget || 0;
        const ratio = budget ? m.cost / budget : 0;
        return { p, ...m, budget, ratio, status: budgetStatus(ratio) };
      }),
    [projects, invoices, vendorBills, workOrders, expenses],
  );
  const budget = rows.reduce((s, r) => s + r.budget, 0);
  const spent = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <View style={fd.root}>
      <AppHeader title="Budget & Cost" subtitle="Approved budget against the cost so far" />
      <ScrollView contentContainerStyle={fd.body}>
        <StatGrid
          items={[
            { label: 'Total budget', value: inr(budget), sub: `${rows.length} projects`, Icon: PieChart, tone: 'teal' },
            { label: 'Spent', value: inr(spent), sub: budget ? `${Math.round((spent / budget) * 100)}% used` : undefined, Icon: Receipt, tone: 'amber' },
            { label: 'Remaining', value: inr(budget - spent), Icon: CheckCircle2, tone: budget - spent >= 0 ? 'green' : 'red' },
            { label: 'Near or over', value: rows.filter((r) => r.status !== 'On track').length, sub: 'projects', Icon: AlertTriangle, tone: 'red' },
          ]}
        />
        <Text style={styles.note}>Cost = vendor bills of the project's work orders + approved field expenses claimed against it.</Text>

        {rows.length === 0 ? <Empty text="No projects yet." /> : null}
        {rows.map((r) => {
          const t = TONE[r.status];
          return (
            <TouchableOpacity key={r.p.id} style={[fd.card, styles.row]} activeOpacity={0.8} onPress={() => navigation.navigate('ProjectDetail', { projectId: r.p.id })}>
              <View style={styles.head}>
                <Text style={styles.title} numberOfLines={2}>
                  {r.p.title || r.p.name}
                </Text>
                <View style={[styles.pill, { backgroundColor: t.bg }]}>
                  <Text style={[styles.pillText, { color: t.fg }]}>{r.status}</Text>
                </View>
              </View>
              <Text style={fd.muted}>
                {r.p.projectCode} · {r.p.clientName}
              </Text>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.min(100, Math.round(r.ratio * 100))}%`, backgroundColor: t.bar }]} />
              </View>
              <View style={styles.figures}>
                <Text style={styles.fig}>
                  Spent <Text style={styles.figValue}>{inr(r.cost)}</Text>
                </Text>
                <Text style={styles.fig}>
                  of <Text style={styles.figValue}>{inr(r.budget)}</Text> · {Math.round(r.ratio * 100)}%
                </Text>
              </View>
              <Text style={fd.muted}>
                Vendors {inr(r.vendor)} · field expenses {inr(r.field)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  note: { fontSize: 12, color: colors.textMuted, marginVertical: 12, lineHeight: 17 },
  row: { marginBottom: 10, gap: 3 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceSubtle, overflow: 'hidden', marginTop: 10 },
  bar: { height: 8, borderRadius: 4 },
  figures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  fig: { fontSize: 12.5, color: colors.textSecondary },
  figValue: { fontFamily: fonts.serif, fontSize: 14, color: colors.textPrimary },
});
