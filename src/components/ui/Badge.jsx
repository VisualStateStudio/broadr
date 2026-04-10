const VARIANTS = {
  active:    { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
  paused:    { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  draft:     { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
  completed: { bg: '#DBEAFE', color: '#1E40AF', dot: '#2563EB' },
  meta:      { bg: '#DBEAFE', color: '#1E40AF', dot: '#2563EB' },
  google:    { bg: '#FEE2E2', color: '#991B1B', dot: '#DC2626' },
  both:      { bg: '#F3E8FF', color: '#6B21A8', dot: '#9333EA' },
}

export default function Badge({ label, variant }) {
  const v = VARIANTS[variant] || VARIANTS.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: v.bg, color: v.color,
      fontFamily: "'Inter', sans-serif", fontSize: '0.6875rem', fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}
