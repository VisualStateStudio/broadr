import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Megaphone, ImageIcon, BarChart2 } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Clients'   },
  { to: '/campaigns', icon: Megaphone,        label: 'Campaigns' },
  { to: '/creative',  icon: ImageIcon,        label: 'Creative'  },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: '#0A0A0A',
      minHeight: '100vh',
      position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FF5C00', flexShrink: 0 }} />
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: '1.125rem',
          letterSpacing: '-0.02em', color: '#FFFFFF',
        }}>
          Broadr
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
            fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
            background: isActive ? 'rgba(255,92,0,0.18)' : 'transparent',
            transition: 'all 150ms ease',
            position: 'relative',
          })}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 2px 2px 0',
                    background: '#FF5C00',
                  }} />
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
        fontFamily: "'Inter', sans-serif", fontSize: '0.6875rem',
        color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        Broadr v0.1
      </div>
    </aside>
  )
}
