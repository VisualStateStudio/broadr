export const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #E5E5E5', background: '#FFFFFF',
  fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#0F1117',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
}

export const focusOrange = e => {
  e.target.style.borderColor = '#FF5C00'
  e.target.style.boxShadow = '0 0 0 3px rgba(255,92,0,0.12)'
}
export const blurGrey = e => {
  e.target.style.borderColor = '#E5E5E5'
  e.target.style.boxShadow = 'none'
}

export function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#6B7280',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}
