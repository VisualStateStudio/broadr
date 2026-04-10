import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Film, Image, Search, ExternalLink, Link } from 'lucide-react'
import {
  fetchCreativeAssets, insertCreativeAsset, updateCreativeAsset,
  deleteCreativeAsset, uploadCreativeFile, fetchAgencyClient, fetchCampaigns, fetchClients,
} from '../services/supabaseApi.js'

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

function TypeBadge({ type }) {
  const isVideo = type === 'video'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 5,
      background: isVideo ? '#1F2937' : '#FFF0E8',
      color: isVideo ? '#F9FAFB' : '#FF5C00',
      fontFamily: "'Inter', sans-serif", fontSize: '0.6875rem', fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {isVideo ? <Film size={9} strokeWidth={2.5} /> : <Image size={9} strokeWidth={2.5} />}
      {type}
    </span>
  )
}

function AssetCard({ asset, onClick }) {
  const [hovered, setHovered] = useState(false)
  const isVideo = asset.type === 'video'

  return (
    <motion.div
      className="glass-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 2px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.09)' }}
      style={{ cursor: 'pointer', overflow: 'hidden' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: isVideo ? '#111827' : '#F7F7F7', overflow: 'hidden' }}>
        {!isVideo && asset.file_url ? (
          <img
            src={asset.file_url}
            alt={asset.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms ease' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Film size={32} style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,17,23,0.45)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <div style={{
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
            fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, color: '#fff',
          }}>
            Edit
          </div>
          {asset.file_url && (
            <a href={asset.file_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, color: '#fff',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}>
              <ExternalLink size={12} /> View
            </a>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: '#0F1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.name}
          </span>
          <TypeBadge type={asset.type} />
        </div>
        {asset.campaigns?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link size={10} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {asset.campaigns.name}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Creative() {
  const fileInputRef = useRef(null)

  const [agency,    setAgency]    = useState(null)
  const [assets,    setAssets]    = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [clients,   setClients]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [search,    setSearch]    = useState('')
  const [typeFilter,setTypeFilter]= useState('all')
  const [showPanel, setShowPanel] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState({ name: '', campaign_id: '', notes: '' })
  const [saving,    setSaving]    = useState(false)
  const [panelError,setPanelError]= useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [ag, cl, ca] = await Promise.all([fetchAgencyClient(), fetchClients(), fetchCampaigns()])
        setAgency(ag)
        setClients(cl)
        setCampaigns(ca)
        setAssets(await fetchCreativeAssets(ag.id))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length || !agency) return
    setUploading(true)
    let done = 0
    const added = []
    for (const file of files) {
      setUploadMsg(`Uploading ${done + 1} of ${files.length}…`)
      try {
        const isVideo = file.type.startsWith('video/')
        const url     = await uploadCreativeFile(file, agency.id)
        const record  = await insertCreativeAsset({
          client_id:     agency.id,
          name:          file.name.replace(/\.[^.]+$/, ''),
          type:          isVideo ? 'video' : 'photo',
          file_url:      url,
          thumbnail_url: isVideo ? null : url,
        })
        added.push(record)
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err.message)
      }
      done++
    }
    setAssets(prev => [...added.reverse(), ...prev])
    setUploading(false)
    setUploadMsg('')
    e.target.value = ''
  }

  const openEdit = (asset) => {
    setEditing(asset)
    setForm({
      name:        asset.name,
      campaign_id: asset.campaign_id ?? '',
      notes:       asset.notes       ?? '',
    })
    setPanelError(null)
    setShowPanel(true)
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { setPanelError('Name is required'); return }
    setSaving(true); setPanelError(null)
    try {
      const updated = await updateCreativeAsset(editing.id, {
        name:        form.name.trim(),
        campaign_id: form.campaign_id || null,
        notes:       form.notes       || null,
      })
      setAssets(prev => prev.map(a => a.id === editing.id ? { ...updated, campaigns: campaigns.find(c => c.id === updated.campaign_id) } : a))
      setShowPanel(false)
    } catch (e) {
      setPanelError(e.message)
    } finally {
      setSaving(false)
    }
  }, [form, editing, campaigns])

  const handleDelete = async () => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return
    try {
      await deleteCreativeAsset(editing.id, editing.file_url)
      setAssets(prev => prev.filter(a => a.id !== editing.id))
      setShowPanel(false)
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(q)
      const matchType   = typeFilter === 'all' || a.type === typeFilter
      return matchSearch && matchType
    })
  }, [assets, search, typeFilter])

  const photoCount = assets.filter(a => a.type === 'photo').length
  const videoCount = assets.filter(a => a.type === 'video').length

  return (
    <div style={{ padding: 28, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F1117', margin: 0, letterSpacing: '-0.02em' }}>
            Creative
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            {photoCount} photo{photoCount !== 1 ? 's' : ''} · {videoCount} video{videoCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {uploading && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF' }}>
              {uploadMsg}
            </span>
          )}
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
            onChange={handleUpload} style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 10, border: 'none',
              background: uploading ? '#FFAD8A' : '#FF5C00',
              color: '#fff', cursor: uploading ? 'default' : 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = '#E04E00' }}
            onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = '#FF5C00' }}
          >
            <Upload size={15} strokeWidth={2.5} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…"
            style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        {['all', 'photo', 'video'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} style={{
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${typeFilter === f ? '#FF5C00' : '#E5E7EB'}`,
            background: typeFilter === f ? '#FFF0E8' : '#fff', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500,
            color: typeFilter === f ? '#FF5C00' : '#374151', transition: 'all 150ms ease',
            textTransform: 'capitalize',
          }}>{f === 'all' ? 'All' : f}</button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ aspectRatio: '4/3', borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-1" style={{ padding: 64, textAlign: 'center' }}>
          <Upload size={32} style={{ color: '#E5E7EB', margin: '0 auto 12px', display: 'block' }} strokeWidth={1.5} />
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
            {assets.length === 0 ? 'No assets yet' : 'No assets match your search'}
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
            {assets.length === 0 ? 'Hit Upload to add your first photo or video' : 'Try a different search or filter'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onClick={() => openEdit(asset)} />
          ))}
        </div>
      )}

      {/* Edit panel */}
      <AnimatePresence>
        {showPanel && editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.35)', zIndex: 40 }}
              onClick={() => setShowPanel(false)} />
            <motion.div className="glass-3"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, zIndex: 50, padding: 28, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#0F1117', margin: 0 }}>
                  Edit Asset
                </h2>
                <button onClick={() => setShowPanel(false)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Preview */}
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, background: editing.type === 'video' ? '#111827' : '#F7F7F7', aspectRatio: '16/9' }}>
                {editing.type === 'photo' && editing.file_url ? (
                  <img src={editing.file_url} alt={editing.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={40} style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {editing.file_url && (
                <a href={editing.file_url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
                  fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#FF5C00',
                  textDecoration: 'none', fontWeight: 500,
                }}>
                  <ExternalLink size={13} /> Open original
                </a>
              )}

              {panelError && (
                <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: '#FEE2E2', border: '1px solid rgba(220,38,38,0.2)', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#DC2626' }}>
                  {panelError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Name">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </Field>

                <Field label="Linked Campaign">
                  <select value={form.campaign_id} onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">No campaign</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Notes">
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Notes about this asset…" rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    onFocus={e => e.target.style.borderColor = '#FF5C00'}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowPanel(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem', fontWeight: 500, color: '#374151',
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                  background: saving ? '#FFAD8A' : '#FF5C00', cursor: saving ? 'default' : 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
                  color: '#fff', transition: 'background 150ms ease',
                }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              <button onClick={handleDelete} style={{
                width: '100%', marginTop: 10, padding: '9px', borderRadius: 10,
                border: '1px solid rgba(220,38,38,0.2)', background: '#FEE2E2',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem',
                fontWeight: 500, color: '#DC2626',
              }}>Delete Asset</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
