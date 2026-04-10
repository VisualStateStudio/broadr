import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import Campaigns  from './pages/Campaigns.jsx'
import Clients    from './pages/Clients.jsx'
import Creative   from './pages/Creative.jsx'
import Analytics  from './pages/Analytics.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            <Routes>
              <Route path="/"           element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/campaigns"  element={<Campaigns />} />
              <Route path="/clients"    element={<Clients />} />
              <Route path="/creative"   element={<Creative />} />
              <Route path="/analytics"  element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
