import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, Circle, Clock, Drill, FlaskConical, Map as MapIcon, Ruler, TestTubes, Truck, XCircle } from 'lucide-react'
import { KpiCard } from '../../../shared/components/KpiCard'
import { formatDayMonth } from '../../../shared/utils/date'
import { FIELD_SECTIONS, getFieldSectionByKey } from '../data/fieldDatabase'
import { fieldsOf, recordStat, rowsOf } from '../data/fieldFormats'
import { fieldNumber, sampleRegister } from '../utils/dispatch'
import { toUtm } from '../utils/geo'
import './fieldOverview.css'

/* One hue for single-series bars; three for the map groups (validated together, all pairs, light surface). */
const BAR = '#00909a'
const GROUPS = [
  { key: 'surface', label: 'Mapping, trench & channel', color: '#00909a', shape: 'circle' },
  { key: 'geochem', label: 'Soil & stream samples', color: '#eb6834', shape: 'triangle' },
  { key: 'drill', label: 'Borehole collars', color: '#6250d6', shape: 'square' },
]

/* Where each format keeps its position: UTM east / north, or longitude / latitude (converted). */
const POSITION = {
  'geological-mapping': { group: 'surface', east: 'UTM_E_WGS84', north: 'UTM_N_WGS84', label: 'M_ST' },
  'trench-mapping': { group: 'surface', lon: 'START_LONG', lat: 'START_LATT', label: 'TRENCH_ID' },
  'channel-sampling': { group: 'surface', lon: 'LONGITUDE', lat: 'LATTITUDE', label: 'CHANNEL_ID' },
  'soil-sampling': { group: 'geochem', east: 'UTM_E', north: 'UTM_N', label: 'SAMPLE_NUMBER' },
  'stream-sediment': { group: 'geochem', east: 'UTM_EASTING', north: 'UTM_NORTHING', label: 'SAMPLE_ID' },
  'collar-survey': { group: 'drill', east: 'UTM_EAST', north: 'UTM_NORTH', label: 'BHID' },
}

const LAB_DONE = ['QAQC passes', 'QAQC Failed', 'Partly accepted', 'Partly Rejected']
const LAB_BAD = ['QAQC Failed', 'Partly Rejected']

function pointOf(rec) {
  const pos = POSITION[rec.section]
  if (!pos) return null
  const v = fieldsOf(rec)
  let east = Number(v[pos.east])
  let north = Number(v[pos.north])
  if (pos.lat) {
    const lat = Number(v[pos.lat])
    const lon = Number(v[pos.lon])
    if (!lat || !lon) return null
    ;({ east, north } = toUtm(lat, lon))
  }
  if (!east || !north) return null
  return { east, north, group: pos.group, label: v[pos.label] || rec.id, format: getFieldSectionByKey(rec.section)?.shortTitle, projectId: rec.projectId }
}

function ChartTip({ active, payload, render }) {
  if (!active || !payload?.length) return null
  return <div className="fo-tip">{render(payload[0].payload)}</div>
}

const axisTick = { fontSize: 12, fill: 'var(--ink-2)' }

/*
 * The picture of the field work for the people who oversee it: how many samples each format has
 * produced, metres drilled day by day, where every point sits on the ground, and the lab batches.
 */
export function FieldOverview({ records, allRecords = records, projects }) {
  const register = useMemo(() => sampleRegister(records), [records])

  const bySection = useMemo(() => {
    const counts = {}
    register.forEach((s) => (counts[s.section] = (counts[s.section] ?? 0) + 1))
    return FIELD_SECTIONS.filter((s) => counts[s.key]).map((s) => ({ name: s.shortTitle, value: counts[s.key], route: s.route }))
  }, [register])

  const dprs = records.filter((r) => r.section === 'core-drilling-dpr')
  const drilling = useMemo(() => {
    const days = new Map()
    dprs.forEach((r) => {
      const d = days.get(r.date) ?? { date: r.date, metres: 0, recovered: 0 }
      d.metres += Number(recordStat('core-drilling-dpr', r, 'metres')) || 0
      d.recovered += Number(recordStat('core-drilling-dpr', r, 'recovered')) || 0
      days.set(r.date, d)
    })
    return [...days.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((d) => ({ ...d, metres: Number(d.metres.toFixed(1)), label: formatDayMonth(d.date), recovery: d.metres ? Math.round((d.recovered / d.metres) * 1000) / 10 : 0 }))
  }, [dprs])
  const metres = drilling.reduce((t, d) => t + d.metres, 0)

  const batches = records.filter((r) => r.section === 'dispatch-database').sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const atLab = batches.filter((b) => !LAB_DONE.includes(fieldsOf(b).STATUS)).reduce((t, b) => t + rowsOf(b, 'samples').length, 0)
  // Whoever sent it: an employee's sample in a colleague's batch has gone to the lab too.
  const sentNumbers = new Set(allRecords.filter((r) => r.section === 'dispatch-database').flatMap((b) => rowsOf(b, 'samples').map(fieldNumber)))
  const notSent = register.filter((s) => !sentNumbers.has(s.number) && (!s.cat || s.cat === 'ORD')).length

  const points = useMemo(() => records.map(pointOf).filter(Boolean), [records])
  const mapProjects = useMemo(() => {
    const counts = new Map()
    points.forEach((p) => counts.set(p.projectId, (counts.get(p.projectId) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => projects.find((p) => p.id === id) ?? { id, name: id })
  }, [points, projects])
  const [mapProject, setMapProject] = useState('')
  const shownProject = mapProjects.some((p) => p.id === mapProject) ? mapProject : mapProjects[0]?.id
  const mapPoints = points.filter((p) => p.projectId === shownProject)

  return (
    <div className="fo">
      <section className="stat-grid" aria-label="Field figures">
        <KpiCard tone="tone-info" icon={TestTubes} label="Samples recorded" value={register.length}>
          across {bySection.length} format{bySection.length === 1 ? '' : 's'}
        </KpiCard>
        <KpiCard tone="tone-good" icon={Ruler} label="Metres drilled" value={Number(metres.toFixed(1))}>
          {dprs.length} daily report{dprs.length === 1 ? '' : 's'}
        </KpiCard>
        <KpiCard tone="tone-attention" icon={FlaskConical} label="Samples at the lab" value={atLab}>
          waiting for results
        </KpiCard>
        <KpiCard tone="tone-neutral" icon={Truck} label="Not yet dispatched" value={notSent}>
          ordinary samples
        </KpiCard>
      </section>

      <div className="fo-row">
        <section className="card fo-card">
          <header className="card-header">
            <TestTubes className="card-icon" size={20} strokeWidth={1.8} />
            <h2>Samples by format</h2>
          </header>
          {bySection.length === 0 ? (
            <p className="fo-empty">No samples recorded yet.</p>
          ) : (
            <div className="fo-chart" style={{ height: Math.max(160, bySection.length * 44 + 30) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySection} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="var(--line-soft)" />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--teal-50)' }} content={<ChartTip render={(d) => <><strong>{d.name}</strong><span>{d.value} samples</span></>} />} />
                  <Bar dataKey="value" fill={BAR} barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: 12, fill: 'var(--ink)', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card fo-card">
          <header className="card-header">
            <Drill className="card-icon" size={20} strokeWidth={1.8} />
            <h2>Metres drilled per day</h2>
            <Link to="/field-database/core-drilling-dpr" className="link-button card-actions">
              Daily reports
            </Link>
          </header>
          {drilling.length === 0 ? (
            <p className="fo-empty">No drilling reports yet.</p>
          ) : (
            <div className="fo-chart" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drilling} margin={{ top: 18, right: 12, bottom: 4, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} unit=" m" width={56} />
                  <Tooltip cursor={{ fill: 'var(--teal-50)' }} content={<ChartTip render={(d) => <><strong>{d.label}</strong><span>{d.metres} m drilled</span><span>Core recovery {d.recovery}%</span></>} />} />
                  <Bar dataKey="metres" fill={BAR} barSize={22} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="metres" position="top" style={{ fontSize: 12, fill: 'var(--ink)', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="fo-row">
        <section className="card fo-card">
          <header className="card-header">
            <MapIcon className="card-icon" size={20} strokeWidth={1.8} />
            <h2>Where the work is</h2>
            {mapProjects.length > 1 && (
              <select className="card-actions" value={shownProject} onChange={(e) => setMapProject(e.target.value)} aria-label="Project on the map">
                {mapProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.lead?.location ?? p.name}
                  </option>
                ))}
              </select>
            )}
          </header>
          {mapPoints.length === 0 ? (
            <p className="fo-empty">No positions recorded yet.</p>
          ) : (
            <>
              <div className="fo-chart" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="var(--line-soft)" />
                    <XAxis type="number" dataKey="east" name="East" domain={['dataMin - 150', 'dataMax + 150']} tick={axisTick} tickFormatter={(v) => `${Math.round(v)}`} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="north" name="North" domain={['dataMin - 150', 'dataMax + 150']} tick={axisTick} tickFormatter={(v) => `${Math.round(v)}`} axisLine={false} tickLine={false} width={70} />
                    <Tooltip cursor={{ stroke: 'var(--line)' }} content={<ChartTip render={(d) => <><strong>{d.label}</strong><span>{d.format}</span><span className="fd-mono">E {d.east} · N {d.north}</span></>} />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                    {GROUPS.map((g) => {
                      const data = mapPoints.filter((p) => p.group === g.key)
                      return data.length ? <Scatter key={g.key} name={g.label} data={data} fill={g.color} shape={g.shape} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false} /> : null
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="fo-note">UTM east / north (metres). Trench and channel starts are converted from latitude / longitude.</p>
            </>
          )}
        </section>

        <section className="card fo-card">
          <header className="card-header">
            <Truck className="card-icon" size={20} strokeWidth={1.8} />
            <h2>Lab batches</h2>
            <Link to="/field-database/dispatch-database" className="link-button card-actions">
              Sample dispatch
            </Link>
          </header>
          {batches.length === 0 ? (
            <p className="fo-empty">No batch sent to a lab yet.</p>
          ) : (
            <ol className="fo-batches">
              {batches.slice(0, 5).map((b) => {
                const v = fieldsOf(b)
                const status = v.STATUS || 'Pending'
                const steps = [
                  { label: 'Dispatched', on: b.date, done: true },
                  { label: 'At lab', on: v.LAB_RECEIVED, done: Boolean(v.LAB_RECEIVED) || status !== 'Pending' },
                  { label: LAB_DONE.includes(status) ? status : 'Results', on: v.RESULT_RECEIVED, done: LAB_DONE.includes(status), bad: LAB_BAD.includes(status) },
                ]
                return (
                  <li key={b.id} className="fo-batch">
                    <div className="fo-batch-head">
                      <strong className="fd-mono">{v.BATCH_ID || b.id}</strong>
                      <span className="fo-muted">
                        {v.LAB} · {v.DATA_TYPE?.toLowerCase()} · {rowsOf(b, 'samples').length} samples
                      </span>
                    </div>
                    <div className="fo-steps">
                      {steps.map((s) => (
                        <span key={s.label} className={`fo-step${s.done ? ' done' : ''}${s.bad ? ' bad' : ''}`}>
                          {s.bad ? <XCircle size={15} /> : s.done ? <CheckCircle2 size={15} /> : s.label === 'Results' ? <Clock size={15} /> : <Circle size={15} />}
                          <span>
                            {s.label}
                            {s.on && <small>{formatDayMonth(s.on)}</small>}
                          </span>
                        </span>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
