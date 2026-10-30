import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TestTubes, Ruler, FlaskConical, Truck, ClipboardCheck, ChevronRight, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { FIELD_SECTIONS, getFieldSectionByKey } from '../../fieldDatabase/data/fieldDatabase';
import { fieldsOf, formatOf, recordStat, rowsOf } from '../../fieldDatabase/data/fieldFormats';
import { fieldNumber, sampleRegister } from '../../fieldDatabase/utils/dispatch';
import { formatDayMonth, formatDate } from '../../fieldDatabase/utils/date';
import { SectionHead, StatusPill, Empty, fd, sectionIcon } from '../../fieldDatabase/components/ui';

const LAB_DONE = ['QAQC passes', 'QAQC Failed', 'Partly accepted', 'Partly Rejected'];
const LAB_BAD = ['QAQC Failed', 'Partly Rejected'];

/* A horizontal bar per item, the value at its end (samples by format, metres per day). */
function Bars({ items, unit = '' }: { items: { label: string; value: number; onPress?: () => void }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={{ gap: 8 }}>
      {items.map((i) => (
        <TouchableOpacity key={i.label} disabled={!i.onPress} onPress={i.onPress} style={styles.barRow} activeOpacity={0.7}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {i.label}
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.bar, { width: `${Math.max(4, (i.value / max) * 100)}%` }]} />
          </View>
          <Text style={styles.barValue}>
            {i.value}
            {unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/*
 * The Field Database: the picture of the field work (samples, metres drilled, lab batches), every
 * section in the client's format, QAQC and the latest records, as on the web.
 */
export const FieldDatabaseHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { fieldRecords, visible } = useFieldDatabase();
  const records = useMemo(() => visible(fieldRecords), [fieldRecords, visible]);
  const register = useMemo(() => sampleRegister(records), [records]);

  const bySection = useMemo(() => {
    const counts: Record<string, number> = {};
    register.forEach((s: any) => (counts[s.section] = (counts[s.section] ?? 0) + 1));
    return FIELD_SECTIONS.filter((s: any) => counts[s.key]).map((s: any) => ({
      label: s.shortTitle,
      value: counts[s.key],
      onPress: () => navigation.navigate('FieldSection', { sectionKey: s.key }),
    }));
  }, [register, navigation]);

  const dprs = records.filter((r: any) => r.section === 'core-drilling-dpr');
  const drilling = useMemo(() => {
    const days = new Map<string, number>();
    dprs.forEach((r: any) => days.set(r.date, (days.get(r.date) ?? 0) + (Number(recordStat('core-drilling-dpr', r, 'metres')) || 0)));
    return [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-10).map(([d, m]) => ({ label: formatDayMonth(d), value: Number(m.toFixed(1)) }));
  }, [dprs]);
  const metres = drilling.reduce((t, d) => t + d.value, 0);

  const batches = records.filter((r: any) => r.section === 'dispatch-database').sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
  const atLab = batches.filter((b: any) => !LAB_DONE.includes(fieldsOf(b).STATUS)).reduce((t: number, b: any) => t + rowsOf(b, 'samples').length, 0);
  // Whoever sent it: an employee's sample in a colleague's batch has gone to the lab too.
  const sentNumbers = new Set(fieldRecords.filter((r: any) => r.section === 'dispatch-database').flatMap((b: any) => rowsOf(b, 'samples').map(fieldNumber)));
  const notSent = register.filter((s: any) => !sentNumbers.has(s.number) && (!s.cat || s.cat === 'ORD')).length;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    records.forEach((r: any) => (c[r.section] = (c[r.section] ?? 0) + 1));
    return c;
  }, [records]);

  return (
    <View style={fd.root}>
      <AppHeader title="Field Database" subtitle="Mapping, sampling, drilling and lab dispatch in the client's formats" />
      <ScrollView contentContainerStyle={fd.body}>
        <StatGrid
          items={[
            { label: 'Samples recorded', value: register.length, sub: `across ${bySection.length} formats`, Icon: TestTubes, tone: 'blue' },
            { label: 'Metres drilled', value: Number(metres.toFixed(1)), sub: `${dprs.length} daily reports`, Icon: Ruler, tone: 'green' },
            { label: 'Samples at the lab', value: atLab, sub: 'waiting for results', Icon: FlaskConical, tone: 'amber' },
            { label: 'Not yet dispatched', value: notSent, sub: 'ordinary samples', Icon: Truck, tone: 'slate' },
          ]}
        />

        <TouchableOpacity style={[fd.card, styles.qaqc]} activeOpacity={0.8} onPress={() => navigation.navigate('Qaqc', {})}>
          <View style={styles.qaqcIcon}>
            <ClipboardCheck size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.qaqcTitle}>QAQC</Text>
            <Text style={fd.muted}>Lab results checked against blanks, duplicates and CRMs</Text>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </TouchableOpacity>

        <SectionHead title="Sections" count={FIELD_SECTIONS.length} />
        {FIELD_SECTIONS.map((s: any) => {
          const Icon = sectionIcon(s);
          const hasFormat = !!formatOf(s.key);
          return (
            <TouchableOpacity key={s.key} style={[fd.card, styles.section]} activeOpacity={0.8} onPress={() => navigation.navigate('FieldSection', { sectionKey: s.key })}>
              <View style={styles.sectionIcon}>
                <Icon size={19} color={colors.goldDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{s.shortTitle}</Text>
                <Text style={fd.muted} numberOfLines={1}>
                  {hasFormat ? `Format: ${formatOf(s.key).workbook.replace(/_/g, ' ')}` : 'Format awaited from the client'}
                </Text>
              </View>
              <Text style={styles.sectionCount}>{counts[s.key] || 0}</Text>
              <ChevronRight size={17} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}

        <SectionHead title="Samples by format" />
        <View style={fd.card}>{bySection.length ? <Bars items={bySection} /> : <Empty text="No samples recorded yet." />}</View>

        <SectionHead title="Metres drilled per day" />
        <View style={fd.card}>{drilling.length ? <Bars items={drilling} unit=" m" /> : <Empty text="No drilling reports yet." />}</View>

        <SectionHead
          title="Lab batches"
          right={
            <TouchableOpacity onPress={() => navigation.navigate('FieldSection', { sectionKey: 'dispatch-database' })}>
              <Text style={styles.link}>Sample dispatch</Text>
            </TouchableOpacity>
          }
        />
        {batches.length === 0 ? <Empty text="No batch sent to a lab yet." /> : null}
        {batches.slice(0, 5).map((b: any) => {
          const v = fieldsOf(b);
          const status = v.STATUS || 'Pending';
          const steps = [
            { label: 'Dispatched', on: b.date, done: true, bad: false },
            { label: 'At lab', on: v.LAB_RECEIVED, done: Boolean(v.LAB_RECEIVED) || status !== 'Pending', bad: false },
            { label: LAB_DONE.includes(status) ? status : 'Results', on: v.RESULT_RECEIVED, done: LAB_DONE.includes(status), bad: LAB_BAD.includes(status) },
          ];
          return (
            <TouchableOpacity key={b.id} style={[fd.card, { marginBottom: 8 }]} activeOpacity={0.8} onPress={() => navigation.navigate('FieldRecordDetail', { recordId: b.id })}>
              <Text style={styles.batchId}>{v.BATCH_ID || b.id}</Text>
              <Text style={fd.muted}>
                {v.LAB} · {String(v.DATA_TYPE || '').toLowerCase()} · {rowsOf(b, 'samples').length} samples
              </Text>
              <View style={styles.steps}>
                {steps.map((s) => {
                  const Icon = s.bad ? XCircle : s.done ? CheckCircle2 : s.label === 'Results' ? Clock : Circle;
                  const tint = s.bad ? colors.danger : s.done ? colors.success : colors.textTertiary;
                  return (
                    <View key={s.label} style={styles.step}>
                      <Icon size={15} color={tint} />
                      <View>
                        <Text style={[styles.stepLabel, { color: s.done || s.bad ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
                          {s.label}
                        </Text>
                        {s.on ? <Text style={styles.stepDate}>{formatDayMonth(s.on)}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}

        <SectionHead title="Recent records" />
        {records.slice(0, 8).map((r: any) => (
          <TouchableOpacity key={r.id} style={styles.recent} activeOpacity={0.75} onPress={() => navigation.navigate('FieldRecordDetail', { recordId: r.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentId}>{r.id}</Text>
              <Text style={fd.muted} numberOfLines={1}>
                {getFieldSectionByKey(r.section)?.shortTitle} · {r.date ? formatDate(r.date) : ''} · {r.employeeName || r.createdBy}
              </Text>
            </View>
            <StatusPill status={r.status} />
          </TouchableOpacity>
        ))}
        {records.length === 0 ? <Empty text="No field records yet." /> : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  qaqc: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, borderLeftWidth: 4, borderLeftColor: colors.primary },
  qaqcIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  qaqcTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary },
  section: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 12 },
  sectionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldBg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
  sectionCount: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary, minWidth: 22, textAlign: 'right' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 110, fontSize: 12, color: colors.textSecondary },
  barTrack: { flex: 1, height: 14, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  bar: { height: 14, borderRadius: 4, backgroundColor: colors.primaryLight },
  barValue: { minWidth: 44, textAlign: 'right', fontSize: 12.5, fontWeight: '700', color: colors.textPrimary },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  batchId: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  steps: { flexDirection: 'row', gap: 10, marginTop: 10 },
  step: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  stepLabel: { fontSize: 12, fontWeight: '600' },
  stepDate: { fontSize: 11, color: colors.textMuted },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  recentId: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
