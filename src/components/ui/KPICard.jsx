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
    let rafId

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3)
      const v        = from + (target - from) * ease
      current.current = v
      if (ref.current) {
        ref.current.textContent = prefix + v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix
      }
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [value, prefix, suffix, decimals])

  return (
    <span ref={ref} style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: '2.75rem', fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      color: '#0F1117', letterSpacing: '-0.03em', lineHeight: 1,
    }}>
      {prefix}{typeof value === 'number' ? '0' : (value ?? '—')}{suffix}
    </span>
  )
}

export default function KPICard({ title, value, prefix, suffix, decimals, delta, icon: Icon, accentColor = '#FF5C00', loading, colSpan = 3 }) {
  return (
    <motion.div
      className="glass-1"
      style={{ gridColumn: `span ${colSpan}`, padding: '20px 24px', cursor: 'default', position: 'relative', overflow: 'hidden', borderTop: 'none' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: '#FF5C00', borderRadius: '12px 12px 0 0',
      }} />

      {/* Icon */}
      <div style={{ marginBottom: 14, marginTop: 4 }}>
        {Icon && <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />}
      </div>

      {/* Value */}
      <div style={{ marginBottom: 8 }}>
        {loading ? (
          <div className="shimmer" style={{ width: 100, height: 44 }} />
        ) : (
          <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        )}
      </div>

      {/* Delta */}
      {delta && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem',
          fontWeight: 400, color: '#9CA3AF', marginBottom: 4,
        }}>
          {delta}
        </div>
      )}

      {/* Label */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem',
        fontWeight: 500, color: '#9CA3AF', letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {title}
      </div>
    </motion.div>
  )
}
