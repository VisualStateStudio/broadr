export const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #E5E7EB', background: '#FFFFFF',
  fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: '#0F1117',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms ease',
}

export const focusOrange = e => { e.target.style.borderColor = '#FF5C00' }
export const blurGrey    = e => { e.target.style.borderColor = '#E5E7EB' }

export function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
