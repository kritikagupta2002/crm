import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Download, ClipboardCheck, CheckCircle2, XCircle, Clock, Edit3, FlaskConical } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { fieldsOf, rowsOf } from '../../fieldDatabase/data/fieldFormats';
import { BLANK_EXPECTED, DUP_RANGE, ELEMENTS, QC_SHEETS, SAMPLE_TYPE, allChecks, batchQaqc, certifiedOf, downloadQaqcWorkbook, qaqcRows } from '../../fieldDatabase/utils/qaqc';
import { formatDate } from '../../fieldDatabase/utils/date';
import { BlankCharts, CrmCharts, DuplicateCharts } from '../../fieldDatabase/components/QaqcCharts';
import { FdButton, SectionHead, Empty, fd } from '../../fieldDatabase/components/ui';

const STATE: Record<string, { label: string; tone: string; bg: string }> = {
  awaiting: { label: 'Awaiting results', tone: colors.textSecondary, bg: colors.surfaceSubtle },
  partial: { label: 'Results coming in', tone: colors.warningText, bg: colors.warningBg },
  complete: { label: 'All results in', tone: colors.successText, bg: colors.successBg },
};
export const VERDICT: Record<string, { label: string; fg: string; bg: string }> = {
  pass: { label: `Within ${DUP_RANGE[0]}–${DUP_RANGE[1]}%`, fg: colors.successText, bg: colors.successBg },
  fail: { label: `Outside ${DUP_RANGE[0]}–${DUP_RANGE[1]}%`, fg: colors.dangerText, bg: colors.dangerBg },
  open: { label: 'Rule awaited', fg: colors.textSecondary, bg: colors.surfaceSubtle },
  missing: { label: 'Awaiting', fg: colors.textMuted, bg: colors.surfaceMuted },
};

/* What each tab compares. Only the duplicate has a pass/fail rule from the client so far. */
const BLANK_RULE = `Lab value against the blank's Org value (Zn ${BLANK_EXPECTED.Zn}, Pb ${BLANK_EXPECTED.Pb}, Ag ${BLANK_EXPECTED.Ag} ppm). The client has not given a pass/fail limit for blanks yet.`;
const RULES: Record<string, string> = {
  rockBlank: BLANK_RULE,
  pulpBlank: BLANK_RULE,
  pulpDuplicate: `% = duplicate ÷ original × 100. Acceptable between ${DUP_RANGE[0]}% and ${DUP_RANGE[1]}% (client's rule).`,
  crm: "Lab value against the certified value and its 1, 2 and 3 SD lines, as in the client's sheet. The client has not given the pass/fail rule for CRMs yet.",
};

export const Verdict: React.FC<{ v: string }> = ({ v }) => {
  const t = VERDICT[v] || VERDICT.missing;
  return (
    <View style={[styles.verdict, { backgroundColor: t.bg }]}>
      <Text style={[styles.verdictText, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
};

const n = (v: any) => (v == null ? '—' : String(v));

/* One QC sample: its numbers per element and the check. */
function CheckCard({ sheetKey, r }: { sheetKey: string; r: any }) {
  const dup = sheetKey === 'pulpDuplicate';
  const crm = sheetKey === 'crm';
  return (
    <View style={styles.check}>
      <View style={styles.checkHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mono}>{r.sampleNo}</Text>
          <Text style={fd.muted}>
            {r.batchId}
            {crm ? ` · ${r.crm}` : dup ? ` · of ${r.reference}` : ''}
          </Text>
        </View>
        <Verdict v={r.verdict} />
      </View>
      <View style={styles.elRow}>
        {ELEMENTS.map((e: string) => {
          const el = r.el[e];
          const bad = el.verdict === 'fail';
          return (
            <View key={e} style={styles.el}>
              <Text style={styles.elName}>{e}</Text>
              <Text style={fd.muted}>{crm ? 'Cert' : 'Org'} {n(el.org)}</Text>
              <Text style={[styles.elLab, bad && { color: colors.danger }]}>Lab {n(el.lab)}</Text>
              {dup && el.pct != null ? <Text style={[fd.muted, bad && { color: colors.danger }]}>{el.pct}%</Text> : null}
              {crm && el.z != null ? <Text style={fd.muted}>{`${el.z > 0 ? '+' : ''}${el.z} SD`}</Text> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* Certified value and SD of each element for one CRM: from the client's sheet, or typed in here. */
function CrmValues({ crm, crmValues, canEdit, onSave }: { crm: string; crmValues: any; canEdit: boolean; onSave: (crm: string, v: any) => void }) {
  const cert = certifiedOf(crm, crmValues);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>({});
  const [error, setError] = useState('');
  const start = () => {
    setDraft(Object.fromEntries(ELEMENTS.map((e: string) => [e, { value: String(cert?.[e]?.value ?? ''), sd: String(cert?.[e]?.sd ?? '') }])));
    setError('');
    setEditing(true);
  };
  const save = () => {
    const values: any = {};
    for (const e of ELEMENTS) {
      const value = Number(draft[e].value);
      const sd = Number(draft[e].sd);
      if (draft[e].value === '' || draft[e].sd === '' || !Number.isFinite(value) || !Number.isFinite(sd) || sd <= 0) {
        return setError(`Enter the certified value and a standard deviation above 0 for ${e}.`);
      }
      values[e] = { value, sd };
    }
    try {
      onSave(crm, values);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };
  return (
    <View style={[fd.card, { marginBottom: 10 }]}>
      <View style={styles.certHead}>
        <Text style={styles.certTitle}>{crm}</Text>
        <Text style={[fd.muted, { flex: 1 }]}>{cert ? 'certified values' : 'not entered yet'}</Text>
        {canEdit && !editing ? (
          <TouchableOpacity onPress={start} style={styles.link}>
            <Edit3 size={14} color={colors.primary} />
            <Text style={styles.linkText}>{cert ? 'Edit' : 'Enter values'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.certGrid}>
        <View style={styles.certCol}>
          <Text style={styles.certLabel} />
          <Text style={styles.certRowLabel}>Certified</Text>
          <Text style={styles.certRowLabel}>SD</Text>
        </View>
        {ELEMENTS.map((e: string) => (
          <View key={e} style={styles.certCol}>
            <Text style={styles.certLabel}>{e} (ppm)</Text>
            {(['value', 'sd'] as const).map((k) =>
              editing ? (
                <TextInput
                  key={k}
                  style={styles.certInput}
                  keyboardType="decimal-pad"
                  value={draft[e][k]}
                  onChangeText={(t) => setDraft((d: any) => ({ ...d, [e]: { ...d[e], [k]: t } }))}
                />
              ) : (
                <Text key={k} style={styles.certValue}>
                  {n(cert?.[e]?.[k])}
                </Text>
              ),
            )}
          </View>
        ))}
      </View>
      {editing ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <FdButton title="Cancel" kind="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <FdButton title="Save values" onPress={save} style={{ flex: 1 }} />
          </View>
        </>
      ) : null}
    </View>
  );
}

/*
 * QAQC: the lab's results for each batch, checked against the blanks, duplicates and CRMs that went
 * with it, laid out like the client's QAQC workbook (one tab per sheet) with its charts.
 */
export const QaqcScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { canonicalRole } = useAuth();
  const { fieldRecords, visible, canManage, canEdit, crmValues, saveCrmValues } = useFieldDatabase();
  const [project, setProject] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState<string>(route.params?.batchId || 'ALL');
  const [tab, setTab] = useState('rockBlank');
  const [crmPick, setCrmPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(30);

  const batches = useMemo(
    () => visible(fieldRecords.filter((r: any) => r.section === 'dispatch-database')).sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')),
    [fieldRecords, visible],
  );
  const projects = useMemo(() => [...new Map(batches.map((b: any) => [b.projectId, b.projectName || b.projectId])).entries()], [batches]);
  const inProject = batches.filter((b: any) => project === 'ALL' || b.projectId === project);
  const shown = inProject.filter((b: any) => batchFilter === 'ALL' || b.id === batchFilter);

  const rows = useMemo(() => qaqcRows(shown, crmValues), [shown, crmValues]);
  const checks = allChecks(rows);
  const states = useMemo(() => new Map<string, any>(inProject.map((b: any) => [b.id, batchQaqc(b, crmValues)])), [inProject, crmValues]);
  const waiting = shown.filter((b: any) => ['awaiting', 'partial'].includes(states.get(b.id)?.state ?? '')).length;

  const crms = [...new Set(rows.crm.map((r: any) => r.crm))] as string[];
  const crm = crms.includes(crmPick) ? crmPick : crms[0];
  const crmRows = rows.crm.filter((r: any) => r.crm === crm);
  const counts: Record<string, number> = { rockBlank: rows.rockBlank.length, pulpBlank: rows.pulpBlank.length, pulpDuplicate: rows.pulpDuplicate.length, crm: rows.crm.length, samples: rows.samples.length };
  const typeCounts = Object.values(SAMPLE_TYPE).map((t) => [t, rows.samples.filter((s: any) => s.type === t).length] as [string, number]);

  const download = async () => {
    setBusy(true);
    try {
      await downloadQaqcWorkbook(rows);
    } catch (e: any) {
      Alert.alert('QAQC Excel', e?.message || 'Could not make the workbook.');
    } finally {
      setBusy(false);
    }
  };

  const tabRows = tab === 'crm' ? crmRows : rows[tab as keyof typeof rows] || [];

  return (
    <View style={fd.root}>
      <AppHeader title="QAQC" subtitle="Lab results against blanks, duplicates and CRMs" />
      <ScrollView contentContainerStyle={fd.body}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <FdButton title="Download Excel" Icon={Download} kind="outline" onPress={download} busy={busy} disabled={!checks.length} style={{ flex: 1 }} />
          <FdButton title="Sample Dispatch" Icon={FlaskConical} onPress={() => navigation.navigate('FieldSection', { sectionKey: 'dispatch-database' })} style={{ flex: 1 }} />
        </View>

        {projects.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[['ALL', 'All projects'], ...projects].map(([id, name]) => (
              <TouchableOpacity
                key={id}
                onPress={() => {
                  setProject(id);
                  setBatchFilter('ALL');
                }}
                style={[styles.chip, project === id && styles.chipOn]}
              >
                <Text style={[styles.chipText, project === id && styles.chipTextOn]} numberOfLines={1}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <StatGrid
          items={[
            { label: 'QC results in', value: checks.filter((c: any) => c.verdict !== 'missing').length, sub: `of ${checks.length} blanks, duplicates, CRMs`, Icon: ClipboardCheck, tone: 'blue' },
            { label: `Duplicates ${DUP_RANGE[0]}–${DUP_RANGE[1]}%`, value: rows.pulpDuplicate.filter((c: any) => c.verdict === 'pass').length, sub: `of ${rows.pulpDuplicate.length} pulp duplicates`, Icon: CheckCircle2, tone: 'green' },
            { label: 'Duplicates outside', value: rows.pulpDuplicate.filter((c: any) => c.verdict === 'fail').length, sub: "client's acceptable range", Icon: XCircle, tone: 'red' },
            { label: 'Awaiting results', value: waiting, sub: `of ${shown.length} batches`, Icon: Clock, tone: 'slate' },
          ]}
        />

        <SectionHead
          title="Batches"
          count={inProject.length}
          right={
            batchFilter !== 'ALL' ? (
              <TouchableOpacity onPress={() => setBatchFilter('ALL')}>
                <Text style={styles.linkText}>Show all</Text>
              </TouchableOpacity>
            ) : null
          }
        />
        {inProject.length === 0 ? <Empty text="No batch sent to a lab yet." /> : null}
        {inProject.map((b: any) => {
          const q: any = states.get(b.id);
          const s = STATE[q.state];
          const v = fieldsOf(b);
          const on = batchFilter === b.id;
          return (
            <TouchableOpacity key={b.id} activeOpacity={0.85} onPress={() => setBatchFilter(on ? 'ALL' : b.id)} style={[fd.card, styles.batch, on && styles.batchOn]}>
              <View style={styles.batchHead}>
                <Text style={styles.batchId}>{v.BATCH_ID || b.id}</Text>
                <View style={[styles.state, { backgroundColor: s.bg }]}>
                  <Text style={[styles.stateText, { color: s.tone }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={fd.muted}>
                {b.projectName} · {b.date ? formatDate(b.date) : ''} · {v.LAB || '—'}
              </Text>
              <View style={styles.batchFacts}>
                <Text style={styles.fact}>
                  {q.total - q.qc} + {q.qc} QC
                </Text>
                <Text style={styles.fact}>
                  Results {q.withResult}/{rowsOf(b, 'samples').length}
                </Text>
                {q.dupPass ? <Text style={[styles.fact, { color: colors.successText }]}>{q.dupPass} dup within</Text> : null}
                {q.dupFail ? <Text style={[styles.fact, { color: colors.dangerText }]}>{q.dupFail} dup outside</Text> : null}
                <Text style={styles.fact}>Lab: {v.STATUS || 'Pending'}</Text>
              </View>
              {canManage && canEdit(b) ? (
                <FdButton
                  title={q.withResult ? 'Edit results' : 'Enter results'}
                  kind="outline"
                  onPress={() => navigation.navigate('QaqcResults', { batchId: b.id })}
                  style={{ marginTop: 10, height: 40 }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { marginTop: 16 }]}>
          {[...QC_SHEETS, { key: 'samples', title: 'Sample No' }].map((t: any) => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextOn]}>
                {t.title} {counts[t.key]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {tab !== 'samples' ? <Text style={styles.rule}>{RULES[tab]}</Text> : null}

        {tab === 'rockBlank' || tab === 'pulpBlank' ? <BlankCharts rows={rows[tab]} /> : null}
        {tab === 'pulpDuplicate' ? <DuplicateCharts rows={rows.pulpDuplicate} /> : null}
        {tab === 'crm' ? (
          crms.length === 0 ? (
            <Empty text="No CRM in the batches shown." />
          ) : (
            <>
              {crms.length > 1 ? (
                <View style={[styles.chips, { flexWrap: 'wrap' }]}>
                  {crms.map((c) => (
                    <TouchableOpacity key={c} onPress={() => setCrmPick(c)} style={[styles.chip, c === crm && styles.chipOn]}>
                      <Text style={[styles.chipText, c === crm && styles.chipTextOn]}>
                        {c} · {rows.crm.filter((r: any) => r.crm === c).length}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <CrmValues
                key={crm}
                crm={crm}
                crmValues={crmValues}
                canEdit={canManage && canonicalRole !== 'employee'}
                onSave={(c, values) => saveCrmValues(c, values)}
              />
              <CrmCharts rows={crmRows} />
            </>
          )
        ) : null}

        {tab !== 'samples' ? (
          tabRows.length === 0 ? (
            <Empty text="No such samples in the batches shown." />
          ) : (
            tabRows.slice(0, limit).map((r: any) => <CheckCard key={r.sampleNo} sheetKey={tab} r={r} />)
          )
        ) : (
          <>
            <View style={[styles.chips, { flexWrap: 'wrap' }]}>
              {typeCounts.map(([t, c]) => (
                <View key={t} style={styles.typeChip}>
                  <Text style={styles.typeText}>
                    {t} <Text style={{ fontWeight: '700' }}>{c}</Text>
                  </Text>
                </View>
              ))}
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>
                  Ordinary <Text style={{ fontWeight: '700' }}>{rows.samples.length - typeCounts.reduce((s, [, c]) => s + c, 0)}</Text>
                </Text>
              </View>
            </View>
            {rows.samples.slice(0, limit).map((s: any) => (
              <View key={s.sampleNo} style={styles.sampleRow}>
                <Text style={[styles.mono, { flex: 1 }]}>{s.sampleNo}</Text>
                <Text style={[fd.muted, { width: 92 }]} numberOfLines={1}>
                  {s.type}
                </Text>
                {s.hasResult ? <CheckCircle2 size={16} color={colors.success} /> : <Text style={fd.muted}>—</Text>}
              </View>
            ))}
          </>
        )}
        {(tab === 'samples' ? rows.samples.length : tabRows.length) > limit ? (
          <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setLimit((l) => l + 60)}>
            <Text style={styles.linkText}>Show more</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chips: { gap: 8, paddingBottom: 10, flexDirection: 'row' },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface, maxWidth: 240 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.textInverse },
  batch: { marginBottom: 8, gap: 3 },
  batchOn: { borderColor: colors.primary, borderWidth: 1.5 },
  batchHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  batchId: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  state: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  stateText: { fontSize: 11.5, fontWeight: '700' },
  batchFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  fact: { fontSize: 12, color: colors.textSecondary, backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  tab: { paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium },
  tabOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.textInverse },
  rule: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, backgroundColor: colors.primaryBg, padding: 10, borderRadius: radius.md, marginBottom: 10 },
  verdict: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  verdictText: { fontSize: 11, fontWeight: '700' },
  check: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, padding: 10, marginBottom: 6 },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mono: { fontFamily: 'monospace', fontSize: 13, color: colors.textPrimary },
  elRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  el: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: 7 },
  elName: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  elLab: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, marginTop: 1 },
  certHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  certTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  certGrid: { flexDirection: 'row', gap: 6, marginTop: 10 },
  certCol: { flex: 1, gap: 6 },
  certLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, height: 18 },
  certRowLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary, height: 36, lineHeight: 36 },
  certValue: { fontSize: 14, color: colors.textPrimary, height: 36, lineHeight: 36 },
  certInput: { height: 36, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.sm, paddingHorizontal: 8, fontSize: 14, color: colors.textPrimary },
  error: { fontSize: 12.5, color: colors.danger, marginTop: 8 },
  typeChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 12, color: colors.textSecondary },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
});
