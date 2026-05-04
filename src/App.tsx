import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminAuthStore } from './store/adminAuthStore'
import { AdminLayout } from './components/layout/AdminLayout'
import { BankPartners } from './pages/admin/BankPartners'
import { Applications } from './pages/admin/Applications'
import { IntegrationMapper } from './pages/admin/integration-mapper/IntegrationMapper'
import { MapperLogin } from './pages/admin/integration-mapper/MapperLogin'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<MapperLogin />} />

      {/* ── Admin Console ──────────────────────────────────────────────── */}
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/admin/banks" replace />} />
        <Route path="banks" element={<BankPartners />} />
        <Route path="applications" element={<Applications />} />
        <Route path="integration-mapper" element={<IntegrationMapper />} />
      </Route>
    </Routes>
  )
}
