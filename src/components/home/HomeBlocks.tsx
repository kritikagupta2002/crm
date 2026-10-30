import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { colors, fonts, radius, shadows } from '../../theme';

/*
 * The pieces every role's home screen is built from, in the web CRM's colour code:
 * blue = new / info, amber = in progress or needs attention, red = overdue, green = done / on track,
 * teal and gold for the brand.
 */
export type Tone = 'teal' | 'gold' | 'blue' | 'amber' | 'red' | 'green' | 'slate';

export const TONES: Record<Tone, { fg: string; bg: string; edge: string }> = {
  teal: { fg: colors.primary, bg: colors.primaryBg, edge: colors.primary },
  gold: { fg: colors.goldDark, bg: colors.goldBg, edge: colors.gold },
  blue: { fg: colors.info, bg: colors.infoBg, edge: colors.info },
  amber: { fg: colors.warning, bg: colors.warningBg, edge: colors.warning },
  red: { fg: colors.danger, bg: colors.dangerBg, edge: colors.danger },
  green: { fg: colors.success, bg: colors.successBg, edge: colors.success },
  slate: { fg: colors.textSecondary, bg: colors.surfaceSubtle, edge: colors.borderDark },
};

type IconType = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/* ₹ in lakh / crore, as the web CRM writes it. */
/* A notification's kind, as a tone and icon. */
export const NOTICE_TONE: Record<string, { tone: Tone; Icon: any }> = {
  success: { tone: 'green', Icon: CheckCircle2 },
  warning: { tone: 'amber', Icon: AlertTriangle },
  danger: { tone: 'red', Icon: AlertTriangle },
  info: { tone: 'blue', Icon: Info },
};

export const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins)) return iso || ''; // seeds already say '2 hours ago'
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export const inr = (n: number) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

export const SectionTitle: React.FC<{ title: string; count?: number; action?: string; onAction?: () => void }> = ({
  title,
  count,
  action,
  onAction,
}) => (
  <View style={styles.sectionRow}>
    <View style={styles.sectionLeft}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count ? (
        <View style={styles.countPill}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
    {action && onAction ? (
      <TouchableOpacity onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export interface Stat {
  label: string;
  value: string | number;
  sub?: string;
  Icon: IconType;
  tone: Tone;
  onPress?: () => void;
}

/* Two stat cards per row, each with a tinted icon and a coloured top edge. */
export const StatGrid: React.FC<{ items: Stat[] }> = ({ items }) => (
  <View style={styles.grid}>
    {items.map((s) => {
      const t = TONES[s.tone];
      return (
        <TouchableOpacity
          key={s.label}
          activeOpacity={s.onPress ? 0.8 : 1}
          onPress={s.onPress}
          disabled={!s.onPress}
          style={[styles.stat, { borderTopColor: t.edge }]}
        >
          <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
            <s.Icon size={17} color={t.fg} strokeWidth={2.1} />
          </View>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {s.value}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            {s.label}
          </Text>
          {s.sub ? (
            <Text style={styles.statSub} numberOfLines={1}>
              {s.sub}
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

export interface ActionItem {
  key: string;
  title: string;
  sub?: string;
  Icon: IconType;
  tone: Tone;
  /** What sits at the right: a count, an amount or a status word. */
  tag?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

/* A card of rows, each opening the screen where the work is done. */
export const ActionList: React.FC<{ items: ActionItem[]; empty?: string }> = ({ items, empty }) => (
  <View style={styles.panel}>
    {items.length === 0 ? <Text style={styles.empty}>{empty || 'Nothing here right now.'}</Text> : null}
    {items.map((a, i) => {
      const t = TONES[a.tone];
      return (
        <TouchableOpacity
          key={a.key}
          activeOpacity={a.onPress ? 0.75 : 1}
          disabled={!a.onPress}
          onPress={a.onPress}
          style={[styles.row, i > 0 && styles.rowLine]}
        >
          <View style={[styles.rowIcon, { backgroundColor: t.bg }]}>
            <a.Icon size={18} color={t.fg} strokeWidth={2} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {a.title}
            </Text>
            {a.sub ? (
              <Text style={styles.rowSub} numberOfLines={2}>
                {a.sub}
              </Text>
            ) : null}
          </View>
          {a.right}
          {a.tag ? (
            <View style={[styles.tag, { backgroundColor: t.bg }]}>
              <Text style={[styles.tagText, { color: t.fg }]}>{a.tag}</Text>
            </View>
          ) : null}
          {a.onPress && !a.right ? <ChevronRight size={16} color={colors.textTertiary} /> : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

/* A plain white card with an optional title row. */
export const Panel: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.panel, styles.panelPad, style]}>{children}</View>
);

/* A bar split by share, with a labelled legend underneath (the pipeline on the web dashboard). */
export const SplitBar: React.FC<{ parts: { label: string; value: number; display: string; tone: Tone }[] }> = ({ parts }) => {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <View>
      <View style={styles.bar}>
        {parts.map((p) =>
          p.value > 0 ? <View key={p.label} style={{ flex: p.value / total, backgroundColor: TONES[p.tone].fg }} /> : null,
        )}
      </View>
      <View style={styles.legend}>
        {parts.map((p) => (
          <View key={p.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: TONES[p.tone].fg }]} />
            <View>
              <Text style={styles.legendLabel}>{p.label}</Text>
              <Text style={styles.legendValue}>{p.display}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const homeStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  body: { padding: 14, paddingBottom: 32, width: '100%', maxWidth: 720, alignSelf: 'center' },
});

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.warningText },
  sectionAction: { fontSize: 13, fontWeight: '600', color: colors.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderTopWidth: 3,
    padding: 12,
    ...shadows.xs,
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
  statLabel: { marginTop: 2, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  statSub: { marginTop: 2, fontSize: 11.5, color: colors.textMuted },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    overflow: 'hidden',
    ...shadows.xs,
  },
  panelPad: { padding: 14 },
  empty: { padding: 16, fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowSub: { marginTop: 2, fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  tagText: { fontSize: 11.5, fontWeight: '700' },

  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, backgroundColor: colors.surfaceSubtle },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  legendLabel: { fontSize: 11.5, color: colors.textMuted },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
