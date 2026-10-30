import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronDown, Check, Plus, Search, X } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme';

export interface PickOption {
  value: string;
  label: string;
  /** A second line, e.g. who added an option. */
  note?: string;
}

interface PickerProps {
  value?: string;
  options: PickOption[];
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
  /** Shown as "+ Add new…" at the foot of the list: the form to add a missing option. */
  addNew?: { label?: string; withMeaning?: boolean; onAdd: (code: string, meaning: string) => string | void };
  invalid?: boolean;
  compact?: boolean;
}

/*
 * A dropdown for the phone: tapping opens a sheet with the list (searchable when it is long) and,
 * like the web form, "+ Add new…" at the end to add an option that is missing.
 */
export const Picker: React.FC<PickerProps> = ({ value, options, onChange, title, placeholder = 'Select', addNew, invalid, compact }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [meaning, setMeaning] = useState('');
  const [error, setError] = useState('');

  const picked = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setAdding(false);
    setCode('');
    setMeaning('');
    setError('');
  };
  const pick = (v: string) => {
    onChange(v);
    close();
  };
  const add = () => {
    try {
      const result = addNew?.onAdd(code, meaning);
      pick(typeof result === 'string' ? result : code.trim());
    } catch (e: any) {
      setError(e?.message || 'Could not add the option.');
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setOpen(true)}
        style={[styles.field, compact && styles.fieldCompact, invalid && styles.invalid]}
      >
        <Text style={[styles.value, !picked && !value && styles.placeholder]} numberOfLines={1}>
          {picked?.label || value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity onPress={close} hitSlop={10}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {options.length > 8 ? (
              <View style={styles.search}>
                <Search size={16} color={colors.textMuted} />
                <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor={colors.textTertiary} />
              </View>
            ) : null}

            <FlatList
              data={shown}
              keyExtractor={(o, i) => `${o.value}-${i}`}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListHeaderComponent={
                value ? (
                  <TouchableOpacity style={styles.option} onPress={() => pick('')}>
                    <Text style={[styles.optionText, styles.placeholder]}>— Clear</Text>
                  </TouchableOpacity>
                ) : undefined
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => pick(item.value)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionText, item.value === value && styles.optionOn]}>{item.label}</Text>
                    {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
                  </View>
                  {item.value === value ? <Check size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                addNew ? (
                  adding ? (
                    <View style={styles.addBox}>
                      <TextInput
                        style={styles.input}
                        autoFocus
                        value={code}
                        onChangeText={setCode}
                        placeholder={addNew.label || 'Code'}
                        placeholderTextColor={colors.textTertiary}
                        maxLength={60}
                      />
                      {addNew.withMeaning ? (
                        <TextInput style={styles.input} value={meaning} onChangeText={setMeaning} placeholder="Meaning" placeholderTextColor={colors.textTertiary} maxLength={120} />
                      ) : null}
                      {error ? <Text style={styles.error}>{error}</Text> : null}
                      <View style={styles.addActions}>
                        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setAdding(false)}>
                          <Text style={styles.btnGhostText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btn} onPress={add}>
                          <Text style={styles.btnText}>Add to the list</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.option, styles.addRow]} onPress={() => setAdding(true)}>
                      <Plus size={16} color={colors.primary} />
                      <Text style={styles.addText}>Add new…</Text>
                    </TouchableOpacity>
                  )
                ) : undefined
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  fieldCompact: { minHeight: 40, paddingHorizontal: 10 },
  invalid: { borderColor: colors.danger },
  value: { flex: 1, fontSize: 14, color: colors.textPrimary },
  placeholder: { color: colors.textTertiary },

  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sheetTitle: { flex: 1, fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: colors.textPrimary },
  list: { paddingHorizontal: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  optionText: { fontSize: 15, color: colors.textPrimary },
  optionOn: { color: colors.primary, fontWeight: '700' },
  note: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  addRow: { borderBottomWidth: 0 },
  addText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  addBox: { padding: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  error: { fontSize: 12.5, color: colors.danger },
  addActions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.textInverse, fontWeight: '700' },
  btnGhost: { backgroundColor: colors.surfaceSubtle },
  btnGhostText: { color: colors.textSecondary, fontWeight: '600' },
});
