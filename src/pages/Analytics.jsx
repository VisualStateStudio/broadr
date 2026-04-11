import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, MousePointerClick, Eye, RefreshCw, CheckCircle,
  Users, Heart, MessageCircle, Globe, BarChart2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import KPICard from '../components/ui/KPICard.jsx'
import { fetchAnalytics, fetchAgencyClient } from '../services/supabaseApi.js'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'ads',       label: 'Ads' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook',  label: 'Facebook' },
  { id: 'website',   label: 'Website' },
]

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const PLATFORM_COLORS = { meta: '#2563EB', google: '#DC2626', both: '#9333EA' }

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit:   (dir) => ({ x: dir > 0 ? -32 : 32, opacity: 0, transition: { duration: 0.18 } }),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRange(days) {
  const end   = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  }
}

function fmt(n)      { return Number(n).toLocaleString() }
function fmtDate(d)  { return new Date(d).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) }
function fmtShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Shared UI components ────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '', decimals = 0 }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.10)' }}>
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
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#D1D5DB' }}>No data for this period</span>
    </div>
  )
}

function SyncBar({ syncing, msg, onSync, label = 'Sync' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {msg && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: msg.startsWith('Sync failed') ? '#DC2626' : '#10B981', display: 'flex', alignItems: 'center', gap: 5 }}>
          {!msg.startsWith('Sync failed') && <CheckCircle size={13} />}
          {msg}
        </span>
      )}
      <button onClick={onSync} disabled={syncing} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff',
        cursor: syncing ? 'default' : 'pointer',
        fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500,
        color: syncing ? '#9CA3AF' : '#374151', transition: 'all 150ms ease',
      }}
        onMouseEnter={e => { if (!syncing) e.currentTarget.style.borderColor = '#FF5C00' }}
        onMouseLeave={e => { if (!syncing) e.currentTarget.style.borderColor = '#E5E7EB' }}
      >
        <RefreshCw size={13} strokeWidth={2} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : label}
      </button>
    </div>
  )
}

function NoDataState({ onSync, syncing }) {
  return (
    <div className="glass-1" style={{ padding: 48, textAlign: 'center', gridColumn: 'span 12' }}>
      <BarChart2 size={32} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} strokeWidth={1.5} />
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No data yet</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', margin: '0 0 20px' }}>Hit Sync to pull your latest data</p>
      <button onClick={onSync} disabled={syncing} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
        borderRadius: 10, border: 'none', background: '#FF5C00', color: '#fff',
        cursor: syncing ? 'default' : 'pointer',
        fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
      }}>
        <RefreshCw size={14} strokeWidth={2} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  )
}

// ─── Tab content: Ads ────────────────────────────────────────────────────────

function AdsTab({ agency, range }) {
  const [raw,     setRaw]     = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (!agency?.id) return
    setLoading(true)
    const { start, end } = dateRange(range)
    fetchAnalytics(agency.id, start, end)
      .then(setRaw)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [agency, range])

  const totals = useMemo(() => {
    const spend       = raw.reduce((s, r) => s + Number(r.spend), 0)
    const revenue     = raw.reduce((s, r) => s + Number(r.revenue), 0)
    const conversions = raw.reduce((s, r) => s + Number(r.conversions), 0)
    const impressions = raw.reduce((s, r) => s + Number(r.impressions), 0)
    const roas        = spend > 0 ? revenue / spend : 0
    return { spend, revenue, conversions, impressions, roas }
  }, [raw])

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
      roas:      d.spend > 0 ? +(d.revenue / d.spend).toFixed(2) : 0,
      dateLabel: fmtDate(d.date),
    }))
  }, [raw])

  const platformData = useMemo(() => {
    const map = {}
    raw.forEach(r => {
      const p = r.campaigns?.platform ?? 'other'
      map[p] = (map[p] ?? 0) + Number(r.spend)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }))
  }, [raw])

  const hasData = raw.length > 0

  const handleSync = useCallback(async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const res  = await fetch('/.netlify/functions/meta-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: range }) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setSyncMsg(`Synced ${json.campaigns} campaigns · ${json.records} records`)
      if (agency?.id) {
        setLoading(true)
        const { start, end } = dateRange(range)
        setRaw(await fetchAnalytics(agency.id, start, end))
      }
    } catch (e) {
      setSyncMsg('Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
      setLoading(false)
      setTimeout(() => setSyncMsg(''), 5000)
    }
  }, [range, agency])

  return (
    <motion.div className="bento-grid" variants={containerVariants} initial="hidden" animate="visible">
      <KPICard title="Total Spend"   value={loading ? undefined : totals.spend}       prefix="$"  decimals={0} icon={DollarSign}       accentColor="#FF5C00" loading={loading} colSpan={3} />
      <KPICard title="Avg ROAS"      value={loading ? undefined : totals.roas}         suffix="x"  decimals={2} icon={TrendingUp}        accentColor="#0EA5E9" loading={loading} colSpan={3} />
      <KPICard title="Conversions"   value={loading ? undefined : totals.conversions}              decimals={0} icon={MousePointerClick} accentColor="#8B5CF6" loading={loading} colSpan={3} />
      <KPICard title="Impressions"   value={loading ? undefined : totals.impressions}              decimals={0} icon={Eye}               accentColor="#10B981" loading={loading} colSpan={3} />

      {/* Sync row */}
      <motion.div variants={cardVariants} style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end' }}>
        <SyncBar syncing={syncing} msg={syncMsg} onSync={handleSync} label="Sync Meta" />
      </motion.div>

      {/* Spend over time */}
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
                  <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
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

      {/* Platform split */}
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

      {/* ROAS trend */}
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
              <Line type="monotone" dataKey={() => 1} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 4" dot={false} legendType="none" />
              <Line type="monotone" dataKey="roas" stroke="#0EA5E9" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#0EA5E9' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Conversions */}
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
  )
}

// ─── Tab content: Instagram ───────────────────────────────────────────────────

function InstagramTab({ range }) {
  const [data,    setData]    = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [msg,     setMsg]     = useState('')

  const handleSync = useCallback(async () => {
    setSyncing(true); setMsg('')
    try {
      const res  = await fetch(`/.netlify/functions/instagram-insights?days=${range}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setData(json)
      setMsg('Synced successfully')
    } catch (e) {
      setMsg('Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setMsg(''), 5000)
    }
  }, [range])

  const dailySeries = useMemo(() =>
    (data?.daily ?? []).map(d => ({ ...d, dateLabel: fmtDate(d.date) }))
  , [data])

  const hasData = !!data

  return (
    <motion.div className="bento-grid" variants={containerVariants} initial="hidden" animate="visible">
      <KPICard title="Followers"     value={hasData ? data.followers    : undefined} decimals={0} icon={Users}      accentColor="#E1306C" loading={false} colSpan={3} />
      <KPICard title="Reach"         value={hasData ? data.reach        : undefined} decimals={0} icon={Eye}        accentColor="#FF5C00" loading={false} colSpan={3} />
      <KPICard title="Interactions"  value={hasData ? data.interactions : undefined} decimals={0} icon={Heart}      accentColor="#8B5CF6" loading={false} colSpan={3} />
      <KPICard title="Engaged Accts" value={hasData ? data.engaged      : undefined} decimals={0} icon={TrendingUp} accentColor="#10B981" loading={false} colSpan={3} />

      {/* Sync */}
      <motion.div variants={cardVariants} style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end' }}>
        <SyncBar syncing={syncing} msg={msg} onSync={handleSync} label="Sync Instagram" />
      </motion.div>

      {!hasData ? <NoDataState onSync={handleSync} syncing={syncing} /> : (
        <>
          {/* Reach vs Impressions chart */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 8', padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Reach & Impressions</h2>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily — last {range} days</span>
            </div>
            {dailySeries.length === 0 ? <EmptyChart height={200} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="igReachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E1306C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E1306C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
                  <Tooltip content={<CustomTooltip decimals={0} />} />
                  <Line type="monotone" dataKey="reach"              stroke="#E1306C" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Reach" />
                  <Line type="monotone" dataKey="accounts_engaged"  stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Engaged" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[{ color: '#E1306C', label: 'Reach' }, { color: '#8B5CF6', label: 'Engaged' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#6B7280' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Profile views */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 4', padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Profile Views</h2>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily — last {range} days</span>
            </div>
            {dailySeries.length === 0 ? <EmptyChart height={200} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="igViewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF5C00" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={40} />
                  <Tooltip content={<CustomTooltip decimals={0} />} />
                  <Area type="monotone" dataKey="profile_views" stroke="#FF5C00" strokeWidth={2} fill="url(#igViewsGrad)" dot={false} activeDot={{ r: 4, fill: '#FF5C00' }} name="Profile Views" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Top posts grid */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 12', padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 20px' }}>Recent Posts</h2>
            {data.posts?.length === 0 ? (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No posts found</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {data.posts.map(post => (
                  <IgPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function IgPostCard({ post }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ borderRadius: 12, overflow: 'hidden', background: '#F7F7F7', position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ aspectRatio: '1/1', background: '#F0F0F0' }}>
        {post.url ? (
          <img src={post.url} alt={post.caption || 'Post'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={24} style={{ color: '#D1D5DB' }} strokeWidth={1.5} />
          </div>
        )}
      </div>
      {/* Hover overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,17,23,0.6)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 200ms ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff' }}>
          <Heart size={14} fill="currentColor" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', fontWeight: 600 }}>{fmt(post.likes)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fff' }}>
          <MessageCircle size={14} fill="currentColor" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', fontWeight: 600 }}>{fmt(post.comments)}</span>
        </div>
      </div>
      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '8px 10px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#6B7280', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {post.caption}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab content: Facebook ────────────────────────────────────────────────────

function FacebookTab({ range }) {
  const [data,    setData]    = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [msg,     setMsg]     = useState('')

  const handleSync = useCallback(async () => {
    setSyncing(true); setMsg('')
    try {
      const res  = await fetch(`/.netlify/functions/facebook-insights?days=${range}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setData(json)
      setMsg('Synced successfully')
    } catch (e) {
      setMsg('Sync failed: ' + e.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setMsg(''), 5000)
    }
  }, [range])

  const dailySeries = useMemo(() =>
    (data?.daily ?? []).map(d => ({
      ...d,
      reach:    d.page_reach             ?? 0,
      engaged:  d.page_engaged_users     ?? 0,
      dateLabel: fmtDate(d.date),
    }))
  , [data])

  const hasData = !!data

  return (
    <motion.div className="bento-grid" variants={containerVariants} initial="hidden" animate="visible">
      <KPICard title="Page Likes"    value={hasData ? data.pageLikes   : undefined} decimals={0} icon={Heart}          accentColor="#1877F2" loading={false} colSpan={3} />
      <KPICard title="Reach"         value={hasData ? data.reach        : undefined} decimals={0} icon={Eye}            accentColor="#FF5C00" loading={false} colSpan={3} />
      <KPICard title="Impressions"   value={hasData ? data.impressions  : undefined} decimals={0} icon={TrendingUp}     accentColor="#8B5CF6" loading={false} colSpan={3} />
      <KPICard title="Engaged Users" value={hasData ? data.engaged      : undefined} decimals={0} icon={Users}          accentColor="#10B981" loading={false} colSpan={3} />

      {/* Sync */}
      <motion.div variants={cardVariants} style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'flex-end' }}>
        <SyncBar syncing={syncing} msg={msg} onSync={handleSync} label="Sync Facebook" />
      </motion.div>

      {!hasData ? <NoDataState onSync={handleSync} syncing={syncing} /> : (
        <>
          {/* Daily reach chart */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 8', padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>Reach & Engaged Users</h2>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily — last {range} days</span>
            </div>
            {dailySeries.length === 0 ? <EmptyChart height={200} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fbReachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1877F2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fbEngagedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={48} />
                  <Tooltip content={<CustomTooltip decimals={0} />} />
                  <Area type="monotone" dataKey="reach"   stroke="#1877F2" strokeWidth={2} fill="url(#fbReachGrad)"   dot={false} activeDot={{ r: 4 }} name="Reach" />
                  <Area type="monotone" dataKey="engaged" stroke="#10B981" strokeWidth={2} fill="url(#fbEngagedGrad)" dot={false} activeDot={{ r: 4 }} name="Engaged" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[{ color: '#1877F2', label: 'Reach' }, { color: '#10B981', label: 'Engaged Users' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#6B7280' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* New fans */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 4', padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 2px' }}>New Page Likes</h2>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>Daily — last {range} days</span>
            </div>
            {dailySeries.length === 0 ? <EmptyChart height={200} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={range <= 7 ? 20 : range <= 30 ? 12 : 5}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                  <Tooltip content={<CustomTooltip decimals={0} />} />
                  <Bar dataKey="page_fan_adds_unique" fill="#1877F2" radius={[4, 4, 0, 0]} name="New Likes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Recent posts */}
          <motion.div className="glass-1" variants={cardVariants} style={{ gridColumn: 'span 12', padding: 24 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 20px' }}>Recent Posts</h2>
            {data.posts?.length === 0 ? (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No posts found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.posts.map(post => (
                  <div key={post.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    {post.image && (
                      <img src={post.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.message || '(No caption)'}
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0' }}>
                        {new Date(post.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Heart size={13} style={{ color: '#9CA3AF' }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#374151' }}>{fmt(post.likes)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MessageCircle size={13} style={{ color: '#9CA3AF' }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#374151' }}>{fmt(post.comments)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

// ─── Tab content: Website (coming soon) ──────────────────────────────────────

function WebsiteTab() {
  return (
    <motion.div
      className="bento-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants} style={{ gridColumn: 'span 12' }}>
        <div className="glass-1" style={{ padding: 72, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#FFF0E8', border: '1.5px solid rgba(255,92,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Globe size={24} style={{ color: '#FF5C00' }} strokeWidth={1.75} />
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#0F1117', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Website Analytics
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', color: '#6B7280', margin: '0 0 6px' }}>
            Coming soon — connect Google Analytics or Plausible
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>
            Sessions, bounce rate, top pages, and traffic sources will appear here
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const [agency,       setAgency]       = useState(null)
  const [activeTab,    setActiveTab]    = useState('ads')
  const [tabDirection, setTabDirection] = useState(1)
  const [range,        setRange]        = useState(30)

  useEffect(() => {
    fetchAgencyClient().then(setAgency).catch(console.error)
  }, [])

  const switchTab = (id) => {
    const currentIdx = TABS.findIndex(t => t.id === activeTab)
    const newIdx     = TABS.findIndex(t => t.id === id)
    setTabDirection(newIdx > currentIdx ? 1 : -1)
    setActiveTab(id)
  }

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '28px 28px 0', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
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
                onClick={() => setRange(r.days)}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500,
                  background: range === r.days ? '#FFFFFF' : 'transparent',
                  color:      range === r.days ? '#0F1117'  : '#9CA3AF',
                  boxShadow:  range === r.days ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, background: '#F0F0F0', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                position: 'relative', padding: '7px 18px', borderRadius: 9, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
                color: activeTab === tab.id ? '#0F1117' : '#9CA3AF',
                transition: 'color 150ms ease', zIndex: 1,
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="analytics-tab-pill"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 9,
                    background: '#FFFFFF',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait" custom={tabDirection}>
        <motion.div
          key={activeTab}
          custom={tabDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {activeTab === 'ads'       && <AdsTab       agency={agency} range={range} />}
          {activeTab === 'instagram' && <InstagramTab range={range} />}
          {activeTab === 'facebook'  && <FacebookTab  range={range} />}
          {activeTab === 'website'   && <WebsiteTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
