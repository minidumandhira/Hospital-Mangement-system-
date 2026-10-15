import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { MODULES } from './config/modules'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModulePage from './pages/ModulePage'

// Blocks screens the signed-in role may not open.
function Guard({ screen, children }) {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!can(screen)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard screen="dash"><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        {/* One route per module in config/modules.js */}
        {Object.keys(MODULES).map((key) => (
          <Route key={key} path={key} element={<Guard screen={key}><ModulePage moduleKey={key} /></Guard>} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
