import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { MODULES } from './config/modules'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModulePage from './pages/ModulePage'
import Prescriptions from './pages/Prescriptions'
import MyAppointments from './pages/MyAppointments'
import MyRecord from './pages/MyRecord'
import './step2.css'
import './step3.css'

// Blocks screens the signed-in role may not open.
function Guard({ screen, children }) {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (screen && !can(screen)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        {/* One route per module in config/modules.js */}
        {Object.keys(MODULES).map((key) => (
          <Route key={key} path={key} element={<Guard screen={key}><ModulePage moduleKey={key} /></Guard>} />
        ))}
        <Route path="rx" element={<Guard screen="rx"><Prescriptions /></Guard>} />
        {/* Patient portal */}
        <Route path="my" element={<Guard screen="my"><MyAppointments /></Guard>} />
        <Route path="myrecord" element={<Guard screen="myrecord"><MyRecord /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
