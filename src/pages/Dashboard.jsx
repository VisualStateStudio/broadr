export default function Dashboard() {
  return (
    <div className="bento-grid">
      <div className="glass-1" style={{ gridColumn: 'span 12', padding: 24 }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#0F1117', margin: 0 }}>
          Welcome to Broadr
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#6B7280', marginTop: 8, marginBottom: 0 }}>
          Your marketing operations platform is ready. Clients, campaigns, and analytics coming next.
        </p>
      </div>
    </div>
  )
}
