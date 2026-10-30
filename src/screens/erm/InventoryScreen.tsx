import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Boxes, PackageCheck, Users, AlertTriangle, Plus, Search, RotateCcw, Send } from 'lucide-react-native';
import { AppHeader } from '../../components/common';
import { StatGrid, inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { useInventory } from '../../context/InventoryContext';
import { INVENTORY_CATEGORIES, INVENTORY_LOCATIONS, INVENTORY_UNITS } from '../../inventory/data';
import { Picker } from '../../fieldDatabase/components/Picker';
import { FdButton, Empty, fd } from '../../fieldDatabase/components/ui';
import { formatDate } from '../../fieldDatabase/utils/date';

const STATUS_TONE: Record<string, { fg: string; bg: string }> = {
  Available: { fg: colors.successText, bg: colors.successBg },
  'Partially Assigned': { fg: colors.warningText, bg: colors.warningBg },
  Assigned: { fg: colors.infoText, bg: colors.infoBg },
  'Out of Stock': { fg: colors.dangerText, bg: colors.dangerBg },
  Returned: { fg: colors.textSecondary, bg: colors.surfaceSubtle },
};
const Pill: React.FC<{ status: string }> = ({ status }) => {
  const t = STATUS_TONE[status] || STATUS_TONE.Returned;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{status}</Text>
    </View>
  );
};

/* A sheet sliding up with a title, its fields and the two buttons. */
const Sheet: React.FC<{ title: string; open: boolean; onClose: () => void; onSave: () => void; saveLabel: string; error?: string; children: React.ReactNode }> = ({
  title,
  open,
  onClose,
  onSave,
  saveLabel,
  error,
  children,
}) => (
  <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
          {children}
        </ScrollView>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.sheetActions}>
          <FdButton title="Cancel" kind="outline" onPress={onClose} style={{ flex: 1 }} />
          <FdButton title={saveLabel} onPress={onSave} style={{ flex: 1 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

/* Equipment, tools and consumables: what is in stock, who has what, and what came back. */
export const InventoryScreen: React.FC<{ navigation: any }> = () => {
  const { items, assignments, canManage, createItem, assign, returnItem } = useInventory();
  const { employees } = useHrms();
  const { projects } = useCrm();
  const [tab, setTab] = useState<'stock' | 'out' | 'history'>('stock');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [error, setError] = useState('');

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<any>({});
  const [assigning, setAssigning] = useState<any>(null);
  const [returning, setReturning] = useState<any>(null);
  const [returnNote, setReturnNote] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => (category === 'All' || i.category === category) && (!q || [i.name, i.assetId, i.location, i.vendor].join(' ').toLowerCase().includes(q)),
    );
  }, [items, category, query]);
  const out = assignments.filter((a) => a.status === 'Assigned');
  const today = new Date().toISOString().slice(0, 10);
  const overdue = out.filter((a) => a.expectedReturnDate && a.expectedReturnDate < today);

  const close = () => {
    setAdding(false);
    setAssigning(null);
    setReturning(null);
    setError('');
  };
  const run = (fn: () => void) => {
    try {
      fn();
      close();
    } catch (e: any) {
      setError(e?.message || 'Could not save.');
    }
  };
  const people = useMemo(() => employees.map((e: any) => ({ value: e.name, label: e.name, note: e.designation || e.employment?.designation })), [employees]);
  const projectOptions = projects.map((p: any) => ({ value: p.id, label: p.title || p.name, note: p.projectCode }));

  return (
    <View style={fd.root}>
      <AppHeader title="Inventory / Stock" subtitle="Equipment, tools and consumables" />
      <ScrollView contentContainerStyle={fd.body} keyboardShouldPersistTaps="handled">
        <StatGrid
          items={[
            { label: 'Items', value: items.length, sub: `${items.reduce((s, i) => s + i.totalQuantity, 0)} units`, Icon: Boxes, tone: 'teal' },
            { label: 'In stock', value: items.reduce((s, i) => s + i.availableQuantity, 0), sub: 'units free', Icon: PackageCheck, tone: 'green' },
            { label: 'With the team', value: out.reduce((s, a) => s + a.quantity, 0), sub: `${out.length} assignments`, Icon: Users, tone: 'blue', onPress: () => setTab('out') },
            { label: 'Overdue returns', value: overdue.length, sub: `${items.filter((i) => i.status === 'Out of Stock').length} out of stock`, Icon: AlertTriangle, tone: overdue.length ? 'red' : 'slate' },
          ]}
        />

        <View style={styles.tabs}>
          {(
            [
              ['stock', 'Stock'],
              ['out', `With team ${out.length}`],
              ['history', 'History'],
            ] as const
          ).map(([k, l]) => (
            <TouchableOpacity key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabOn]}>
              <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'stock' ? (
          <>
            {canManage ? (
              <FdButton
                title="Add item"
                Icon={Plus}
                onPress={() => {
                  setDraft({ category: INVENTORY_CATEGORIES[0], unit: 'Nos', location: INVENTORY_LOCATIONS[0], quantity: '' });
                  setAdding(true);
                }}
                style={{ marginBottom: 10 }}
              />
            ) : null}
            <View style={styles.search}>
              <Search size={16} color={colors.textMuted} />
              <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search item, asset ID, location" placeholderTextColor={colors.textTertiary} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {['All', ...INVENTORY_CATEGORIES].map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {shown.length === 0 ? <Empty text="No items match." /> : null}
            {shown.map((i) => (
              <View key={i.id} style={[fd.card, styles.item]}>
                <View style={styles.itemHead}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {i.name}
                  </Text>
                  <Pill status={i.status} />
                </View>
                <Text style={fd.muted}>
                  {i.assetId} · {i.category} · {i.location}
                </Text>
                <View style={styles.stockBar}>
                  <View style={{ flex: i.availableQuantity || 0.0001, backgroundColor: colors.success }} />
                  <View style={{ flex: i.assignedQuantity || 0.0001, backgroundColor: colors.info }} />
                </View>
                <Text style={styles.stockText}>
                  <Text style={{ color: colors.successText, fontWeight: '700' }}>{i.availableQuantity} free</Text> · {i.assignedQuantity} with the team · {i.totalQuantity}{' '}
                  {i.unit}
                </Text>
                {i.purchaseCost ? <Text style={fd.muted}>{`${inr(i.purchaseCost)} · ${i.vendor || ''}`}</Text> : null}
                {canManage && i.availableQuantity > 0 ? (
                  <FdButton
                    title="Assign"
                    Icon={Send}
                    kind="outline"
                    onPress={() => setAssigning({ inventoryItemId: i.id, name: i.name, unit: i.unit, max: i.availableQuantity, quantity: '1', employeeName: '', projectId: '', expectedReturnDate: '' })}
                    style={{ marginTop: 10, height: 40 }}
                  />
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <>
            {(tab === 'out' ? out : assignments.filter((a) => a.status === 'Returned')).map((a) => {
              const late = a.status === 'Assigned' && a.expectedReturnDate && a.expectedReturnDate < today;
              return (
                <View key={a.id} style={[fd.card, styles.item, late && styles.late]}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {a.itemName}
                    </Text>
                    <Pill status={late ? 'Out of Stock' : a.status} />
                  </View>
                  <Text style={styles.who}>
                    {a.employeeName} · {a.quantity} {a.unit}
                  </Text>
                  <Text style={fd.muted}>
                    {a.projectName ? `${a.projectName} · ` : ''}out {a.assignedDate ? formatDate(a.assignedDate) : '—'}
                    {a.status === 'Returned'
                      ? ` · back ${a.returnDate ? formatDate(a.returnDate) : ''}`
                      : a.expectedReturnDate
                        ? ` · due ${formatDate(a.expectedReturnDate)}${late ? ' (late)' : ''}`
                        : ''}
                  </Text>
                  {a.returnRemarks ? <Text style={fd.muted}>{a.returnRemarks}</Text> : null}
                  {canManage && a.status === 'Assigned' ? (
                    <FdButton
                      title="Mark returned"
                      Icon={RotateCcw}
                      kind="outline"
                      onPress={() => {
                        setReturnNote('');
                        setReturning(a);
                      }}
                      style={{ marginTop: 10, height: 40 }}
                    />
                  ) : null}
                </View>
              );
            })}
            {(tab === 'out' ? out : assignments.filter((a) => a.status === 'Returned')).length === 0 ? <Empty text="Nothing here." /> : null}
          </>
        )}
      </ScrollView>

      <Sheet title="Add item" open={adding} onClose={close} saveLabel="Add item" error={error} onSave={() => run(() => createItem(draft))}>
        <Field label="ITEM NAME">
          <TextInput style={styles.input} value={draft.name || ''} onChangeText={(t) => setDraft({ ...draft, name: t })} />
        </Field>
        <Field label="CATEGORY">
          <Picker title="Category" value={draft.category} options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={(v) => setDraft({ ...draft, category: v })} />
        </Field>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="QUANTITY">
              <TextInput style={styles.input} value={String(draft.quantity ?? '')} keyboardType="number-pad" onChangeText={(t) => setDraft({ ...draft, quantity: t.replace(/[^0-9]/g, '') })} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="UNIT">
              <Picker title="Unit" value={draft.unit} options={INVENTORY_UNITS.map((u) => ({ value: u, label: u }))} onChange={(v) => setDraft({ ...draft, unit: v || 'Nos' })} />
            </Field>
          </View>
        </View>
        <Field label="LOCATION">
          <Picker title="Location" value={draft.location} options={INVENTORY_LOCATIONS.map((l) => ({ value: l, label: l }))} onChange={(v) => setDraft({ ...draft, location: v })} />
        </Field>
        <Field label="ASSET ID (BLANK = NEXT NUMBER)">
          <TextInput style={styles.input} value={draft.assetId || ''} onChangeText={(t) => setDraft({ ...draft, assetId: t })} />
        </Field>
        <Field label="VENDOR">
          <TextInput style={styles.input} value={draft.vendor || ''} onChangeText={(t) => setDraft({ ...draft, vendor: t })} />
        </Field>
        <Field label="PURCHASE COST (₹)">
          <TextInput style={styles.input} value={String(draft.purchaseCost ?? '')} keyboardType="number-pad" onChangeText={(t) => setDraft({ ...draft, purchaseCost: t.replace(/[^0-9]/g, '') })} />
        </Field>
      </Sheet>

      <Sheet
        title={assigning ? `Assign · ${assigning.name}` : 'Assign'}
        open={!!assigning}
        onClose={close}
        saveLabel="Assign"
        error={error}
        onSave={() =>
          run(() =>
            assign({
              ...assigning,
              projectName: projects.find((p: any) => p.id === assigning.projectId)?.title || null,
            }),
          )
        }
      >
        {assigning ? (
          <>
            <Field label="TO">
              <Picker title="Employee" value={assigning.employeeName} options={people} onChange={(v) => setAssigning({ ...assigning, employeeName: v })} />
            </Field>
            <Field label={`QUANTITY (UP TO ${assigning.max} ${String(assigning.unit).toUpperCase()})`}>
              <TextInput style={styles.input} value={assigning.quantity} keyboardType="number-pad" onChangeText={(t) => setAssigning({ ...assigning, quantity: t.replace(/[^0-9]/g, '') })} />
            </Field>
            <Field label="PROJECT">
              <Picker title="Project" value={assigning.projectId} options={projectOptions} onChange={(v) => setAssigning({ ...assigning, projectId: v })} />
            </Field>
            <Field label="RETURN BY (YYYY-MM-DD)">
              <TextInput style={styles.input} value={assigning.expectedReturnDate} onChangeText={(t) => setAssigning({ ...assigning, expectedReturnDate: t })} maxLength={10} />
            </Field>
          </>
        ) : null}
      </Sheet>

      <Sheet
        title={returning ? `Return · ${returning.itemName}` : 'Return'}
        open={!!returning}
        onClose={close}
        saveLabel="Mark returned"
        error={error}
        onSave={() => run(() => returnItem(returning.id, returnNote))}
      >
        {returning ? (
          <Text style={[fd.muted, { marginBottom: 10 }]}>
            {returning.quantity} {returning.unit} from {returning.employeeName}
          </Text>
        ) : null}
        <Field label="CONDITION / REMARKS">
          <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} multiline value={returnNote} onChangeText={setReturnNote} />
        </Field>
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  tab: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  tabOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextOn: { color: colors.textInverse },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: colors.textPrimary },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { paddingHorizontal: 12, height: 34, justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.textInverse },
  item: { marginBottom: 10, gap: 3 },
  late: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  itemHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  who: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  pillText: { fontSize: 11, fontWeight: '700' },
  stockBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginTop: 8, backgroundColor: colors.surfaceSubtle },
  stockText: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  label: { fontSize: 11.5, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  error: { fontSize: 12.5, color: colors.danger, marginTop: 8 },
});
