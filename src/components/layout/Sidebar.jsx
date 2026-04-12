import { useState, useRef, useCallback, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, Megaphone, ImageIcon, BarChart2, Menu, X } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Clients'   },
  { to: '/campaigns', icon: Megaphone,        label: 'Campaigns' },
  { to: '/creative',  icon: ImageIcon,        label: 'Creative'  },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
]

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function useLogoScramble() {
  const spanRef = useRef(null)
  const timeoutsRef = useRef([])

  const scramble = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !spanRef.current) return

    const el = spanRef.current
    const original = 'broadr'
    const chars = original.split('')

    // Clear any running timeouts
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    let frame = 0
    const totalFrames = 10
    const interval = setInterval(() => {
      frame++
      const resolved = Math.floor((frame / totalFrames) * chars.length)
      el.textContent = chars.map((c, i) =>
        i < resolved ? c : CHARS[Math.floor(Math.random() * CHARS.length)]
      ).join('')

      if (frame >= totalFrames) {
        clearInterval(interval)
        el.textContent = original
      }
    }, 40)

    timeoutsRef.current.push(setTimeout(() => clearInterval(interval), 500))
  }, [])

  return { spanRef, scramble }
}

function SidebarContent({ onNavClick }) {
  const { spanRef, scramble } = useLogoScramble()

  return (
    <>
      {/* Logo */}
      <div
        style={{ padding: '28px 20px 24px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}
        onMouseEnter={scramble}
      >
        <span style={{ color: '#FF5C00', fontSize: '0.5rem', lineHeight: 1 }}>&#9632;</span>
        <span
          ref={spanRef}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: '1.125rem',
            letterSpacing: '0.05em', color: '#FFFFFF',
            textTransform: 'uppercase',
          }}
        >
          broadr
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onNavClick} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
            fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
            background: isActive ? 'rgba(255,92,0,0.08)' : 'transparent',
            transition: 'all 150ms ease',
            position: 'relative',
          })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    initial={{ x: -4 }}
                    animate={{ x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 2, borderRadius: '0 2px 2px 0',
                      background: '#FF5C00',
                    }}
                  />
                )}
                <Icon
                  size={16}
                  strokeWidth={2}
                  style={{ color: isActive ? '#FF5C00' : 'rgba(255,255,255,0.45)', flexShrink: 0 }}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px 16px' }} />
      <div style={{
        padding: '0 20px 24px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem',
        color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        Broadr v0.1
      </div>
    </>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [mobileOpen])

  // Close on route change (resize past breakpoint)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = () => { if (mq.matches) setMobileOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <>
      {/* Desktop sidebar — hidden below 768px */}
      <aside style={{
        width: 220, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: '#0A0A0A',
        minHeight: '100vh',
        position: 'sticky', top: 0,
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger — visible below 768px */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-toggle"
        aria-label="Open navigation"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 60,
          width: 40, height: 40, borderRadius: 10,
          background: '#0A0A0A', border: 'none',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Menu size={18} style={{ color: '#FFFFFF' }} />
      </button>

      {/* Mobile drawer overlay + sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 70,
                background: 'rgba(0,0,0,0.4)',
              }}
            />
            <motion.aside
              data-lenis-prevent
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 220, zIndex: 80,
                display: 'flex', flexDirection: 'column',
                background: '#0A0A0A',
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                style={{
                  position: 'absolute', top: 16, right: -48,
                  width: 36, height: 36, borderRadius: 8,
                  background: '#0A0A0A', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <X size={16} style={{ color: '#FFFFFF' }} />
              </button>

              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Responsive styles injected once */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  )
}
