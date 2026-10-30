import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Mountain,
  Shovel,
  FlaskConical,
  Waves,
  Layers,
  Drill,
  FileSpreadsheet,
  Hammer,
  ScrollText,
  Truck,
  Crosshair,
} from 'lucide-react-native';
import { colors, fonts, radius, shadows } from '../../theme';

/* The section icons, named in data/fieldDatabase.js. */
export const SECTION_ICON: Record<string, any> = { Mountain, Shovel, FlaskConical, Waves, Layers, Drill, FileSpreadsheet, Hammer, ScrollText, Truck, Crosshair };
export const sectionIcon = (section: any) => SECTION_ICON[section?.icon] || FileSpreadsheet;

export const StatusPill: React.FC<{ status?: string }> = ({ status = 'Submitted' }) => {
  const draft = status === 'Draft';
  return (
    <View style={[styles.pill, { backgroundColor: draft ? colors.surfaceSubtle : colors.successBg }]}>
      <Text style={[styles.pillText, { color: draft ? colors.textSecondary : colors.successText }]}>{status}</Text>
    </View>
  );
};

/* A button in the brand colours: primary teal, or a quiet outline. */
export const FdButton: React.FC<{
  title: string;
  onPress: () => void;
  Icon?: any;
  kind?: 'primary' | 'outline';
  busy?: boolean;
  disabled?: boolean;
  style?: any;
}> = ({ title, onPress, Icon, kind = 'primary', busy, disabled, style }) => {
  const primary = kind === 'primary';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || busy}
      style={[styles.btn, primary ? styles.btnPrimary : styles.btnOutline, (disabled || busy) && { opacity: 0.55 }, style]}
    >
      {busy ? <ActivityIndicator size="small" color={primary ? colors.textInverse : colors.primary} /> : Icon ? <Icon size={16} color={primary ? colors.textInverse : colors.primary} /> : null}
      <Text style={[styles.btnText, { color: primary ? colors.textInverse : colors.primary }]} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const SectionHead: React.FC<{ title: string; count?: number | string; right?: React.ReactNode }> = ({ title, count, right }) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {count != null ? (
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    ) : null}
    <View style={{ flex: 1 }} />
    {right}
  </View>
);

export const Empty: React.FC<{ text: string }> = ({ text }) => <Text style={styles.empty}>{text}</Text>;

/* A label and its value, as in the detail views. */
export const Pair: React.FC<{ label: string; value: React.ReactNode; wide?: boolean; mono?: boolean }> = ({ label, value, wide, mono }) => (
  <View style={[styles.pair, wide && styles.pairWide]}>
    <Text style={styles.pairLabel}>{label}</Text>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text style={[styles.pairValue, mono && styles.mono]}>{value}</Text>
    ) : (
      value
    )}
  </View>
);

export const fd = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  body: { padding: 14, paddingBottom: 40, width: '100%', maxWidth: 760, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderMedium, padding: 14, ...shadows.xs },
  mono: { fontFamily: 'monospace' },
  muted: { fontSize: 12, color: colors.textMuted },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
});

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, paddingHorizontal: 14, borderRadius: radius.md },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primaryMuted },
  btnText: { fontSize: 14, fontWeight: '700' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 17, color: colors.textPrimary },
  count: { minWidth: 24, height: 22, paddingHorizontal: 7, borderRadius: 11, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: 10 },
  pair: { flexBasis: '46%', flexGrow: 1, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  pairWide: { flexBasis: '100%' },
  pairLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  pairValue: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  mono: { fontFamily: 'monospace', fontSize: 13 },
});
