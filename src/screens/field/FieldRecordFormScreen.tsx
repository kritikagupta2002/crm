import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Save, AlertCircle } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { colors, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { getFieldSectionByKey } from '../../fieldDatabase/data/fieldDatabase';
import { fieldsOf, formatOf, summaryMetadata } from '../../fieldDatabase/data/fieldFormats';
import { applyChange, inClientOrder } from '../../fieldDatabase/utils/formatRows';
import { toISODate } from '../../fieldDatabase/utils/date';
import { FormatField, GeologistPicker } from '../../fieldDatabase/components/FormatInputs';
import { FormatTable } from '../../fieldDatabase/components/FormatTable';
import { DispatchBatch } from '../../fieldDatabase/components/DispatchBatch';
import { Picker } from '../../fieldDatabase/components/Picker';
import { FdButton, fd } from '../../fieldDatabase/components/ui';

const LAB_DETAILS = ['LAB_ADDRESS', 'LAB_CONTACT', 'LAB_OWNER', 'LAB_MAIL', 'SENDER_CONTACT', 'SENDER_MAIL', 'SENDER_ADDRESS'];

/* The common fields of a section whose format the client has not sent yet. */
const PLAIN = [
  { id: 'location', label: 'Location / station' },
  { id: 'sampleOrBoreholeId', label: 'Sample / borehole ID' },
  { id: 'latitude', label: 'Latitude' },
  { id: 'longitude', label: 'Longitude' },
  { id: 'elevation', label: 'Elevation' },
  { id: 'remarks', label: 'Remarks', multiline: true },
];

/*
 * Add or edit a record in the client's own format: the header of their sheet once, in their order and
 * under their headings, then its repeating rows (intervals, runs, survey readings, assay samples).
 */
export const FieldRecordFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const section = getFieldSectionByKey(route.params?.sectionKey);
  const { session, canonicalRole } = useAuth();
  const { projects: crmProjects } = useCrm();
  const { fieldRecords, createFieldRecord, updateFieldRecord } = useFieldDatabase();
  const record = route.params?.recordId ? fieldRecords.find((r: any) => r.id === route.params.recordId) : null;
  const fmt = section ? formatOf(section.key) : null;
  const userName = (session as any)?.name || '';

  // The app's projects, and any project a record already sits under (the demo's field data).
  const projects = useMemo(() => {
    const list = crmProjects.map((p: any) => ({ id: p.id, name: p.title || p.name, code: p.projectCode || p.id, client: p.clientName }));
    fieldRecords.forEach((r: any) => {
      if (r.projectId && !list.some((p) => p.id === r.projectId)) list.push({ id: r.projectId, name: r.projectName || r.projectId, code: r.projectId, client: '' });
    });
    return list;
  }, [crmProjects, fieldRecords]);

  const [state, setState] = useState(() => {
    const today = toISODate(new Date());
    if (record) {
      // A row's own date and geologist start as the record's.
      const own = (t: any, r: any) => {
        const out = { ...r };
        t.columns.forEach((c: any) => {
          if (c.bind === 'date' && (out[c.id] === '' || out[c.id] == null)) out[c.id] = record.date || '';
          if (c.bind === 'geologist' && (out[c.id] === '' || out[c.id] == null)) out[c.id] = record.employeeName || '';
        });
        return out;
      };
      return {
        projectId: record.projectId || '',
        projectName: record.projectName || '',
        date: record.date || today,
        employeeName: record.employeeName || userName,
        fields: { ...fieldsOf(record) },
        rows: fmt ? Object.fromEntries(fmt.tables.map((t: any) => [t.key, (record.data?.rows?.[t.key] ?? []).map((r: any) => own(t, r))])) : {},
        plain: {
          location: record.metadata?.location || '',
          sampleOrBoreholeId: record.metadata?.sampleOrBoreholeId || '',
          latitude: record.metadata?.coordinates?.latitude || '',
          longitude: record.metadata?.coordinates?.longitude || '',
          elevation: record.metadata?.coordinates?.elevation || '',
          remarks: record.metadata?.remarks || '',
        } as Record<string, string>,
      };
    }
    return {
      projectId: projects[0]?.id || '',
      projectName: projects[0]?.name || '',
      date: today,
      employeeName: userName,
      fields: {} as Record<string, any>,
      rows: fmt ? Object.fromEntries(fmt.tables.map((t: any) => [t.key, []])) : {},
      plain: {} as Record<string, string>,
    };
  });
  const [error, setError] = useState('');

  if (!section) return null;

  const set = (patch: any) => setState((s: any) => ({ ...s, ...patch }));
  const setField = (id: string, value: any) =>
    setState((s: any) => {
      const fields = applyChange(fmt.header, s.fields, id, value);
      // A lab used before: its address and contacts come from the last batch sent there.
      if (section.key === 'dispatch-database' && id === 'LAB' && !s.fields.LAB_ADDRESS) {
        const last = fieldRecords
          .filter((r: any) => r.section === section.key && fieldsOf(r).LAB === value)
          .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))[0];
        if (last) LAB_DETAILS.forEach((k) => (fields[k] = fields[k] || fieldsOf(last)[k] || ''));
      }
      return { ...s, fields };
    });
  const setRows = (key: string, rows: any[]) => setState((s: any) => ({ ...s, rows: { ...s.rows, [key]: rows } }));

  // Where the client's sheet keeps the date and geologist: in the header, or on every row.
  const headerHas = (to: string) => !!fmt?.header.some((f: any) => f.bind === to);
  const fromRows = (to: string) => {
    for (const t of fmt?.tables ?? []) {
      const c = t.columns.find((x: any) => x.bind === to);
      const v = c && (state.rows[t.key] ?? []).map((r: any) => r[c.id]).find((x: any) => x);
      if (v) return v;
    }
    return '';
  };
  const recordDate = !fmt || headerHas('date') ? state.date : fromRows('date') || state.date;
  const recordGeologist = canonicalRole === 'employee' ? userName : !fmt || headerHas('geologist') ? state.employeeName : fromRows('geologist') || state.employeeName;
  const project = projects.find((p) => p.id === state.projectId);

  const save = () => {
    setError('');
    if (!state.projectId) return setError('Choose the project.');
    const payload = fmt
      ? (() => {
          const meta = summaryMetadata(section.key, state.fields);
          return {
            metadata: { ...meta, location: meta.location || state.projectName, remarks: state.fields.DESCRIPTION1 || state.fields.COMMENTS || '' },
            data: { format: fmt.workbook, fields: state.fields, rows: state.rows },
          };
        })()
      : {
          metadata: {
            location: state.plain.location || '',
            sampleOrBoreholeId: state.plain.sampleOrBoreholeId || '',
            coordinates: { latitude: state.plain.latitude || '', longitude: state.plain.longitude || '', elevation: state.plain.elevation || '' },
            remarks: state.plain.remarks || '',
          },
          data: {},
        };
    const common = {
      projectId: state.projectId,
      projectName: state.projectName,
      date: recordDate,
      employeeName: String(recordGeologist).trim(),
      status: record?.status || 'Submitted',
      ...payload,
    };
    try {
      const saved = record
        ? updateFieldRecord(record.id, common)
        : createFieldRecord({ ...common, section: section.key, employeeId: (session as any)?.employeeId || '' });
      navigation.replace('FieldRecordDetail', { recordId: saved.id });
    } catch (e: any) {
      setError(e?.message || 'Unable to save the record.');
    }
  };

  const projectPicker = (
    <Picker
      title="Project"
      value={state.projectId}
      invalid={!state.projectId && !!error}
      options={projects.map((p) => ({ value: p.id, label: p.name, note: [p.code, p.client].filter(Boolean).join(' · ') }))}
      onChange={(v) => set({ projectId: v, projectName: projects.find((p) => p.id === v)?.name || v })}
    />
  );

  return (
    <View style={fd.root}>
      <AppHeader title={record ? `Edit ${record.id}` : `New ${section.shortTitle}`} subtitle={fmt ? `Format: ${fmt.workbook.replace(/_/g, ' ')}` : 'Common fields'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={fd.body} keyboardShouldPersistTaps="handled">
          <View style={fd.card}>
            {fmt ? (
              inClientOrder(fmt, fmt.header.filter((f: any) => !f.inherit)).map((fld: any) => {
                if (fld.bind === 'project')
                  return (
                    <FormatField key={fld.id} fld={fld}>
                      {projectPicker}
                    </FormatField>
                  );
                if (fld.bind === 'date') return <FormatField key={fld.id} fld={{ ...fld, type: 'date' }} value={state.date} onChange={(v) => set({ date: v })} />;
                if (fld.bind === 'geologist')
                  return (
                    <FormatField key={fld.id} fld={fld}>
                      <GeologistPicker value={state.employeeName} onChange={(v) => set({ employeeName: v })} />
                    </FormatField>
                  );
                return <FormatField key={fld.id} fld={fld} value={state.fields[fld.id]} onChange={(v) => setField(fld.id, v)} />;
              })
            ) : (
              <>
                <FormatField fld={{ id: 'project' }} label="PROJECT">
                  {projectPicker}
                </FormatField>
                <FormatField fld={{ id: 'date', type: 'date' }} label="DATE" value={state.date} onChange={(v) => set({ date: v })} />
                <FormatField fld={{ id: 'geo' }} label="GEOLOGIST">
                  <GeologistPicker value={state.employeeName} onChange={(v) => set({ employeeName: v })} />
                </FormatField>
                {PLAIN.map((p) => (
                  <FormatField key={p.id} fld={{ id: p.id }} label={p.label.toUpperCase()}>
                    <TextInput
                      style={[styles.input, p.multiline && styles.multiline]}
                      value={state.plain[p.id] || ''}
                      multiline={p.multiline}
                      onChangeText={(t) => set({ plain: { ...state.plain, [p.id]: t } })}
                    />
                  </FormatField>
                ))}
              </>
            )}
          </View>

          {fmt?.tables.map((table: any) =>
            section.key === 'dispatch-database' ? (
              <DispatchBatch
                key={table.key}
                fields={state.fields}
                rows={state.rows[table.key] ?? []}
                onRowsChange={(rows) => setRows(table.key, rows)}
                projectId={state.projectId}
                projectCode={project?.code || state.projectId}
                records={fieldRecords}
                recordId={record?.id}
              />
            ) : (
              <FormatTable
                key={table.key}
                table={table}
                rows={state.rows[table.key] ?? []}
                onChange={(rows) => setRows(table.key, rows)}
                header={state.fields}
                recordDate={state.date}
                geologist={state.employeeName}
              />
            ),
          )}

          {error ? (
            <View style={styles.error}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.footer}>
            <FdButton title="Cancel" kind="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
            <FdButton title={record ? 'Save changes' : 'Save record'} Icon={Save} onPress={save} style={{ flex: 1.4 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerBg, marginTop: 16 },
  errorText: { flex: 1, color: colors.dangerText, fontSize: 13 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
