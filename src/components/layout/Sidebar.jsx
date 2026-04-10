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
      width: 220, flexShrink: 0, padding: '24px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
      borderRight: '1px solid rgba(0,0,0,0.06)',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700, fontSize: '1.25rem',
        letterSpacing: '-0.02em', color: '#0F1117',
        padding: '0 12px', marginBottom: 24,
      }}>
        Broadr
      </div>

      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
          fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500,
          color: isActive ? '#2563EB' : '#374151',
          background: isActive ? '#DBEAFE' : 'transparent',
          transition: 'all 150ms ease',
        })}>
          <Icon size={16} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
