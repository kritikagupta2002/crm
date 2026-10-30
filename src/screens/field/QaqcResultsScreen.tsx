import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ClipboardPaste, Save, AlertCircle } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, radius } from '../../theme';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { codeList, fieldsOf, rowsOf } from '../../fieldDatabase/data/fieldFormats';
import { fieldNumber } from '../../fieldDatabase/utils/dispatch';
import { ELEMENTS, allChecks, batchQaqc, parseResults, qaqcRows, resultsOf } from '../../fieldDatabase/utils/qaqc';
import { KindPill } from '../../fieldDatabase/components/DispatchBatch';
import { Picker } from '../../fieldDatabase/components/Picker';
import { FormatField } from '../../fieldDatabase/components/FormatInputs';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';
import { Verdict } from './QaqcScreen';

/*
 * The lab's results for one batch, typed in or pasted from their sheet. A pulp duplicate shows the
 * client's 95–105 % check as the numbers go in. The lab status is chosen here by the user.
 */
export const QaqcResultsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { fieldRecords, updateFieldRecord, crmValues } = useFieldDatabase();
  const batch = fieldRecords.find((r: any) => r.id === route.params?.batchId);
  const samples = batch ? rowsOf(batch, 'samples') : [];
  const [results, setResults] = useState<Record<string, Record<string, number>>>(() => JSON.parse(JSON.stringify(batch ? resultsOf(batch) : {})));
  const [pasteOpen, setPasteOpen] = useState(() => !Object.keys(batch ? resultsOf(batch) : {}).length);
  const [pasted, setPasted] = useState('');
  const [note, setNote] = useState<{ bad: boolean; text: string } | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(batch ? fieldsOf(batch).STATUS || 'Pending' : 'Pending');
  const [resultsOn, setResultsOn] = useState(batch ? fieldsOf(batch).RESULT_RECEIVED || '' : '');
  const [limit, setLimit] = useState(25);

  const draft = useMemo(() => (batch ? { ...batch, data: { ...batch.data, results } } : null), [batch, results]);
  const check: any = useMemo(() => (draft ? batchQaqc(draft, crmValues) : null), [draft, crmValues]);
  const verdicts = useMemo(() => new Map(draft ? allChecks(qaqcRows([draft], crmValues)).map((c: any) => [c.sampleNo, c]) : []), [draft, crmValues]);

  if (!batch) {
    return (
      <View style={fd.root}>
        <AppHeader title="Lab results" />
        <Empty text="This batch is not available." />
      </View>
    );
  }
  const v = fieldsOf(batch);

  const setValue = (sample: string, element: string, value: string) =>
    setResults((r) => {
      const next = { ...r, [sample]: { ...(r[sample] ?? {}) } };
      const clean = value.replace(/[^0-9.]/g, '');
      if (clean === '') delete next[sample][element];
      else next[sample][element] = Number(clean);
      return next;
    });

  // The lab may list the tubes by the running number or by the field number.
  const byNumber = new Map<string, string>(
    samples.flatMap((s: any) => [[s.SAMPLE_NUMBER.toUpperCase(), s.SAMPLE_NUMBER], ...(s.FIELD_SAMPLE ? [[s.FIELD_SAMPLE.toUpperCase(), s.SAMPLE_NUMBER]] : [])]),
  );
  const applyPaste = () => {
    const { results: found, unknown } = parseResults(pasted, (num: string) => byNumber.get(String(num || '').trim().toUpperCase()));
    const count = Object.keys(found).length;
    if (!count) return setNote({ bad: true, text: 'No line matched a sample of this batch. Each line needs the sample number, then Zn, Pb and Ag.' });
    setResults((r) => ({ ...r, ...Object.fromEntries(Object.entries(found).map(([k, val]: any) => [k, { ...(r[k] ?? {}), ...val }])) }));
    setNote({
      bad: unknown.length > 0,
      text: `${count} sample${count === 1 ? '' : 's'} filled.${unknown.length ? ` Not in this batch: ${unknown.slice(0, 4).join(', ')}${unknown.length > 4 ? '…' : ''}.` : ''}`,
    });
    setPasted('');
    setPasteOpen(false);
  };

  const save = () => {
    setError('');
    const clean = Object.fromEntries(Object.entries(results).filter(([, val]) => Object.keys(val).length));
    try {
      updateFieldRecord(batch.id, { data: { results: clean, fields: { ...v, RESULT_COUNT: check.withResult, RESULT_RECEIVED: resultsOn, STATUS: status } } });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message || 'Unable to save the results.');
    }
  };

  return (
    <View style={fd.root}>
      <AppHeader title={`Lab results · ${v.BATCH_ID || batch.id}`} subtitle={`${v.LAB || ''} · ${samples.length} samples`} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={fd.body} keyboardShouldPersistTaps="handled">
          <FdButton title="Paste from the lab's sheet" Icon={ClipboardPaste} kind="outline" onPress={() => setPasteOpen((o) => !o)} />
          {note ? <Text style={[styles.note, note.bad && { color: colors.warningText }]}>{note.text}</Text> : null}
          {pasteOpen ? (
            <View style={[fd.card, { marginTop: 10 }]}>
              <TextInput
                style={styles.paste}
                multiline
                value={pasted}
                onChangeText={setPasted}
                placeholder={`Copy the columns from Excel and paste here:\nSample No  Zn  Pb  Ag\n${samples[1]?.SAMPLE_NUMBER ?? 'BGSPL01/002'}  1345  698  12`}
                placeholderTextColor={colors.textTertiary}
              />
              <FdButton title="Fill results" onPress={applyPaste} disabled={!pasted.trim()} style={{ marginTop: 10 }} />
            </View>
          ) : null}

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              <Text style={{ fontWeight: '700' }}>{check.withResult}</Text> of {check.total} with results
            </Text>
            {check.dupPass ? <Verdict v="pass" /> : null}
            {check.dupFail ? <Verdict v="fail" /> : null}
          </View>

          <View style={[fd.card, { marginTop: 10 }]}>
            <FormatField fld={{ id: 'RESULT_RECEIVED', type: 'date' }} label="RESULTS RECEIVED ON" value={resultsOn} onChange={setResultsOn} />
            <FormatField fld={{ id: 'STATUS' }} label="LAB STATUS">
              <Picker title="Lab status" value={status} options={codeList('STATUS').map((o: any) => ({ value: o.code, label: o.code }))} onChange={(x) => setStatus(x || 'Pending')} />
            </FormatField>
          </View>

          {samples.slice(0, limit).map((s: any) => {
            const c: any = verdicts.get(s.SAMPLE_NUMBER);
            return (
              <View key={s.SAMPLE_NUMBER} style={styles.sample}>
                <View style={styles.sampleHead}>
                  <Text style={styles.seq}>{s.SEQ}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mono}>{s.SAMPLE_NUMBER}</Text>
                    <Text style={fd.muted}>{s.QC === 'Ordinary' ? fieldNumber(s) : s.QC === 'CRM' ? s.REFERENCE : s.REFERENCE ? `of ${s.REFERENCE}` : ''}</Text>
                  </View>
                  <KindPill kind={s.QC} />
                </View>
                <View style={styles.inputs}>
                  {ELEMENTS.map((e: string) => (
                    <View key={e} style={{ flex: 1 }}>
                      <Text style={styles.elLabel}>{e} (ppm)</Text>
                      <TextInput
                        style={[styles.num, c?.el[e].verdict === 'fail' && styles.bad]}
                        keyboardType="decimal-pad"
                        value={results[s.SAMPLE_NUMBER]?.[e] != null ? String(results[s.SAMPLE_NUMBER][e]) : ''}
                        onChangeText={(t) => setValue(s.SAMPLE_NUMBER, e, t)}
                      />
                    </View>
                  ))}
                </View>
                {c ? (
                  <View style={{ marginTop: 6 }}>
                    <Verdict v={c.verdict} />
                  </View>
                ) : null}
              </View>
            );
          })}
          {samples.length > limit ? (
            <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setLimit((l) => l + 50)}>
              <Text style={styles.link}>Show more ({samples.length - limit} left)</Text>
            </TouchableOpacity>
          ) : null}

          {error ? (
            <View style={styles.error}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={{ flex: 1, color: colors.dangerText }}>{error}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <FdButton title="Cancel" kind="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
            <FdButton title="Save results" Icon={Save} onPress={save} style={{ flex: 1.3 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  note: { fontSize: 12.5, color: colors.successText, marginTop: 8 },
  paste: { minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, padding: 10, fontFamily: 'monospace', fontSize: 12.5, color: colors.textPrimary },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
  summaryText: { fontSize: 13, color: colors.textSecondary },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  sample: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, padding: 10, marginTop: 8 },
  sampleHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seq: { width: 24, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  mono: { fontFamily: 'monospace', fontSize: 13, color: colors.textPrimary },
  inputs: { flexDirection: 'row', gap: 8, marginTop: 8 },
  elLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, marginBottom: 3 },
  num: { height: 40, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.sm, paddingHorizontal: 8, fontSize: 14, color: colors.textPrimary },
  bad: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  error: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerBg, marginTop: 14 },
});
