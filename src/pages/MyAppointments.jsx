import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { BOOKING } from '../config/portal'
import RecordForm from '../components/RecordForm'
import Modal from '../components/Modal'

// Patient portal: a patient sees, books and cancels only their own appointments.
export default function MyAppointments() {
  const { db, add, update } = useData()
  const { user } = useAuth()
  const [booking, setBooking] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [status, setStatus] = useState('')

  const tell = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 3000) }

  // The filter on user.patient is what keeps other patients' data out of view.
  const mine = db.appts.filter((a) => a.patient === user.patient).sort((a, b) => (a.when < b.when ? -1 : 1))
  const doctor = (id) => db.doctors.find((d) => d.id === id)

  const book = (values) => {
    add('appts', { ...values, patient: user.patient, status: 'Scheduled' }, 'Patient booked appointment')
    setBooking(false)
    tell('Your appointment is booked.')
  }

  const cancel = () => {
    update('appts', cancelling.id, { status: 'Cancelled' }, 'Patient cancelled appointment')
    setCancelling(null)
    tell('Your appointment was cancelled.')
  }

  return (
    <>
      <header>
        <h1>My appointments</h1>
        <button className="pri" onClick={() => setBooking(true)}>Book appointment</button>
      </header>

      {status && <p role="status" className="mu">{status}</p>}

      {mine.length ? (
        <div className="tw">
          <table>
            <thead>
              <tr><th>Date and time</th><th>Doctor</th><th>Reason</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {mine.map((a) => (
                <tr key={a.id}>
                  <td>{a.when.replace('T', ' ')}</td>
                  <td>{doctor(a.doctor)?.name ?? '—'}<div className="mu">{doctor(a.doctor)?.dept}</div></td>
                  <td>{a.reason}</td>
                  <td><span className={'b s-' + a.status.replace(/\W/g, '')}>{a.status}</span></td>
                  <td className="ac">
                    {a.status === 'Scheduled' && (
                      <button className="dg" onClick={() => setCancelling(a)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">You have no appointments yet. Use “Book appointment” to make one.</p>
      )}

      {booking && (
        <Modal title="Book appointment" onClose={() => setBooking(false)}>
          <RecordForm module={BOOKING} record={null} onSave={book} onCancel={() => setBooking(false)} />
        </Modal>
      )}

      {cancelling && (
        <Modal title="Cancel this appointment?" onClose={() => setCancelling(null)}>
          <div className="row">
            <button className="pri" onClick={cancel}>Yes, cancel it</button>
            <button onClick={() => setCancelling(null)}>Keep it</button>
          </div>
        </Modal>
      )}
    </>
  )
}
