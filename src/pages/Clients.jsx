import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, Globe, Building2 } from 'lucide-react'
import { fetchClients, insertClient, updateClient, deleteClient } from '../services/supabaseApi.js'

const INDUSTRIES = [
  'Content & Marketing', 'E-commerce', 'Real Estate', 'Hospitality & Food',
  'Health & Fitness', 'Fashion & Beauty', 'Technology', 'Finance',
  'Education', 'Entertainment', 'Construction', 'Other',
]

const EMPTY_FORM = { name: '', industry: '', website: '', logo_url: '', notes: '' }

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #E5E7EB', background: '#FFFFFF',
  fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#0F1117',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms ease',
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ClientAvatar({ name, size = 48 }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // deterministic color from name
  const colors = ['#FF5C00', '#10B981', '#8B5CF6', '#0EA5E9', '#F59E0B', '#EC4899']
  const color  = colors[name.charCodeAt(0) % colors.length]

  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: `${color}18`, border: `1.5px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: size * 0.33, color }}>
        {initials}
      </span>
    </div>
  )
}

export default function Clients() {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name:     c.name,
      industry: c.industry ?? '',
      website:  c.website  ?? '',
      logo_url: c.logo_url ?? '',
      notes:    c.notes    ?? '',
    })
    setError(null)
    setShowForm(true)
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { setError('Client name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        name:     form.name.trim(),
        industry: form.industry || null,
        website:  form.website  || null,
        logo_url: form.logo_url || null,
        notes:    form.notes    || null,
      }
      if (editing) {
        const updated = await updateClient(editing.id, payload)
        setClients(cs => cs.map(c => c.id === editing.id ? updated : c))
      } else {
        const created = await insertClient(payload)
        setClients(cs => [...cs, created])
      }
      setShowForm(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [form, editing])

  const handleDelete = async (id) => {
    const client = clients.find(c => c.id === id)
    if (client?.is_agency) { alert("Can't delete your agency client."); return }
    if (!window.confirm('Delete this client?')) return
    try {
      await deleteClient(id)
      setClients(cs => cs.filter(c => c.id !== id))
      if (editing?.id === id) setShowForm(false)
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(q) || (c.industry ?? '').toLowerCase().includes(q))
  }, [clients, search])

  // Agency client pinned to top
  const sorted = useMemo(() => [
    ...filtered.filter(c => c.is_agency),
    ...filtered.filter(c => !c.is_agency),
  ], [filtered])

  return (
    <div style={{ padding: 28, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F1117', margin: 0, letterSpacing: '-0.02em' }}>
            Clients
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: 'none',
          background: '#FF5C00', color: '#fff', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
          transition: 'background 150ms ease',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E00'}
          onMouseLeave={e => e.currentTarget.style.background = '#FF5C00'}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 24 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          style={{ ...inputStyle, paddingLeft: 32 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: 130, borderRadius: 16 }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-1" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', color: '#9CA3AF', margin: 0 }}>
            {clients.length === 0 ? 'No clients yet — add your first one' : 'No clients match your search'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sorted.map((c, i) => (
            <motion.div
              key={c.id}
              className="glass-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, boxShadow: '0 2px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.09)' }}
              onClick={() => openEdit(c)}
              style={{ padding: 20, cursor: 'pointer', position: 'relative' }}
            >
              {/* Agency badge */}
              {c.is_agency && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  padding: '2px 8px', borderRadius: 6,
                  background: '#FFF0E8', border: '1px solid rgba(255,92,0,0.2)',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.6875rem',
                  fontWeight: 600, color: '#FF5C00', letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  Agency
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <ClientAvatar name={c.name} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#0F1117', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  {c.industry && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Building2 size={11} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF' }}>
                        {c.industry}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {c.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}
                  onClick={e => { e.stopPropagation(); window.open(c.website.startsWith('http') ? c.website : `https://${c.website}`, '_blank') }}
                >
                  <Globe size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.website.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Slide-in form panel */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.35)', zIndex: 40 }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              className="glass-3"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 50, padding: 28, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#0F1117', margin: 0 }}>
                  {editing ? 'Edit Client' : 'New Client'}
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
                <Field label="Client Name">
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Visual State Studio" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </Field>

                <Field label="Industry">
                  <select value={form.industry} onChange={set('industry')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>

                <Field label="Website">
                  <input value={form.website} onChange={set('website')} placeholder="yoursite.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </Field>

                <Field label="Notes">
                  <textarea value={form.notes} onChange={set('notes')} placeholder="Any notes about this client…" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem', fontWeight: 500, color: '#374151', transition: 'background 150ms ease',
                }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                  background: saving ? '#FFAD8A' : '#FF5C00', cursor: saving ? 'default' : 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
                  color: '#fff', transition: 'background 150ms ease',
                }}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Client'}
                </button>
              </div>

              {editing && !editing.is_agency && (
                <button onClick={() => handleDelete(editing.id)} style={{
                  width: '100%', marginTop: 10, padding: '9px', borderRadius: 10,
                  border: '1px solid rgba(220,38,38,0.2)', background: '#FEE2E2',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem',
                  fontWeight: 500, color: '#DC2626', transition: 'background 150ms ease',
                }}>
                  Delete Client
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
