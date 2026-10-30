import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CheckSquare, Square, Shuffle, ListChecks, AlertCircle } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme';
import { codeLabel } from '../data/fieldFormats';
import { getFieldSectionByKey } from '../data/fieldDatabase';
import { kindTone } from '../utils/formatRows';
import {
  BATCH_NOTE,
  DATA_TYPE_SECTIONS,
  MAX_BATCH,
  QC_RULES,
  buildBatch,
  dispatchedSamples,
  fieldNumber,
  maxOrdinary,
  nextSeriesStart,
  sampleRegister,
  seriesOf,
} from '../utils/dispatch';

/* Colours of the sample kinds: ordinary, blanks, CRMs, duplicates. */
export const KIND: Record<string, { fg: string; bg: string }> = {
  ord: { fg: colors.textSecondary, bg: colors.surfaceSubtle },
  blank: { fg: colors.info, bg: colors.infoBg },
  crm: { fg: colors.goldDark, bg: colors.goldBg },
  dup: { fg: colors.success, bg: colors.successBg },
};

export const KindPill: React.FC<{ kind: string; count?: number }> = ({ kind, count }) => {
  const t = KIND[kindTone(kind)];
  return (
    <View style={[styles.kind, { backgroundColor: t.bg }]}>
      <Text style={[styles.kindText, { color: t.fg }]}>
        {kind}
        {count != null ? `  ${count}` : ''}
      </Text>
    </View>
  );
};

interface Props {
  fields: Record<string, any>;
  rows: any[];
  onRowsChange: (rows: any[]) => void;
  projectId: string;
  /** The code the running numbers start with: <code>/001. */
  projectCode: string;
  records: any[];
  recordId?: string;
}

/*
 * Sample details of a dispatch: the samples of the chosen data type not sent to a lab yet, and the
 * batch built from the ticked ones with the QC samples put in their places by the client's rules.
 */
export const DispatchBatch: React.FC<Props> = ({ fields, rows, onRowsChange, projectId, projectCode, records, recordId }) => {
  const fitsInBatch = useMemo(() => maxOrdinary(), []);
  const sent = useMemo(() => dispatchedSamples(records, recordId), [records, recordId]);
  const available = useMemo(() => {
    const sections: string[] = (DATA_TYPE_SECTIONS as Record<string, string[]>)[fields.DATA_TYPE] ?? [];
    // Ordinary samples only: duplicates and standards are put in by the QC rules.
    return sampleRegister(records).filter((s: any) => sections.includes(s.section) && (!projectId || s.projectId === projectId) && (!s.cat || s.cat === 'ORD'));
  }, [records, fields.DATA_TYPE, projectId]);

  const [picked, setPicked] = useState<Set<string>>(() => new Set(rows.filter((r) => r.QC === 'Ordinary').map(fieldNumber)));
  const [error, setError] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  const free = available.filter((s: any) => !sent.has(s.number));
  const toggle = (num: string) => {
    const next = new Set(picked);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setPicked(next);
  };
  const allPicked = free.length > 0 && free.every((s: any) => picked.has(s.number));

  const build = () => {
    const ordinary = free.filter((s: any) => picked.has(s.number));
    if (!ordinary.length) return setError('Tick the samples that go in this batch.');
    // Rebuilt, a batch keeps the running numbers it started with; a new one carries on from the project's last batch.
    const own = rows[0]?.SAMPLE_NUMBER?.startsWith(`${projectCode}/`) ? seriesOf(rows[0].SAMPLE_NUMBER) : null;
    const start = own ?? nextSeriesStart(records, projectId, recordId, projectCode);
    const batch = buildBatch(ordinary, { crm: fields.CRM, pulpBlank: fields.PULP_BLANK, rockBlank: fields.ROCK_BLANK, projectCode, start });
    if (batch.length > MAX_BATCH) {
      return setError(`That makes ${batch.length} samples with QC. A batch can hold ${MAX_BATCH}, so tick ${fitsInBatch} or fewer and send the rest in the next batch.`);
    }
    setError('');
    onRowsChange(batch);
  };

  const counts = rows.reduce((t: any, r: any) => ({ ...t, [r.QC]: (t[r.QC] ?? 0) + 1 }), {});

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Sample details</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>
            {rows.length} / {MAX_BATCH}
          </Text>
        </View>
      </View>

      {!fields.DATA_TYPE ? (
        <Text style={styles.empty}>Choose the data type above to see its samples.</Text>
      ) : (
        <>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.checkRow}
              disabled={!free.length}
              onPress={() => setPicked(allPicked ? new Set() : new Set(free.map((s: any) => s.number)))}
            >
              {allPicked ? <CheckSquare size={20} color={colors.primary} /> : <Square size={20} color={colors.textMuted} />}
              <Text style={styles.checkHead}>
                {free.length} {String(fields.DATA_TYPE).toLowerCase()} sample{free.length === 1 ? '' : 's'} not yet sent
              </Text>
            </TouchableOpacity>
            <Text style={styles.muted}>
              {picked.size} ticked · up to {fitsInBatch} fit in one batch
            </Text>

            {free.length === 0 ? (
              <Text style={styles.empty}>Every recorded {String(fields.DATA_TYPE).toLowerCase()} sample of this project is already in a batch.</Text>
            ) : (
              <View style={styles.pickList}>
                {free.map((s: any) => (
                  <TouchableOpacity key={s.number} style={styles.checkRow} onPress={() => toggle(s.number)}>
                    {picked.has(s.number) ? <CheckSquare size={19} color={colors.primary} /> : <Square size={19} color={colors.textTertiary} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mono}>{s.number}</Text>
                      <Text style={styles.muted}>
                        {s.type ? codeLabel('SAMPLE_TYPE_CORE', s.type) : getFieldSectionByKey(s.section)?.shortTitle} · {s.recordId}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {available.some((s: any) => sent.has(s.number)) ? (
              <Text style={styles.muted}>{available.filter((s: any) => sent.has(s.number)).length} already sent in other batches are left out.</Text>
            ) : null}

            <TouchableOpacity style={styles.build} onPress={build}>
              <Shuffle size={16} color={colors.textInverse} />
              <Text style={styles.buildText}>Build batch with QC samples</Text>
            </TouchableOpacity>
            {error ? (
              <View style={styles.errorRow}>
                <AlertCircle size={15} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.rulesHead} onPress={() => setRulesOpen((o) => !o)}>
              <ListChecks size={15} color={colors.textSecondary} />
              <Text style={styles.rulesTitle}>QC rules</Text>
            </TouchableOpacity>
            {rulesOpen ? (
              <View style={styles.rules}>
                <Text style={styles.rule}>{BATCH_NOTE}</Text>
                {QC_RULES.map((r: any) => (
                  <Text key={r.kind} style={styles.rule}>
                    <Text style={{ fontWeight: '700' }}>{r.title}: </Text>
                    {r.rule}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          {rows.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <View style={styles.chips}>
                {Object.entries(counts).map(([kind, n]) => (
                  <KindPill key={kind} kind={kind} count={n as number} />
                ))}
              </View>
              {rows.map((r) => (
                <View key={r.SEQ} style={styles.sample}>
                  <Text style={styles.seq}>{r.SEQ}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.mono}>{r.SAMPLE_NUMBER}</Text>
                    <View style={styles.sampleMeta}>
                      <KindPill kind={r.QC} />
                      <Text style={styles.muted} numberOfLines={1}>
                        {[r.QC === 'Ordinary' ? fieldNumber(r) : r.REFERENCE, r.CLASS].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.boxCol}>
                    <Text style={styles.boxLabel}>Box</Text>
                    <TextInput
                      style={styles.box}
                      value={r.BOX_NO ?? ''}
                      onChangeText={(t) => onRowsChange(rows.map((x) => (x.SEQ === r.SEQ ? { ...x, BOX_NO: t } : x)))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary },
  count: { height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.primaryBg, justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderMedium, padding: 12, gap: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  checkHead: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  muted: { fontSize: 12, color: colors.textMuted },
  pickList: { borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: 4 },
  mono: { fontFamily: 'monospace', fontSize: 13, color: colors.textPrimary },
  build: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, marginTop: 8 },
  buildText: { color: colors.textInverse, fontWeight: '700' },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  error: { flex: 1, fontSize: 12.5, color: colors.danger },
  rulesHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  rulesTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  rules: { gap: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 10 },
  rule: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  kind: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  kindText: { fontSize: 11.5, fontWeight: '700' },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 6,
  },
  seq: { width: 26, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  sampleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boxCol: { alignItems: 'center' },
  boxLabel: { fontSize: 10.5, color: colors.textMuted, marginBottom: 2 },
  box: {
    width: 50,
    height: 36,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textPrimary,
  },
});
