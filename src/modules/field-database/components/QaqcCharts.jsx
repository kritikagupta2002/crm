import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { DUP_RANGE, ELEMENTS } from '../utils/qaqc'

/*
 * The client's QAQC charts, one per element: blanks against their expected value, duplicates against
 * their originals with the client's 95–105 % lines, a CRM's results against its certified value and
 * its 1, 2 and 3 SD lines. One hue for the results; a duplicate outside 95–105 % turns red.
 * Blanks and CRMs are not judged: the client has not given their rule yet.
 */
const MARK = '#00909a'
const TONE = { pass: MARK, open: MARK, fail: 'var(--red)', missing: 'var(--ink-3)' }
const VERDICT = { pass: 'Within 95–105%', open: 'Pass/fail rule awaited from the client', fail: 'Outside 95–105%', missing: 'Awaiting result' }
const axisTick = { fontSize: 11, fill: 'var(--ink-2)' }
const tickNum = (v) => Number(Number(v).toFixed(2))

function Tip({ active, payload, element, kind }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const v = d.row.el[element]
  return (
    <div className="fo-tip">
      <strong className="fd-mono">{d.row.sampleNo}</strong>
      <span>
        {d.row.batchId} · {d.row.date}
      </span>
      {kind === 'dup' && <span>Original {v.org ?? '—'} ppm</span>}
      {kind === 'crm' && v.bands && <span>Certified {v.bands.value} ± {v.bands.sd} ppm</span>}
      {kind === 'blank' && <span>Should read about {v.org} ppm</span>}
      <span>
        Lab {v.lab ?? '—'} ppm{kind === 'dup' && v.pct != null ? ` · ${v.pct}%` : ''}
        {kind === 'crm' && v.z != null ? ` · ${v.z > 0 ? '+' : ''}${v.z} SD` : ''}
      </span>
      <span className={`qa-verdict qa-${v.verdict}`}>{VERDICT[v.verdict]}</span>
    </div>
  )
}

/* A dot coloured by its check, with the surface ring that keeps neighbours apart. */
const dot = (element) =>
  function Dot({ cx, cy, payload }) {
    if (cx == null || cy == null || payload.y == null) return null
    const v = payload.row.el[element].verdict
    return <circle cx={cx} cy={cy} r={v === 'fail' ? 5 : 4} fill={TONE[v]} stroke="var(--surface)" strokeWidth={2} />
  }

function ChartFrame({ element, children, empty }) {
  return (
    <figure className="qa-chart">
      <figcaption>{element} (ppm)</figcaption>
      {empty ? <p className="fo-empty">No results yet.</p> : <div className="qa-plot">{children}</div>}
    </figure>
  )
}

/* Results in sample order, a line through them, the reference lines over the plot. */
function SequenceChart({ rows, element, kind, lines, domain }) {
  const data = rows.map((r, i) => ({ i: i + 1, y: r.el[element].lab, row: r })).filter((d) => d.y != null)
  return (
    <ChartFrame element={element} empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 54, bottom: 4, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--line-soft)" />
          <XAxis dataKey="i" tick={axisTick} axisLine={{ stroke: 'var(--line)' }} tickLine={false} allowDecimals={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={52} domain={domain} tickFormatter={tickNum} allowDataOverflow />
          <Tooltip cursor={{ stroke: 'var(--line)' }} content={<Tip element={element} kind={kind} />} />
          {lines.map((l) => (
            <ReferenceLine key={l.label} y={l.y} stroke={l.color} strokeDasharray={l.dash ? '4 4' : undefined} strokeWidth={1.5} ifOverflow="extendDomain" label={{ value: l.label, position: 'right', fontSize: 10, fill: 'var(--ink-2)' }} />
          ))}
          <Line dataKey="y" stroke={MARK} strokeWidth={2} dot={dot(element)} activeDot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function BlankCharts({ rows }) {
  return (
    <div className="qa-charts">
      {ELEMENTS.map((e) => {
        const expected = rows[0]?.el[e].org
        const lines = expected == null ? [] : [{ y: expected, label: `Org ${expected}`, color: 'var(--ink-3)' }]
        return <SequenceChart key={e} rows={rows} element={e} kind="blank" lines={lines} domain={[0, 'auto']} />
      })}
    </div>
  )
}

export function CrmCharts({ rows }) {
  return (
    <div className="qa-charts">
      {ELEMENTS.map((e) => {
        const b = rows.find((r) => r.el[e].bands)?.el[e].bands
        const lines = b
          ? [
              { y: b.value, label: 'Certified', color: 'var(--ink-2)' },
              ...[1, 2, 3].flatMap((k) => [
                { y: b[`p${k}`], label: `+${k}SD`, color: 'var(--ink-3)', dash: true },
                { y: b[`m${k}`], label: `−${k}SD`, color: 'var(--ink-3)', dash: true },
              ]),
            ]
          : []
        const domain = b ? [(min) => Math.min(min, b.m3 - b.sd), (max) => Math.max(max, b.p3 + b.sd)] : ['auto', 'auto']
        return <SequenceChart key={e} rows={rows} element={e} kind="crm" lines={lines} domain={domain} />
      })}
    </div>
  )
}

/* Duplicate against original: the 1:1 line and the 95 % / 105 % lines either side. */
export function DuplicateCharts({ rows }) {
  return (
    <div className="qa-charts">
      {ELEMENTS.map((e) => {
        const data = rows.map((r) => ({ x: r.el[e].org, y: r.el[e].lab, row: r })).filter((d) => d.x != null && d.y != null)
        const top = Math.max(1, ...data.flatMap((d) => [d.x, d.y])) * 1.1
        const seg = (k) => [{ x: 0, y: 0 }, { x: top, y: top * k }]
        return (
          <ChartFrame key={e} element={e} empty={!data.length}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, bottom: 14, left: -8 }}>
                <CartesianGrid stroke="var(--line-soft)" />
                <XAxis type="number" dataKey="x" name="Original" domain={[0, top]} tick={axisTick} tickFormatter={(v) => Math.round(v)} axisLine={{ stroke: 'var(--line)' }} tickLine={false} label={{ value: 'Original', position: 'insideBottom', offset: -8, fontSize: 11, fill: 'var(--ink-2)' }} />
                <YAxis type="number" dataKey="y" name="Duplicate" domain={[0, top]} tick={axisTick} tickFormatter={(v) => Math.round(v)} axisLine={false} tickLine={false} width={52} />
                <Tooltip cursor={false} content={<Tip element={e} kind="dup" />} />
                <ReferenceLine segment={seg(1)} stroke="var(--ink-3)" strokeWidth={1.5} ifOverflow="hidden" />
                <ReferenceLine segment={seg(DUP_RANGE[1] / 100)} stroke="var(--amber)" strokeDasharray="4 4" ifOverflow="hidden" />
                <ReferenceLine segment={seg(DUP_RANGE[0] / 100)} stroke="var(--amber)" strokeDasharray="4 4" ifOverflow="hidden" />
                <Scatter data={data} shape={dot(e)} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartFrame>
        )
      })}
    </div>
  )
}
