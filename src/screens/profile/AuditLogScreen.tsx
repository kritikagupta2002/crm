import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Search, Download, History } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';
import { workbookBytes } from '../../fieldDatabase/utils/xlsx';
import { saveWorkbook } from '../../fieldDatabase/utils/save';

interface AuditNavProps {
  navigation: any;
}

type Area = 'Sales' | 'Projects' | 'Vendors' | 'Documents';
interface Entry {
  id: string;
  at: string;
  who: string;
  area: Area;
  ref: string;
  text: string;
}

const AREAS: Array<'All' | Area> = ['All', 'Sales', 'Projects', 'Vendors', 'Documents'];
const PERIODS = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const whenOf = (at: string) => {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return at.length > 10 ? `${day}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : day;
};

/*
 * Every change, with who made it and when, as on the web's Audit Log: built from the history the
 * records already keep (enquiries, client questions, projects, tenders, work orders, vendor
 * applications and government letters).
 */
export const AuditLogScreen: React.FC<AuditNavProps> = () => {
  const { leads, projects, tenders, workOrders, vendorApplications, govtDocuments } = useCrm();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState<'All' | Area>('All');
  const [period, setPeriod] = useState('30');
  const [busy, setBusy] = useState(false);

  const entries = useMemo(() => {
    const list: Entry[] = [];
    leads.forEach((l: any) => {
      if (l.createdAt) list.push({ id: `${l.id}-created`, at: l.createdAt, who: l.createdBy?.name || l.assignedTo || '—', area: 'Sales', ref: l.id, text: `Enquiry created for ${l.company}` });
      (l.queries || []).forEach((q: any) => {
        list.push({ id: `${q.id}-asked`, at: q.at, who: l.contactPerson || 'Client', area: 'Sales', ref: l.id, text: `Client asked (${q.topic}): ${q.message}` });
        if (q.repliedAt) list.push({ id: `${q.id}-answered`, at: q.repliedAt, who: q.repliedBy || '—', area: 'Sales', ref: l.id, text: `Answered client question: ${q.reply || ''}` });
      });
    });
    projects.forEach((p: any) =>
      (p.history || []).forEach((h: any) => list.push({ id: `${p.id}-${h.id}`, at: h.date, who: p.team?.coordinator || p.team?.teamLead || '—', area: 'Projects', ref: p.projectCode || p.code || p.id, text: h.text })),
    );
    const trail = (records: any[], area: Area, refOf: (r: any) => string) =>
      records.forEach((r) =>
        (r.history || []).forEach((h: any, i: number) =>
          list.push({ id: `${r.id}-${i}`, at: h.at, who: h.by || '—', area, ref: refOf(r), text: h.note ? `${h.action}: ${h.note}` : h.action }),
        ),
      );
    trail(tenders || [], 'Vendors', (t) => t.tenderNo || t.refNo || t.id);
    trail(workOrders || [], 'Vendors', (w) => w.woNumber || w.id);
    trail(vendorApplications || [], 'Vendors', (a) => a.firm?.name || a.id);
    (govtDocuments || []).forEach((d: any) =>
      (d.record?.events || []).forEach((e: any, i: number) => list.push({ id: `${d.id}-${i}`, at: e.at, who: e.by || '—', area: 'Documents', ref: d.letter?.ref || d.id, text: e.text })),
    );
    return list.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at));
  }, [leads, projects, tenders, workOrders, vendorApplications, govtDocuments]);

  const since = period === 'all' ? '' : new Date(Date.now() - Number(period) * 86400000).toISOString().slice(0, 10);
  const q = search.trim().toLowerCase();
  const shown = entries.filter(
    (e) => (area === 'All' || e.area === area) && (!since || e.at.slice(0, 10) >= since) && (!q || `${e.who} ${e.text} ${e.ref}`.toLowerCase().includes(q)),
  );

  const exportExcel = async () => {
    setBusy(true);
    try {
      const bytes = workbookBytes([
        {
          name: 'Audit Log',
          title: `Bansal Geo Solutions · Audit Log · ${PERIODS.find((p) => p.key === period)!.label}`,
          header: ['When', 'Who', 'Area', 'Record', 'What changed'],
          rows: shown.map((e) => [whenOf(e.at), e.who, e.area, e.ref, e.text]),
        },
      ]);
      await saveWorkbook(bytes, 'Audit_Log.xlsx');
    } catch (err: any) {
      Alert.alert('Audit Log', err?.message || 'Could not build the Excel file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={fd.root}>
      <AppHeader title="Audit Log" subtitle="Every change, with who made it and when" />
      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        contentContainerStyle={fd.body}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.searchBar}>
              <Search size={17} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search person, change or record"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {AREAS.map((a) => (
                <TouchableOpacity key={a} onPress={() => setArea(a)} style={[styles.chip, area === a && styles.chipOn]}>
                  <Text style={[styles.chipText, area === a && styles.chipTextOn]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 0 }]}>
              {PERIODS.map((p) => (
                <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={[styles.chip, period === p.key && styles.chipOn]}>
                  <Text style={[styles.chipText, period === p.key && styles.chipTextOn]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.countRow}>
              <Text style={fd.muted}>{shown.length} changes</Text>
              <FdButton title="Excel" Icon={Download} kind="outline" onPress={exportExcel} busy={busy} disabled={!shown.length} style={styles.exportBtn} />
            </View>
          </View>
        }
        ListEmptyComponent={<Empty text="No changes in this period." />}
        renderItem={({ item: e }) => (
          <View style={[fd.card, styles.row]}>
            <View style={styles.icon}>
              <History size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{e.text}</Text>
              <Text style={styles.meta}>
                {e.who} · {e.area} · {e.ref}
              </Text>
              <Text style={styles.meta}>{whenOf(e.at)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.textInverse },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  exportBtn: { height: 36 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
