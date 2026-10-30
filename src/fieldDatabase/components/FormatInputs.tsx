import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useHrms } from '../../context/HrmsContext';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { EMPLOYEE_MEMBERS } from '../../constants/roles';
import { codeList, listHasDesc } from '../data/fieldFormats';
import { heading } from '../utils/formatRows';
import { toISODate } from '../utils/date';
import { Picker } from './Picker';

/* The client's sheets hold at most 254 characters in a cell (their note on the CODES sheet). */
const MAX_TEXT = 254;

const descOptions = (listKey: string) => [...new Set(codeList(listKey).map((c: any) => c.desc).filter(Boolean))] as string[];

/* Everyone who records field data: the team, whoever is already on a record, and names added from the dropdown. */
function useGeologists(current?: string) {
  const { employees } = useHrms();
  const { fieldRecords } = useFieldDatabase();
  return useMemo(
    () =>
      [
        ...new Set(
          [
            current,
            ...EMPLOYEE_MEMBERS.map((m) => m.name),
            ...employees.map((e: any) => e.name),
            ...fieldRecords.map((r: any) => r.employeeName),
            ...codeList('GEOLOGIST').map((g: any) => g.code),
          ].filter(Boolean),
        ),
      ] as string[],
    [current, employees, fieldRecords],
  );
}

/* The GEOLOGIST dropdown, in the header or on a row; "Add new…" adds a name for everyone. An employee records as themselves. */
export const GeologistPicker: React.FC<{ value?: string; onChange: (v: string) => void; compact?: boolean }> = ({ value, onChange, compact }) => {
  const { canonicalRole } = useAuth();
  const { addFieldCode } = useFieldDatabase();
  const names = useGeologists(value);
  if (canonicalRole === 'employee') return <Text style={[styles.input, styles.readOnly, compact && styles.compact]}>{value || '—'}</Text>;
  return (
    <Picker
      title="GEOLOGIST"
      value={value}
      compact={compact}
      options={names.map((n) => ({ value: n, label: n }))}
      onChange={onChange}
      addNew={{
        label: 'Full name',
        onAdd: (code) => {
          const same = names.find((n) => n.toLowerCase() === code.trim().toLowerCase());
          return same || addFieldCode({ list: 'GEOLOGIST', code }).code;
        },
      }}
    />
  );
};

/* A dropdown of a code list (or of its descriptions), with "Add new…" for an option that is missing. */
const CodePicker: React.FC<{ fld: any; value?: string; onChange: (v: string) => void; compact?: boolean }> = ({ fld, value, onChange, compact }) => {
  const { addFieldCode } = useFieldDatabase();
  const options =
    fld.type === 'code'
      ? codeList(fld.list).map((c: any) => ({ value: c.code, label: c.desc ? `${c.code} · ${c.desc}` : c.code, note: c.addedBy ? `Added by ${c.addedBy}` : c.note }))
      : descOptions(fld.list).map((d) => ({ value: d, label: d }));
  return (
    <Picker
      title={heading(fld)}
      value={value == null ? '' : String(value)}
      compact={compact}
      options={options}
      onChange={onChange}
      addNew={{
        withMeaning: listHasDesc(fld.list),
        onAdd: (code, meaning) => {
          const entry = addFieldCode({ list: fld.list, code, desc: meaning });
          return fld.type === 'desc' ? entry.desc ?? entry.code : entry.code;
        },
      }}
    />
  );
};

interface InputProps {
  fld: any;
  value: any;
  onChange: (v: any) => void;
  compact?: boolean;
  readOnly?: boolean;
}

/* One input of a format: a code picker, a description picker, a number, date, time or text. */
export const FormatInput: React.FC<InputProps> = ({ fld, value, onChange, compact, readOnly }) => {
  if (fld.calc || readOnly) {
    return <Text style={[styles.input, styles.calc, compact && styles.compact]}>{value === '' || value == null ? '—' : String(value)}</Text>;
  }
  if (fld.bind === 'geologist') return <GeologistPicker value={value} onChange={onChange} compact={compact} />;
  if (fld.type === 'code' || fld.type === 'desc') return <CodePicker fld={fld} value={value} onChange={onChange} compact={compact} />;

  const text = value == null ? '' : String(value);
  if (fld.type === 'date' || fld.bind === 'date') {
    return (
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, compact && styles.compact, { flex: 1 }]}
          value={text}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textTertiary}
          maxLength={10}
        />
        {!text ? (
          <TouchableOpacity style={styles.today} onPress={() => onChange(toISODate(new Date()))}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (fld.type === 'time') {
    return (
      <TextInput
        style={[styles.input, compact && styles.compact]}
        value={text}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    );
  }
  const multiline = fld.type === 'textarea' && !compact;
  return (
    <TextInput
      style={[styles.input, compact && styles.compact, multiline && styles.multiline]}
      value={text}
      onChangeText={(t) => onChange(fld.type === 'number' ? t.replace(/[^0-9.\-]/g, '') : t)}
      keyboardType={fld.type === 'number' ? 'decimal-pad' : 'default'}
      maxLength={fld.type === 'number' ? 20 : MAX_TEXT}
      multiline={multiline}
    />
  );
};

/* One field under the client's own heading. */
export const FormatField: React.FC<{ fld: any; label?: string; children?: React.ReactNode } & Partial<InputProps>> = ({ fld, label, children, ...input }) => (
  <View style={styles.field}>
    <View style={styles.labelRow}>
      <Text style={styles.label} numberOfLines={2}>
        {label ?? heading(fld)}
      </Text>
      {fld.calc ? <Text style={styles.auto}>auto</Text> : null}
    </View>
    {children ?? <FormatInput fld={fld} value={input.value} onChange={input.onChange || (() => {})} compact={input.compact} readOnly={input.readOnly} />}
  </View>
);

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  label: { flexShrink: 1, fontSize: 11.5, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3 },
  auto: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: 14,
    color: colors.textPrimary,
  },
  compact: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 10 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  calc: { backgroundColor: colors.primaryBg, borderColor: colors.primaryMuted, color: colors.primaryDark, fontWeight: '700' },
  readOnly: { backgroundColor: colors.surfaceMuted, color: colors.textSecondary },
  dateRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  today: { paddingHorizontal: 10, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
