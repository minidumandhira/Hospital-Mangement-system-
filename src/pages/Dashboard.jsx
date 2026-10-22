import { Link, Navigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { today } from '../utils'

// Readout strip and today's schedule.
// Later steps add: revenue, lab requests and pharmacy alerts.
export default function Dashboard() {
  const { db } = useData()
  const { user, can } = useAuth()

  if (user.role === 'patient') return <Navigate to="/my" replace /> // patients use the portal

  const todays = db.appts
    .filter((a) => a.when.slice(0, 10) === today() && a.status !== 'Cancelled')
    .sort((a, b) => (a.when < b.when ? -1 : 1))
  const nameOf = (list, id) => list.find((x) => x.id === id)?.name ?? '—'

  const tiles = [
    { key: 'patients', label: 'Total patients', value: db.patients.length },
    { key: 'appts', label: "Today's appointments", value: todays.length },
    { key: 'adm', label: 'Currently admitted', value: db.adm.filter((a) => !a.out).length },
    { key: 'doctors', label: 'Doctors', value: db.doctors.length },
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

      {can('appts') && (
        <>
          <h3>Today's appointments</h3>
          {todays.length ? (
            <ul>
              {todays.map((a) => (
                <li key={a.id}>
                  {a.when.slice(11)} — {nameOf(db.patients, a.patient)} with {nameOf(db.doctors, a.doctor)}{' '}
                  <span className={'b s-' + a.status.replace(/\W/g, '')}>{a.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mu">No appointments today.</p>
          )}
        </>
      )}
    </>
  )
}
