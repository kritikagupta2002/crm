import { TrendingUp } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCrm } from '../../context/crm'
import { getMonthlyTrend } from '../../utils/dashboardStats'

export function EnquiryTrend() {
  const data = getMonthlyTrend(useCrm().leads)
  const recent = data.slice(3).reduce((sum, m) => sum + m.enquiries, 0)
  const earlier = data.slice(0, 3).reduce((sum, m) => sum + m.enquiries, 0)
  const growth = earlier ? Math.round(((recent - earlier) / earlier) * 100) : 0

  return (
    <section className="card trend-card">
      <header className="card-header">
        <TrendingUp className="card-icon" size={22} strokeWidth={1.8} />
        <h2>Enquiry Trend</h2>
        <div className="card-actions legend">
          <span>
            <i style={{ background: 'var(--teal-600)' }} /> Enquiries
          </span>
          <span>
            <i style={{ background: 'var(--gold-500)' }} /> Won
          </span>
        </div>
      </header>

      <p className="trend-note">
        Last 3 months:{' '}
        <span className={growth >= 0 ? 'delta-up' : 'delta-down'}>
          {growth >= 0 ? '+' : '−'}
          {Math.abs(growth)}%
        </span>{' '}
        vs the 3 months before
      </p>

      <div className="trend-body">
        <div className="trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="enquiryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a8089" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#2a8089" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf1f3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7c8b96', fontSize: 12 }} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload.label ?? ''}
                contentStyle={{
                  borderRadius: 6,
                  border: '1px solid #e1e8eb',
                  fontSize: 12,
                }}
              />

              <Area
                type="monotone"
                dataKey="enquiries"
                name="Enquiries"
                stroke="#2a8089"
                strokeWidth={2}
                fill="url(#enquiryFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="converted"
                name="Won"
                stroke="#c8943a"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
