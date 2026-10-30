import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Search, Plus, Download, FileText, AlertCircle } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, fonts, radius } from '../../theme';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { getFieldSectionByKey } from '../../fieldDatabase/data/fieldDatabase';
import { codeLabel, fieldsOf, formatOf, recordStat } from '../../fieldDatabase/data/fieldFormats';
import { downloadSectionWorkbook } from '../../fieldDatabase/utils/fieldExcel';
import { formatDate } from '../../fieldDatabase/utils/date';
import { FdButton, StatusPill, Empty, fd, sectionIcon } from '../../fieldDatabase/components/ui';

/* A list value of a record: a header value (a code shows its meaning) or a total ('@metres'). */
function listCell(sectionKey: string, record: any, id: string) {
  if (id.startsWith('@')) {
    const v = recordStat(sectionKey, record, id.slice(1));
    return v === '' || v == null ? '—' : String(v);
  }
  const fmt = formatOf(sectionKey);
  const fld = fmt.header.find((f: any) => f.id === id);
  const v = fieldsOf(record)[id];
  if (v === '' || v == null) return '—';
  return fld?.type === 'code' ? codeLabel(fld.list, v) : String(v);
}

/* One Field Database section: its records in the client's format, the Excel download and Add record. */
export const FieldSectionScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const section = getFieldSectionByKey(route.params?.sectionKey);
  const fmt = section ? formatOf(section.key) : null;
  const { fieldRecords, visible, canManage } = useFieldDatabase();

  const [query, setQuery] = useState('');
  const [project, setProject] = useState('ALL');
  const [busy, setBusy] = useState(false);

  const mine = useMemo(() => (section ? visible(fieldRecords.filter((r: any) => r.section === section.key)) : []), [fieldRecords, section, visible]);
  const projects = useMemo(() => [...new Map(mine.map((r: any) => [r.projectId, r.projectName || r.projectId])).entries()], [mine]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine.filter((r: any) => {
      if (project !== 'ALL' && r.projectId !== project) return false;
      if (!q) return true;
      return [r.id, r.projectName, r.projectId, r.employeeName, r.metadata?.location, r.metadata?.sampleOrBoreholeId, JSON.stringify(r.data ?? {})]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [mine, project, query]);

  if (!section) return null;
  const Icon = sectionIcon(section);

  const download = async () => {
    if (!fmt) return;
    setBusy(true);
    try {
      // A workbook the app splits over sections (CORE DRILL_LOG_SAMPLE) comes whole, with the other sections' records.
      const related = visible(
        fieldRecords.filter((r: any) => r.section !== section.key && formatOf(r.section)?.workbook === fmt.workbook && (project === 'ALL' || r.projectId === project)),
      );
      await downloadSectionWorkbook(section, shown, related);
    } catch (e: any) {
      Alert.alert('Excel', e?.message || 'Could not make the workbook.');
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: 'Records', value: mine.length },
    { label: 'Submitted', value: mine.filter((r: any) => r.status !== 'Draft').length },
    { label: 'Drafts', value: mine.filter((r: any) => r.status === 'Draft').length },
    { label: 'Projects', value: projects.length },
  ];

  return (
    <View style={fd.root}>
      <AppHeader title={section.shortTitle} subtitle={fmt ? `Format: ${fmt.workbook.replace(/_/g, ' ')}` : section.category} />
      <ScrollView contentContainerStyle={fd.body} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <View style={styles.icon}>
            <Icon size={22} color={colors.goldDark} />
          </View>
          <Text style={styles.desc}>{section.description}</Text>
        </View>

        {!fmt ? (
          <View style={styles.notice}>
            <AlertCircle size={16} color={colors.warningText} />
            <Text style={styles.noticeText}>
              Final format awaited. The client has not sent a format for {section.title} yet, so records keep the common fields (project, location, sample / borehole ID,
              coordinates, remarks).
            </Text>
          </View>
        ) : null}

        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {fmt ? <FdButton title="Download Excel" Icon={Download} kind="outline" onPress={download} busy={busy} disabled={!shown.length} style={{ flex: 1 }} /> : null}
          {canManage ? (
            <FdButton title="Add record" Icon={Plus} onPress={() => navigation.navigate('FieldRecordForm', { sectionKey: section.key })} style={{ flex: 1 }} />
          ) : null}
        </View>

        <View style={styles.search}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search ID, sample, location, project"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        {projects.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[['ALL', 'All projects'], ...projects].map(([id, name]) => (
              <TouchableOpacity key={id} onPress={() => setProject(id)} style={[styles.chip, project === id && styles.chipOn]}>
                <Text style={[styles.chipText, project === id && styles.chipTextOn]} numberOfLines={1}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {shown.length === 0 ? (
          <Empty text={query || project !== 'ALL' ? 'No records match the search.' : `No ${section.title} records yet.`} />
        ) : (
          shown.map((r: any) => (
            <TouchableOpacity key={r.id} style={[fd.card, styles.record]} activeOpacity={0.8} onPress={() => navigation.navigate('FieldRecordDetail', { recordId: r.id })}>
              <View style={styles.recordHead}>
                <Text style={styles.recordId}>{r.id}</Text>
                <StatusPill status={r.status} />
              </View>
              <Text style={styles.project} numberOfLines={1}>
                {r.projectName || r.projectId}
              </Text>
              <Text style={fd.muted}>
                {r.date ? formatDate(r.date) : '—'} · {r.employeeName || r.createdBy || '—'}
              </Text>
              <View style={styles.cols}>
                {(fmt ? fmt.listColumns : [['@loc', 'Location'], ['@id', 'Sample / BH']]).map(([id, label]: [string, string]) => (
                  <View key={label} style={styles.col}>
                    <Text style={styles.colLabel}>{label}</Text>
                    <Text style={styles.colValue} numberOfLines={1}>
                      {fmt ? listCell(section.key, r, id) : id === '@loc' ? r.metadata?.location || '—' : r.metadata?.sampleOrBoreholeId || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
        {shown.length ? (
          <View style={styles.foot}>
            <FileText size={13} color={colors.textMuted} />
            <Text style={fd.muted}>
              {shown.length} record{shown.length === 1 ? '' : 's'} shown
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldBg, alignItems: 'center', justifyContent: 'center' },
  desc: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.warningBg, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 12.5, color: colors.warningText, lineHeight: 18 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, paddingVertical: 10, alignItems: 'center' },
  statValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: colors.textPrimary },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface, maxWidth: 220 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.textInverse },
  record: { marginTop: 10, gap: 3 },
  recordHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordId: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  project: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  col: { minWidth: '22%', flexGrow: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 6 },
  colLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  colValue: { fontSize: 13, color: colors.textPrimary, marginTop: 1 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14 },
});
