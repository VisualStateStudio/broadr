import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

function CountUp({ value, prefix = '', suffix = '', decimals = 0 }) {
  const ref      = useRef(null)
  const current  = useRef(0)

  useEffect(() => {
    if (typeof value !== 'number') return
    const target   = value
    const duration = 800
    const start    = performance.now()
    const from     = current.current

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3)
      const v        = from + (target - from) * ease
      current.current = v
      if (ref.current) {
        ref.current.textContent = prefix + v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix
      }
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, prefix, suffix, decimals])

  return (
    <span ref={ref} style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: '2rem', fontWeight: 700,
      color: '#0F1117', letterSpacing: '-0.02em', lineHeight: 1,
    }}>
      {prefix}{typeof value === 'number' ? '0' : (value ?? '—')}{suffix}
    </span>
  )
}

export default function KPICard({ title, value, prefix, suffix, decimals, icon: Icon, accentColor = '#2563EB', loading, colSpan = 3 }) {
  return (
    <motion.div
      className="glass-1"
      style={{ gridColumn: `span ${colSpan}`, padding: 24, cursor: 'default', position: 'relative', overflow: 'hidden' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, boxShadow: '0 1px 0 0 rgba(255,255,255,0.9) inset, 0 -1px 0 0 rgba(0,0,0,0.04) inset, 0 4px 6px -1px rgba(0,0,0,0.07), 0 12px 28px -4px rgba(0,0,0,0.11), 0 40px 80px -8px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${accentColor}14`,
        border: `1px solid ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        {Icon && <Icon size={16} style={{ color: accentColor }} strokeWidth={2} />}
      </div>

      {/* Value */}
      <div style={{ marginBottom: 6 }}>
        {loading ? (
          <div className="shimmer" style={{ width: 90, height: 32 }} />
        ) : (
          <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        )}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem',
        fontWeight: 500, color: '#6B7280', letterSpacing: '0.01em',
      }}>
        {title}
      </div>

      {/* Accent bottom line */}
      <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, background: accentColor, borderRadius: '4px 4px 0 0', opacity: 0.5 }} />
    </motion.div>
  )
}
