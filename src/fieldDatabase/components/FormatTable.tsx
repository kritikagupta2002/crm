import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme';
import { fieldLabel, withCalcs } from '../data/fieldFormats';
import { applyChange, rowColumns } from '../utils/formatRows';
import { FormatField } from './FormatInputs';

/* A part holds at most this many columns, as on the web form. */
const MAX_PART = 8;

const heading = (c: any) => c.col ?? fieldLabel(c);
/* A row's own date is a date field. */
const asInput = (c: any) => (c.bind === 'date' ? { ...c, type: 'date' } : c);

/* The columns in the client's order, cut into equal runs named by their first and last heading (FROM – MINERAL2). */
function partsOf(columns: any[]) {
  const cols = rowColumns(columns).map(asInput);
  const count = Math.ceil(cols.length / MAX_PART) || 1;
  const size = Math.ceil(cols.length / count);
  return Array.from({ length: count }, (_, i) => {
    const part = cols.slice(i * size, (i + 1) * size);
    return { name: count > 1 ? `${heading(part[0])} – ${heading(part[part.length - 1])}` : '', cols: part };
  });
}

const blank = (v: any) => v === '' || v == null;

interface Props {
  table: any;
  rows: any[];
  onChange: (rows: any[]) => void;
  header: Record<string, any>;
  recordDate?: string;
  geologist?: string;
}

/*
 * The repeating rows of a format (intervals, runs, survey readings, assay samples). On the phone each
 * row is a card: closed it shows its first values, open it lists every column under the client's
 * heading, in their order, grouped in the same parts as the web form.
 */
export const FormatTable: React.FC<Props> = ({ table, rows, onChange, header, recordDate, geologist }) => {
  const parts = partsOf(table.columns);
  const [open, setOpen] = useState<number | null>(rows.length ? null : null);

  const newRow = (copyFrom?: any) => {
    const row: any = copyFrom ? { ...copyFrom } : {};
    rowColumns(table.columns).forEach((c: any) => {
      if (!copyFrom && c.defaultFrom) row[c.id] = c.defaultFrom === 'date' ? recordDate ?? '' : header[c.defaultFrom] ?? '';
      // A row's date and geologist start as the record's; they can be changed row by row, as on the client's sheet.
      if (!copyFrom && c.bind === 'date') row[c.id] = recordDate ?? '';
      if (!copyFrom && c.bind === 'geologist') row[c.id] = geologist ?? '';
    });
    const last = rows[rows.length - 1];
    if (table.continues && last && !blank(last.TO)) {
      row.FROM = last.TO;
      if (copyFrom) row.TO = '';
    }
    // A copied row keeps the geology but not the sample number, which must stay unique.
    if (copyFrom) table.columns.filter((c: any) => c.key || c.sample).forEach((c: any) => (row[c.id] = ''));
    return row;
  };

  const add = (copyFrom?: any) => {
    onChange([...rows, newRow(copyFrom)]);
    setOpen(rows.length);
  };
  const update = (i: number, id: string, value: any) => onChange(rows.map((r, n) => (n === i ? applyChange(table.columns, r, id, value) : r)));
  const remove = (i: number) => {
    onChange(rows.filter((_, n) => n !== i));
    setOpen(null);
  };

  const summary = (row: any) =>
    rowColumns(table.columns)
      .filter((c: any) => !blank(row[c.id]) && c.bind !== 'geologist' && c.bind !== 'date')
      .slice(0, 4)
      .map((c: any) => `${heading(c)} ${row[c.id]}`)
      .join('  ·  ');

  return (
    <View style={styles.table}>
      <View style={styles.head}>
        <Text style={styles.title}>{table.title}</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{rows.length}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {table.add ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => add()}>
            <Plus size={15} color={colors.textInverse} />
            <Text style={styles.addText}>{table.add}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {rows.length === 0 ? <Text style={styles.empty}>No rows yet.</Text> : null}

      {rows.map((raw, i) => {
        const row = withCalcs(table.columns, raw);
        const isOpen = open === i;
        return (
          <View key={i} style={[styles.row, isOpen && styles.rowOpen]}>
            <TouchableOpacity style={styles.rowHead} activeOpacity={0.7} onPress={() => setOpen(isOpen ? null : i)}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.rowSummary} numberOfLines={isOpen ? 1 : 2}>
                {summary(row) || 'Empty row'}
              </Text>
              {isOpen ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
            </TouchableOpacity>

            {isOpen ? (
              <View style={styles.rowBody}>
                {parts.map((part) => (
                  <View key={part.name || 'all'}>
                    {part.name ? <Text style={styles.part}>{part.name}</Text> : null}
                    <View style={styles.grid}>
                      {part.cols.map((c: any) => (
                        <View key={c.id} style={c.type === 'textarea' ? styles.cellWide : styles.cell}>
                          <FormatField fld={c} value={row[c.id]} compact onChange={(v) => update(i, c.id, v)} />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <View style={styles.rowActions}>
                  {table.add ? (
                    <TouchableOpacity style={styles.ghost} onPress={() => add(raw)}>
                      <Copy size={15} color={colors.primary} />
                      <Text style={styles.ghostText}>Copy below</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.ghost} onPress={() => remove(i)}>
                    <Trash2 size={15} color={colors.danger} />
                    <Text style={[styles.ghostText, { color: colors.danger }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  table: { marginTop: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary },
  count: { minWidth: 24, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingHorizontal: 12, height: 36, borderRadius: radius.md },
  addText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: 8 },
  row: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.lg, marginBottom: 8, overflow: 'hidden' },
  rowOpen: { borderColor: colors.primaryMuted },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  badge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  rowSummary: { flex: 1, fontSize: 12.5, color: colors.textSecondary },
  rowBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  part: { marginTop: 12, marginBottom: 8, fontSize: 11, fontWeight: '700', color: colors.goldDark, letterSpacing: 0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10 },
  cell: { flexBasis: '47%', flexGrow: 1 },
  cellWide: { flexBasis: '100%' },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  ghostText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
