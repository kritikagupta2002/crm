import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText, Rect } from 'react-native-svg';
import { colors, radius } from '../../theme';
import { DUP_RANGE, ELEMENTS } from '../utils/qaqc';

/*
 * The client's QAQC charts, one per element, as on the web: blanks against their expected value,
 * duplicates against their originals with the 95–105 % lines, a CRM's results against its certified
 * value and its 1, 2 and 3 SD lines. One hue for results; a duplicate outside 95–105 % turns red.
 */
const MARK = colors.primaryLight;
const TONE: Record<string, string> = { pass: MARK, open: MARK, fail: colors.danger, missing: colors.textTertiary };
const H = 190;
const PAD = { l: 44, r: 52, t: 12, b: 24 };

const nice = (v: number) => (Math.abs(v) >= 100 ? Math.round(v) : Number(v.toFixed(Math.abs(v) >= 10 ? 1 : 2)));

function Frame({ element, empty, children }: { element: string; empty: boolean; children: (w: number) => React.ReactNode }) {
  const [w, setW] = useState(0);
  return (
    <View style={styles.chart} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 24)}>
      <Text style={styles.caption}>{element} (ppm)</Text>
      {empty ? <Text style={styles.empty}>No results yet.</Text> : w > 0 ? children(w) : <View style={{ height: H }} />}
    </View>
  );
}

type RefLine = { y: number; label: string; color: string; dash?: boolean };

/* Results in sample order with a line through them, and the reference lines across. */
function SequenceChart({ rows, element, lines, floorZero }: { rows: any[]; element: string; lines: RefLine[]; floorZero?: boolean }) {
  const data = rows.map((r, i) => ({ i, y: r.el[element].lab, v: r.el[element].verdict })).filter((d) => d.y != null);
  return (
    <Frame element={element} empty={!data.length}>
      {(w) => {
        const ys = [...data.map((d) => d.y), ...lines.map((l) => l.y)];
        let lo = Math.min(...ys);
        let hi = Math.max(...ys);
        if (floorZero) lo = 0;
        const span = hi - lo || Math.abs(hi) || 1;
        lo -= floorZero ? 0 : span * 0.08;
        hi += span * 0.08;
        const n = Math.max(rows.length - 1, 1);
        const x = (i: number) => PAD.l + (i / n) * (w - PAD.l - PAD.r);
        const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
        const ticks = [lo, (lo + hi) / 2, hi];
        return (
          <Svg width={w} height={H}>
            {ticks.map((t, k) => (
              <React.Fragment key={k}>
                <Line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke={colors.borderLight} strokeWidth={1} />
                <SvgText x={PAD.l - 6} y={y(t) + 4} fontSize={10} fill={colors.textMuted} textAnchor="end">
                  {nice(t)}
                </SvgText>
              </React.Fragment>
            ))}
            {lines.map((l) => (
              <React.Fragment key={l.label}>
                <Line x1={PAD.l} x2={w - PAD.r} y1={y(l.y)} y2={y(l.y)} stroke={l.color} strokeWidth={1.5} strokeDasharray={l.dash ? '4 4' : undefined} />
                <SvgText x={w - PAD.r + 4} y={y(l.y) + 3} fontSize={9.5} fill={colors.textSecondary}>
                  {l.label}
                </SvgText>
              </React.Fragment>
            ))}
            <Polyline points={data.map((d) => `${x(d.i)},${y(d.y)}`).join(' ')} fill="none" stroke={MARK} strokeWidth={2} />
            {data.map((d) => (
              <Circle key={d.i} cx={x(d.i)} cy={y(d.y)} r={d.v === 'fail' ? 5 : 4} fill={TONE[d.v]} stroke={colors.surface} strokeWidth={2} />
            ))}
            <SvgText x={PAD.l} y={H - 6} fontSize={10} fill={colors.textMuted}>
              1
            </SvgText>
            <SvgText x={w - PAD.r} y={H - 6} fontSize={10} fill={colors.textMuted} textAnchor="end">
              {rows.length}
            </SvgText>
          </Svg>
        );
      }}
    </Frame>
  );
}

export function BlankCharts({ rows }: { rows: any[] }) {
  return (
    <View>
      {ELEMENTS.map((e: string) => {
        const expected = rows[0]?.el[e].org;
        return <SequenceChart key={e} rows={rows} element={e} floorZero lines={expected == null ? [] : [{ y: expected, label: `Org ${expected}`, color: colors.textTertiary }]} />;
      })}
    </View>
  );
}

export function CrmCharts({ rows }: { rows: any[] }) {
  return (
    <View>
      {ELEMENTS.map((e: string) => {
        const b = rows.find((r) => r.el[e].bands)?.el[e].bands;
        const lines: RefLine[] = b
          ? [
              { y: b.value, label: 'Certified', color: colors.textSecondary },
              ...[1, 2, 3].flatMap((k) => [
                { y: b[`p${k}`], label: `+${k}SD`, color: colors.textTertiary, dash: true },
                { y: b[`m${k}`], label: `−${k}SD`, color: colors.textTertiary, dash: true },
              ]),
            ]
          : [];
        return <SequenceChart key={e} rows={rows} element={e} lines={lines} />;
      })}
    </View>
  );
}

/* Duplicate against original: the 1:1 line and the 95 % / 105 % lines either side. */
export function DuplicateCharts({ rows }: { rows: any[] }) {
  return (
    <View>
      {ELEMENTS.map((e: string) => {
        const data = rows.map((r, i) => ({ i, x: r.el[e].org, y: r.el[e].lab, v: r.el[e].verdict })).filter((d) => d.x != null && d.y != null);
        return (
          <Frame key={e} element={e} empty={!data.length}>
            {(w) => {
              const top = Math.max(1, ...data.flatMap((d) => [d.x, d.y])) * 1.1;
              const size = Math.min(w - PAD.l - 16, H - PAD.t - PAD.b);
              const px = (v: number) => PAD.l + (v / top) * size;
              const py = (v: number) => PAD.t + (1 - v / top) * size;
              const seg = (k: number) => ({ x1: px(0), y1: py(0), x2: px(top / Math.max(k, 1)), y2: py((top / Math.max(k, 1)) * k) });
              return (
                <Svg width={w} height={H}>
                  <Rect x={PAD.l} y={PAD.t} width={size} height={size} fill="none" stroke={colors.borderLight} />
                  {[0, top / 2, top].map((t, k) => (
                    <React.Fragment key={k}>
                      <SvgText x={PAD.l - 6} y={py(t) + 4} fontSize={10} fill={colors.textMuted} textAnchor="end">
                        {Math.round(t)}
                      </SvgText>
                      <SvgText x={px(t)} y={PAD.t + size + 14} fontSize={10} fill={colors.textMuted} textAnchor="middle">
                        {Math.round(t)}
                      </SvgText>
                    </React.Fragment>
                  ))}
                  <Line {...seg(1)} stroke={colors.textTertiary} strokeWidth={1.5} />
                  <Line {...seg(DUP_RANGE[1] / 100)} stroke={colors.warning} strokeWidth={1.2} strokeDasharray="4 4" />
                  <Line {...seg(DUP_RANGE[0] / 100)} stroke={colors.warning} strokeWidth={1.2} strokeDasharray="4 4" />
                  {data.map((d) => (
                    <Circle key={d.i} cx={px(d.x)} cy={py(d.y)} r={d.v === 'fail' ? 5 : 4} fill={TONE[d.v]} stroke={colors.surface} strokeWidth={2} />
                  ))}
                  <SvgText x={PAD.l + size + 8} y={PAD.t + 10} fontSize={10} fill={colors.textSecondary}>
                    {`${DUP_RANGE[1]}%`}
                  </SvgText>
                  <SvgText x={PAD.l + size + 8} y={PAD.t + 24} fontSize={10} fill={colors.textSecondary}>
                    {`${DUP_RANGE[0]}%`}
                  </SvgText>
                </Svg>
              );
            }}
          </Frame>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.md, padding: 12, marginBottom: 10 },
  caption: { fontSize: 12.5, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  empty: { fontSize: 12.5, color: colors.textMuted, paddingVertical: 20, textAlign: 'center' },
});
