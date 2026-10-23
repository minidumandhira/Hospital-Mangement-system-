import { Link, Navigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { today, stockAlerts } from '../utils'
import { paidOf, balanceOf, rs } from '../config/billing'

// Readout strip and today's schedule.
export default function Dashboard() {
  const { db } = useData()
  const { user, can } = useAuth()

  if (user.role === 'patient') return <Navigate to="/my" replace /> // patients use the portal

  const todays = db.appts
    .filter((a) => a.when.slice(0, 10) === today() && a.status !== 'Cancelled')
    .sort((a, b) => (a.when < b.when ? -1 : 1))
  const alerts = db.meds.flatMap((m) => stockAlerts(m).map((a) => `${m.name} — ${a}`))
  const nameOf = (list, id) => list.find((x) => x.id === id)?.name ?? '—'

  const tiles = [
    { key: 'patients', label: 'Total patients', value: db.patients.length },
    { key: 'appts', label: "Today's appointments", value: todays.length },
    { key: 'adm', label: 'Currently admitted', value: db.adm.filter((a) => !a.out).length },
    { key: 'labs', label: 'Open lab requests', value: db.labs.filter((l) => l.status !== 'Completed').length },
    { key: 'meds', label: 'Pharmacy alerts', value: alerts.length },
    { key: 'bills', label: 'Revenue collected', value: rs(db.bills.reduce((sum, b) => sum + paidOf(b), 0)) },
    { key: 'bills', label: 'Outstanding', value: rs(db.bills.reduce((sum, b) => sum + balanceOf(b), 0)) },
    { key: 'doctors', label: 'Doctors', value: db.doctors.length },
  ].filter((t) => can(t.key))

  return (
    <>
      <header><h1>Dashboard</h1><span className="mu">{today()}</span></header>
      {tiles.length ? (
        <section className="mon">
          {tiles.map((t) => (
            <Link key={t.label} to={'/' + t.key}><span>{t.label}</span><b>{t.value}</b></Link>
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

      {can('meds') && (
        <>
          <h3>Pharmacy alerts</h3>
          {alerts.length ? (
            <ul>{alerts.map((a) => <li key={a}>{a}</li>)}</ul>
          ) : (
            <p className="mu">Stock levels and expiry dates are fine.</p>
          )}
        </>
      )}
    </>
  )
}