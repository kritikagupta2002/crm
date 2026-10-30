import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Download, Edit3, ClipboardCheck, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, fonts, radius } from '../../theme';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { getFieldSectionByKey } from '../../fieldDatabase/data/fieldDatabase';
import { bound, codeLabel, fieldsOf, formatOf, recordStat, rowsOf, withCalcs } from '../../fieldDatabase/data/fieldFormats';
import { heading, inClientOrder, rowColumns } from '../../fieldDatabase/utils/formatRows';
import { dispatchNumber } from '../../fieldDatabase/utils/dispatch';
import { downloadRecordWorkbook } from '../../fieldDatabase/utils/fieldExcel';
import { formatDate } from '../../fieldDatabase/utils/date';
import { KindPill } from '../../fieldDatabase/components/DispatchBatch';
import { FdButton, Pair, SectionHead, StatusPill, Empty, fd } from '../../fieldDatabase/components/ui';

const blank = (v: any) => v === '' || v == null;
const shown = (fld: any, v: any) => (blank(v) ? '—' : fld.type === 'code' ? codeLabel(fld.list, v) : String(v));

/* Long tables open a few rows at a time. */
const STEP = 20;

/* A record in the client's format: its values in their order, under their headings, then every row. */
export const FieldRecordDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { fieldRecords, canEdit } = useFieldDatabase();
  const record = fieldRecords.find((r: any) => r.id === route.params?.recordId);
  const [busy, setBusy] = useState(false);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [openRow, setOpenRow] = useState<string | null>(null);

  if (!record) {
    return (
      <View style={fd.root}>
        <AppHeader title="Record" />
        <View style={fd.body}>
          <Empty text="This record is not available." />
        </View>
      </View>
    );
  }
  const section = getFieldSectionByKey(record.section);
  const fmt = formatOf(record.section);
  const values = fieldsOf(record);
  const isDispatch = record.section === 'dispatch-database';

  const download = async () => {
    setBusy(true);
    try {
      await downloadRecordWorkbook(record);
    } catch (e: any) {
      Alert.alert('Excel', e?.message || 'Could not make the workbook.');
    } finally {
      setBusy(false);
    }
  };

  const filled = fmt ? inClientOrder(fmt, fmt.header.filter((f: any) => !f.bind && !blank(values[f.id]))) : [];

  return (
    <View style={fd.root}>
      <AppHeader title={record.id} subtitle={section?.shortTitle} />
      <ScrollView contentContainerStyle={fd.body}>
        <View style={fd.card}>
          <View style={styles.topRow}>
            <Text style={styles.project} numberOfLines={2}>
              {record.projectName || record.projectId}
            </Text>
            <StatusPill status={record.status} />
          </View>
          <Text style={fd.muted}>
            {record.projectId} · {record.date ? formatDate(record.date) : '—'} · {record.employeeName || record.createdBy}
          </Text>
          {fmt ? (
            <View style={styles.format}>
              <FileText size={13} color={colors.goldDark} />
              <Text style={styles.formatText}>Format: {fmt.workbook.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
        </View>

        {isDispatch ? (
          <View style={[fd.card, styles.strip]}>
            <View style={fd.pairs}>
              <Pair label="DISPATCH NO." value={dispatchNumber(values, record.date)} wide mono />
              <Pair label="SAMPLES" value={`${recordStat(record.section, record, 'ordinary')} + ${recordStat(record.section, record, 'qc')} QC`} />
              <Pair label="LAB STATUS" value={values.STATUS || 'Pending'} />
            </View>
            <View style={styles.stripActions}>
              <FdButton title="QAQC" Icon={ClipboardCheck} kind="outline" onPress={() => navigation.navigate('Qaqc', { batchId: record.id })} style={{ flex: 1 }} />
              <FdButton title="Dispatch letter" Icon={FileText} onPress={() => navigation.navigate('DispatchLetter', { recordId: record.id })} style={{ flex: 1.3 }} />
            </View>
          </View>
        ) : null}

        {fmt && filled.length ? (
          <View style={[fd.card, { marginTop: 12 }]}>
            <View style={fd.pairs}>
              {filled.map((fld: any) => (
                <Pair key={fld.id} label={heading(fld)} value={shown(fld, values[fld.id])} wide={fld.type === 'textarea'} />
              ))}
            </View>
          </View>
        ) : null}

        {!fmt ? (
          <View style={[fd.card, { marginTop: 12 }]}>
            <View style={fd.pairs}>
              <Pair label="LOCATION" value={record.metadata?.location || '—'} wide />
              <Pair label="SAMPLE / BOREHOLE ID" value={record.metadata?.sampleOrBoreholeId || '—'} mono />
              <Pair
                label="COORDINATES"
                value={[record.metadata?.coordinates?.latitude, record.metadata?.coordinates?.longitude, record.metadata?.coordinates?.elevation].filter(Boolean).join(', ') || '—'}
              />
              <Pair label="REMARKS" value={record.metadata?.remarks || '—'} wide />
            </View>
          </View>
        ) : null}

        {fmt?.tables.map((table: any) => {
          const rows = rowsOf(record, table.key).map((r: any) => withCalcs(table.columns, r));
          const cols = rowColumns(table.columns).filter((c: any) => rows.some((r: any) => !blank(r[c.id])));
          const limit = limits[table.key] ?? STEP;
          return (
            <View key={table.key}>
              <SectionHead title={table.title} count={rows.length} />
              {rows.length === 0 ? <Empty text="None recorded." /> : null}
              {rows.slice(0, limit).map((r: any, i: number) => {
                const key = `${table.key}-${i}`;
                const open = openRow === key;
                // The row number is the badge and the kind its pill, so the summary starts after them.
                const head = cols
                  .filter((c: any) => c.id !== 'QC' && c.id !== 'SEQ')
                  .slice(0, 3)
                  .map((c: any) => `${heading(c)} ${blank(r[c.id]) ? '—' : r[c.id]}`)
                  .join('  ·  ');
                return (
                  <View key={key} style={styles.row}>
                    <TouchableOpacity style={styles.rowHead} onPress={() => setOpenRow(open ? null : key)} activeOpacity={0.7}>
                      <Text style={styles.seq}>{i + 1}</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.rowSummary} numberOfLines={2}>
                          {head}
                        </Text>
                        {r.QC ? <KindPill kind={r.QC} /> : null}
                      </View>
                      {open ? <ChevronUp size={17} color={colors.textMuted} /> : <ChevronDown size={17} color={colors.textMuted} />}
                    </TouchableOpacity>
                    {open ? (
                      <View style={[fd.pairs, styles.rowBody]}>
                        {cols.map((c: any) => (
                          <Pair key={c.id} label={heading(c)} value={blank(r[c.id]) ? String(bound(c, record) ?? '—') : shown(c, r[c.id])} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {rows.length > limit ? (
                <TouchableOpacity style={styles.more} onPress={() => setLimits((l) => ({ ...l, [table.key]: limit + STEP * 3 }))}>
                  <Text style={styles.moreText}>Show more ({rows.length - limit} left)</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.audit}>
          Created {record.createdAt ? new Date(record.createdAt).toLocaleString('en-IN') : '—'} by {record.createdBy || record.employeeName}
          {record.updatedAt && record.updatedAt !== record.createdAt
            ? `\nLast updated ${new Date(record.updatedAt).toLocaleString('en-IN')} by ${record.updatedBy || record.createdBy}`
            : ''}
        </Text>

        <View style={styles.footer}>
          {fmt ? <FdButton title="Download Excel" Icon={Download} kind="outline" onPress={download} busy={busy} style={{ flex: 1 }} /> : null}
          {canEdit(record) ? (
            <FdButton title="Edit record" Icon={Edit3} onPress={() => navigation.navigate('FieldRecordForm', { sectionKey: record.section, recordId: record.id })} style={{ flex: 1 }} />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' },
  project: { flex: 1, fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary },
  format: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  formatText: { fontSize: 12, fontWeight: '600', color: colors.goldDark },
  strip: { marginTop: 12, borderLeftWidth: 4, borderLeftColor: colors.gold },
  stripActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  row: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, marginBottom: 6, overflow: 'hidden' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  seq: { width: 26, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  rowSummary: { fontSize: 12.5, color: colors.textSecondary },
  rowBody: { paddingHorizontal: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  more: { alignItems: 'center', padding: 12 },
  moreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  audit: { fontSize: 11.5, color: colors.textMuted, marginTop: 16, lineHeight: 17 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
