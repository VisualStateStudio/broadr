import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, MousePointerClick, Eye } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import KPICard from '../components/ui/KPICard.jsx'
import { fetchAnalytics, fetchAgencyClient } from '../services/supabaseApi.js'

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const PLATFORM_COLORS = { meta: '#2563EB', google: '#DC2626', both: '#9333EA' }

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function dateRange(days) {
  const end   = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  }
}

function fmt(n) { return Number(n).toLocaleString() }
function fmtShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '', decimals = 0 }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', fontWeight: 600, color: '#0F1117' }}>
            {prefix}{Number(p.value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ height = 180 }) {
  return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#D1D5DB' }}>
        No data for this period
      </span>
    </div>
  )
}

export default function Analytics() {
  const [agency,    setAgency]    = useState(null)
  const [raw,       setRaw]       = useState([])
  const [loading,   setLoading]   = useState(true)
  const [range,     setRange]     = useState(30)

  useEffect(() => {
    async function load() {
      try {
        const ag = await fetchAgencyClient()
        setAgency(ag)
        const { start, end } = dateRange(range)
        setRaw(await fetchAnalytics(ag.id, start, end))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [range])

  // ── Aggregations ─────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const spend       = raw.reduce((s, r) => s + Number(r.spend), 0)
    const revenue     = raw.reduce((s, r) => s + Number(r.revenue), 0)
    const conversions = raw.reduce((s, r) => s + Number(r.conversions), 0)
    const impressions = raw.reduce((s, r) => s + Number(r.impressions), 0)
    const roas        = spend > 0 ? revenue / spend : 0
    return { spend, revenue, conversions, impressions, roas }
  }, [raw])

  // Daily time-series (spend + conversions + roas)
  const dailySeries = useMemo(() => {
    const map = {}
    raw.forEach(r => {
      if (!map[r.date]) map[r.date] = { date: r.date, spend: 0, conversions: 0, revenue: 0, impressions: 0 }
      map[r.date].spend       += Number(r.spend)
      map[r.date].conversions += Number(r.conversions)
      map[r.date].revenue     += Number(r.revenue)
      map[r.date].impressions += Number(r.impressions)
    })
    return Object.values(map).map(d => ({
      ...d,
      roas:        d.spend > 0 ? +(d.revenue / d.spend).toFixed(2) : 0,
      dateLabel:   new Date(d.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
    }))
  }, [raw])

  // Platform split for donut
  const platformData = useMemo(() => {
    const map = {}
    raw.forEach(r => {
      const p = r.campaigns?.platform ?? 'other'
      map[p] = (map[p] ?? 0) + Number(r.spend)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }))
  }, [raw])

  const hasData = raw.length > 0

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '28px 28px 0', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F1117', margin: 0, letterSpacing: '-0.02em' }}>
            Analytics
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {agency?.name ?? ''}
          </p>
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4, background: '#F0F0F0', borderRadius: 10, padding: 4 }}>
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => { setLoading(true); setRange(r.days) }}
              style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500,
                background: range === r.days ? '#FFFFFF' : 'transparent',
                color: range === r.days ? '#0F1117' : '#9CA3AF',
                boxShadow: range === r.days ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bento grid */}
      <motion.div
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI row */}
        <KPICard title="Total Spend"       value={loading ? undefined : totals.spend}       prefix="$"  decimals={0} icon={DollarSign}        accentColor="#FF5C00" loading={loading} colSpan={3} />
        <KPICard title="Avg ROAS"          value={loading ? undefined : totals.roas}         suffix="x"  decimals={2} icon={TrendingUp}         accentColor="#0EA5E9" loading={loading} colSpan={3} />
        <KPICard title="Conversions"       value={loading ? undefined : totals.conversions}              decimals={0} icon={MousePointerClick}  accentColor="#8B5CF6" loading={loading} colSpan={3} />
        <KPICard title="Impressions"       value={loading ? undefined : totals.impressions}              decimals={0} icon={Eye}                accentColor="#10B981" loading={loading} colSpan={3} />

        {/* Spend over time — 8 col */}
        <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 8', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Spend Over Time</h2>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily ad spend — last {range} days</span>
          </div>
          {!hasData ? <EmptyChart height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF5C00" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#FF5C00" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${fmtShort(v)}`} width={52} />
                <Tooltip content={<CustomTooltip prefix="$" decimals={0} />} />
                <Area type="monotone" dataKey="spend" stroke="#FF5C00" strokeWidth={2} fill="url(#spendGrad)" dot={false} activeDot={{ r: 4, fill: '#FF5C00' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Platform split — 4 col */}
        <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 4', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Platform Split</h2>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Spend by platform</span>
          </div>
          {!hasData || platformData.length === 0 ? <EmptyChart height={200} /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value">
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[entry.name] ?? '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [`$${fmt(v)}`, 'Spend']} contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, borderRadius: 10, border: '1px solid #E5E7EB' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {platformData.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[p.name] ?? '#9CA3AF' }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#374151', textTransform: 'capitalize' }}>{p.name}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#0F1117', fontWeight: 500 }}>${fmt(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* ROAS trend — 6 col */}
        <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 6', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>ROAS Trend</h2>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Return on ad spend over time</span>
          </div>
          {!hasData ? <EmptyChart height={180} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}x`} width={40} />
                <Tooltip content={<CustomTooltip suffix="x" decimals={2} />} />
                {/* 1x break-even reference */}
                <Line type="monotone" dataKey={() => 1} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 4" dot={false} legendType="none" />
                <Line type="monotone" dataKey="roas" stroke="#0EA5E9" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#0EA5E9' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Conversions bar — 6 col */}
        <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 6', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Conversions</h2>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily conversions over time</span>
          </div>
          {!hasData ? <EmptyChart height={180} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={range <= 7 ? 24 : range <= 30 ? 14 : 6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<CustomTooltip decimals={0} />} />
                <Bar dataKey="conversions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
