import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import PatientHistory from '../components/PatientHistory'

// Patient portal: a patient's own medical history (read only).
export default function MyRecord() {
  const { db } = useData()
  const { user } = useAuth()
  const patient = db.patients.find((p) => p.id === user.patient)

  if (!patient) return <p className="empty">Your patient record could not be found. Please contact the reception desk.</p>

  return (
    <>
      <header><h1>My health record</h1></header>
      <h2>{patient.name}</h2>
      <PatientHistory record={patient} />
    </>
  )
}
