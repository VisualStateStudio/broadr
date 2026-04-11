import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext.jsx'
import SmoothScroll from './components/SmoothScroll.jsx'
import PageTransition from './components/PageTransition.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import Campaigns  from './pages/Campaigns.jsx'
import Clients    from './pages/Clients.jsx'
import Creative   from './pages/Creative.jsx'
import Analytics  from './pages/Analytics.jsx'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/campaigns"  element={<PageTransition><Campaigns /></PageTransition>} />
        <Route path="/clients"    element={<PageTransition><Clients /></PageTransition>} />
        <Route path="/creative"   element={<PageTransition><Creative /></PageTransition>} />
        <Route path="/analytics"  element={<PageTransition><Analytics /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SmoothScroll>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
              <AnimatedRoutes />
            </main>
          </div>
        </SmoothScroll>
      </BrowserRouter>
    </AuthProvider>
  )
}
