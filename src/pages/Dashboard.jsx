import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { today } from '../utils'

// Readout strip. Later steps add: today's appointments, revenue, lab requests, pharmacy alerts.
export default function Dashboard() {
  const { db } = useData()
  const { can } = useAuth()

  const tiles = [
    { key: 'patients', label: 'Total patients', value: db.patients.length },
    { key: 'doctors', label: 'Doctors', value: db.doctors.length },
    { key: 'depts', label: 'Departments', value: db.depts.length },
  ].filter((t) => can(t.key))

  return (
    <>
      <header><h1>Dashboard</h1><span className="mu">{today()}</span></header>
      {tiles.length ? (
        <section className="mon">
          {tiles.map((t) => (
            <Link key={t.key} to={'/' + t.key}><span>{t.label}</span><b>{t.value}</b></Link>
          ))}
        </section>
      ) : (
        <p className="empty">Your role has no summary tiles yet.</p>
      )}
    </>
  )
}
