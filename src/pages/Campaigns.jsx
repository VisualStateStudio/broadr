import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'
import { fetchCampaigns, fetchClients, insertCampaign, updateCampaign, deleteCampaign } from '../services/supabaseApi.js'
import { Field, inputStyle, focusOrange, blurGrey } from '../components/ui/FormField.jsx'
import { useTextScramble } from '../hooks/useTextScramble.js'

const PLATFORMS   = ['meta', 'google', 'both']
const STATUSES    = ['draft', 'active', 'paused', 'completed']
const OBJECTIVES  = ['Brand Awareness', 'Lead Generation', 'Website Traffic', 'Conversions', 'Retargeting', 'Engagement']

const EMPTY_FORM = {
  client_id: '', name: '', platform: 'meta', status: 'draft',
  objective: '', daily_budget: '', total_budget: '',
  start_date: '', end_date: '', notes: '',
}


export default function Campaigns() {
  const [clients,   setClients]   = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  const agency = useMemo(() => clients.find(c => c.is_agency), [clients])
  const titleRef = useTextScramble({ trigger: 'mount' })

  useEffect(() => {
    async function load() {
      try {
        const [cl, ca] = await Promise.all([fetchClients(), fetchCampaigns()])
        setClients(cl)
        setCampaigns(ca)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, client_id: agency?.id ?? '' })
    setError(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      client_id:    c.client_id,
      name:         c.name,
      platform:     c.platform,
      status:       c.status,
      objective:    c.objective     ?? '',
      daily_budget: c.daily_budget  ?? '',
      total_budget: c.total_budget  ?? '',
      start_date:   c.start_date    ?? '',
      end_date:     c.end_date      ?? '',
      notes:        c.notes         ?? '',
    })
    setError(null)
    setShowForm(true)
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = useCallback(async () => {
    if (!form.name.trim())    { setError('Campaign name is required'); return }
    if (!form.client_id)      { setError('Please select a client');    return }
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
        total_budget: form.total_budget ? Number(form.total_budget) : null,
        start_date:   form.start_date || null,
        end_date:     form.end_date   || null,
        objective:    form.objective  || null,
        notes:        form.notes      || null,
      }
      if (editing) {
        const updated = await updateCampaign(editing.id, payload)
        setCampaigns(cs => cs.map(c => c.id === editing.id ? { ...updated, clients: clients.find(cl => cl.id === updated.client_id) } : c))
      } else {
        const created = await insertCampaign(payload)
        setCampaigns(cs => [{ ...created, clients: clients.find(cl => cl.id === created.client_id) }, ...cs])
      }
      setShowForm(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [form, editing, clients])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return
    try {
      await deleteCampaign(id)
      setCampaigns(cs => cs.filter(c => c.id !== id))
      if (editing?.id === id) setShowForm(false)
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return campaigns.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(q)
      const matchFilter = filter === 'all' || c.status === filter || c.platform === filter
      return matchSearch && matchFilter
    })
  }, [campaigns, search, filter])

  return (
    <div style={{ padding: 28, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 ref={titleRef} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <span style={{ color: '#FF5C00', fontSize: '0.5rem', marginRight: '0.75rem', verticalAlign: 'middle' }}>&#9632;</span>
            Campaigns
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 400, color: '#6B7280', margin: '4px 0 0' }}>
            {campaigns.length} total · {campaigns.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={15} strokeWidth={2.5} />
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        {['all', 'active', 'paused', 'draft', 'meta', 'google'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${filter === f ? '#FF5C00' : '#E5E7EB'}`,
            background: filter === f ? '#FFF0E8' : '#fff', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500,
            color: filter === f ? '#FF5C00' : '#374151', transition: 'all 150ms ease',
            textTransform: 'capitalize',
          }}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-1" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', color: '#9CA3AF', margin: 0 }}>
            {campaigns.length === 0 ? 'No campaigns yet — create your first one' : 'No campaigns match your search'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c, i) => (
            <motion.div key={c.id} className="glass-1"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: '1px solid #F0F0F0', transition: 'background-color 150ms ease' }}
              onClick={() => openEdit(c)}
              whileHover={{ y: -1, backgroundColor: '#FAFAFA' }}
            >
              {/* Platform */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', fontWeight: 700, color: c.platform === 'meta' ? '#2563EB' : c.platform === 'google' ? '#DC2626' : '#9333EA' }}>
                  {c.platform.toUpperCase().slice(0, 4)}
                </span>
              </div>

              {/* Name + client */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 500, color: '#0F1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF', marginTop: 2 }}>
                  {c.clients?.name ?? c.objective ?? '—'}
                </div>
              </div>

              {/* Budget */}
              {c.daily_budget && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#374151', flexShrink: 0 }}>
                  ${Number(c.daily_budget).toFixed(0)}/day
                </div>
              )}

              <Badge label={c.status} variant={c.status} />

              <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }} style={{
                display: 'flex', padding: 6, borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer', color: '#9CA3AF',
                transition: 'color 150ms ease',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Slide panel */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.35)', zIndex: 40 }}
              onClick={() => setShowForm(false)} />
            <motion.div className="glass-3"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 50, padding: 28, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#0F1117', margin: 0 }}>
                  {editing ? 'Edit Campaign' : 'New Campaign'}
                </h2>
                <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {error && (
                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: '#FEE2E2', border: '1px solid rgba(220,38,38,0.2)', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Client">
                  <select value={form.client_id} onChange={set('client_id')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select client</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name}{cl.is_agency ? ' (Agency)' : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Campaign Name">
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Lead Gen — Spring 2026" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Platform">
                    <select value={form.platform} onChange={set('platform')} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={form.status} onChange={set('status')} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Objective">
                  <select value={form.objective} onChange={set('objective')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select objective</option>
                    {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Daily Budget ($)">
                    <input type="number" min="0" value={form.daily_budget} onChange={set('daily_budget')} placeholder="0.00" style={inputStyle}
                      onFocus={focusOrange} onBlur={blurGrey} />
                  </Field>
                  <Field label="Total Budget ($)">
                    <input type="number" min="0" value={form.total_budget} onChange={set('total_budget')} placeholder="0.00" style={inputStyle}
                      onFocus={focusOrange} onBlur={blurGrey} />
                  </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Start Date">
                    <input type="date" value={form.start_date} onChange={set('start_date')} style={{ ...inputStyle, cursor: 'pointer' }} />
                  </Field>
                  <Field label="End Date">
                    <input type="date" value={form.end_date} onChange={set('end_date')} style={{ ...inputStyle, cursor: 'pointer' }} />
                  </Field>
                </div>

                <Field label="Notes">
                  <textarea value={form.notes} onChange={set('notes')} placeholder="Campaign notes…" rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>

              {editing && (
                <button onClick={() => handleDelete(editing.id)} className="btn-danger" style={{ marginTop: 10 }}>Delete Campaign</button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
