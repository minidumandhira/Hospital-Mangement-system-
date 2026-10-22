import { useData } from '../context/DataContext'

// Medical history for one patient, gathered from appointments, records and admissions.
export default function PatientHistory({ record: patient }) {
  const { db } = useData()
  const doctor = (id) => db.doctors.find((d) => d.id === id)?.name ?? '—'

  const records = db.records.filter((r) => r.patient === patient.id).sort((a, b) => (a.date < b.date ? 1 : -1))
  const appts = db.appts.filter((a) => a.patient === patient.id).sort((a, b) => (a.when < b.when ? 1 : -1))
  const stays = db.adm.filter((a) => a.patient === patient.id)

  // A heading with a list, or "None recorded." when the list is empty.
  const section = (title, items) => (
    <>
      <h3>{title}</h3>
      {items.length ? <ul>{items}</ul> : <p className="mu">None recorded.</p>}
    </>
  )

  return (
    <>
      <p className="mu">
        {patient.gender} · born {patient.dob || 'unknown'} · blood group {patient.blood || 'unknown'} · allergies:{' '}
        {patient.allergies || 'none recorded'}
      </p>

      {section(
        'Diagnoses and treatment',
        records.map((r) => (
          <li key={r.id}>
            {r.date}: <b>{r.diagnosis}</b> ({doctor(r.doctor)})
            {r.treatment && <div className="mu">Treatment: {r.treatment}</div>}
            {r.prescription && <div className="mu">Prescription: {r.prescription}</div>}
            {r.report && <div className="mu">Report: {r.report}</div>}
          </li>
        )),
      )}
      {section(
        'Appointments',
        appts.map((a) => (
          <li key={a.id}>
            {a.when.replace('T', ' ')} with {doctor(a.doctor)} <span className={'b s-' + a.status.replace(/\W/g, '')}>{a.status}</span>
          </li>
        )),
      )}
      {section(
        'Hospital stays',
        stays.map((a) => (
          <li key={a.id}>
            {a.ad} to {a.out || 'present'}{a.ward && ` · ${a.ward}`}{a.bed && ` · bed ${a.bed}`}
          </li>
        )),
      )}
    </>
  )
}
