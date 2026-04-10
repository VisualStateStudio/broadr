import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Zap, BarChart2, ChevronDown } from 'lucide-react'
import KPICard from '../components/ui/KPICard.jsx'
import Badge from '../components/ui/Badge.jsx'
import { fetchDashboardKPIs, fetchCampaigns, fetchClients } from '../services/supabaseApi.js'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function PlatformIcon({ platform }) {
  if (platform === 'meta')   return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#2563EB' }}>META</span>
  if (platform === 'google') return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#DC2626' }}>GOOG</span>
  return <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#9333EA' }}>BOTH</span>
}

export default function Dashboard() {
  const [clients,          setClients]          = useState([])
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [kpis,             setKpis]             = useState(null)
  const [campaigns,        setCampaigns]         = useState([])
  const [loading,          setLoading]           = useState(true)
  const [kpiLoading,       setKpiLoading]        = useState(false)

  // Load all clients once; default to agency
  useEffect(() => {
    fetchClients()
      .then(all => {
        setClients(all)
        const agency = all.find(c => c.is_agency) ?? all[0]
        if (agency) setSelectedClientId(agency.id)
      })
      .catch(console.error)
  }, [])

  // Re-fetch KPIs + campaigns whenever selected client changes
  useEffect(() => {
    if (!selectedClientId) return
    setKpiLoading(true)
    Promise.all([
      fetchDashboardKPIs(selectedClientId),
      fetchCampaigns(selectedClientId),
    ])
      .then(([k, c]) => { setKpis(k); setCampaigns(c) })
      .catch(console.error)
      .finally(() => { setKpiLoading(false); setLoading(false) })
  }, [selectedClientId])

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const recentCampaigns = campaigns.slice(0, 6)

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '28px 28px 0', marginBottom: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem',
            fontWeight: 700, color: '#0F1117', margin: 0, letterSpacing: '-0.02em',
          }}>
            {selectedClient?.name ?? 'Dashboard'}
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#6B7280', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {clients.length > 1 && (
          <div style={{ position: 'relative' }}>
            <select
              value={selectedClientId ?? ''}
              onChange={e => setSelectedClientId(e.target.value)}
              style={{
                appearance: 'none', padding: '7px 32px 7px 12px',
                borderRadius: 8, border: '1px solid #E5E7EB',
                background: '#fff', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.875rem',
                fontWeight: 500, color: '#374151', outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={e => { e.target.style.borderColor = '#FF5C00' }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.is_agency ? ' (Agency)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          </div>
        )}
      </div>

      {/* Bento grid */}
      <motion.div
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI row — 4 × 3-col micro cards */}
        <KPICard
          title="Spend This Month"
          value={kpis?.totalSpend}
          prefix="$"
          decimals={0}
          icon={DollarSign}
          accentColor="#FF5C00"
          loading={loading || kpiLoading}
          colSpan={3}
        />
        <KPICard
          title="Active Campaigns"
          value={kpis?.activeCampaigns}
          decimals={0}
          icon={Zap}
          accentColor="#10B981"
          loading={loading || kpiLoading}
          colSpan={3}
        />
        <KPICard
          title="Conversions"
          value={kpis?.totalConversions}
          decimals={0}
          icon={TrendingUp}
          accentColor="#8B5CF6"
          loading={loading || kpiLoading}
          colSpan={3}
        />
        <KPICard
          title="ROAS"
          value={kpis?.roas}
          suffix="x"
          decimals={2}
          icon={BarChart2}
          accentColor="#0EA5E9"
          loading={loading || kpiLoading}
          colSpan={3}
        />

        {/* Recent campaigns — 8 col */}
        <motion.div
          className="glass-1"
          variants={cardVariants}
          style={{ gridColumn: 'span 8', padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: 0 }}>
              Campaigns
            </h2>
            <a href="/campaigns" style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#FF5C00', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </a>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: 44, borderRadius: 10 }} />)}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF' }}>
              No campaigns yet — add your first one
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentCampaigns.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  cursor: 'pointer', transition: 'background 150ms ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.85)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                >
                  <PlatformIcon platform={c.platform} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#0F1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    {c.objective && (
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#9CA3AF', marginTop: 1 }}>
                        {c.objective}
                      </div>
                    )}
                  </div>
                  <Badge label={c.status} variant={c.status} />
                  {c.daily_budget && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#374151', flexShrink: 0 }}>
                      ${Number(c.daily_budget).toFixed(0)}/day
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick stats — 4 col */}
        <motion.div
          className="glass-1"
          variants={cardVariants}
          style={{ gridColumn: 'span 4', padding: 24 }}
        >
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', margin: '0 0 20px' }}>
            Overview
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Total campaigns',  value: kpis?.totalCampaigns ?? '—' },
              { label: 'Active now',       value: kpis?.activeCampaigns ?? '—', accent: '#059669' },
              { label: 'Total spend MTD',  value: kpis?.totalSpend != null ? `$${Number(kpis.totalSpend).toLocaleString()}` : '—' },
              { label: 'Avg ROAS',         value: kpis?.roas != null ? `${Number(kpis.roas).toFixed(2)}x` : '—', accent: kpis?.roas >= 1 ? '#059669' : '#DC2626' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#6B7280' }}>{row.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', fontWeight: 500, color: row.accent ?? '#0F1117' }}>
                  {loading ? '…' : row.value}
                </span>
              </div>
            ))}
          </div>

          {!loading && activeCampaigns.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '20px 0' }} />
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 10 }}>ACTIVE NOW</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeCampaigns.slice(0, 3).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'status-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
