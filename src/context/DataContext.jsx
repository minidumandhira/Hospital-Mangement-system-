import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { newId, now, hash, localDate } from '../utils'

const STORE_KEY = 'hms-react-v1'
const DataContext = createContext(null)

// Collections that later steps will fill. Keeping them here avoids migrations.
const EMPTY = {
  users: [], depts: [], patients: [], doctors: [], appts: [], records: [],
  labs: [], meds: [], adm: [], bills: [], staff: [], att: [], leaves: [], audit: [],
}

// Starting stock. Amoxicillin is low and close to expiry, so the alerts have something to show.
const inDays = (n) => localDate(new Date(Date.now() + n * 864e5))
const sampleMeds = () => [
  { id: newId(), name: 'Paracetamol 500 mg', batch: 'PC-2291', stock: 400, reorder: 100, price: 5, expiry: inDays(400) },
  { id: newId(), name: 'Amoxicillin 250 mg', batch: 'AM-1180', stock: 40, reorder: 60, price: 22, expiry: inDays(30) },
  { id: newId(), name: 'Atorvastatin 20 mg', batch: 'AT-7710', stock: 150, reorder: 50, price: 35, expiry: inDays(300) },
]

// A demo patient login (patient / patient123) linked to a patient record.
async function demoPatientUser(patient) {
  return { id: newId(), username: 'patient', name: patient.name, role: 'patient', patient: patient.id, pw: await hash('patient123') }
}

async function seed() {
  const users = []
  const accounts = [
    ['admin', 'Administrator', 'admin'],
    ['doctor', 'Dr. Amara Perera', 'doctor'],
    ['nurse', 'Nurse Kumari', 'nurse'],
    ['reception', 'Reception Desk', 'reception'],
    ['lab', 'Lab Technician', 'lab'],
    ['pharmacy', 'Pharmacist', 'pharm'],
    ['accounts', 'Accountant', 'acct'],
  ]
  for (const [username, name, role] of accounts) {
    users.push({ id: newId(), username, name, role, pw: await hash(username + '123') })
  }
  const patients = [
    { id: newId(), name: 'Nimali Fernando', dob: '1988-04-12', gender: 'Female', phone: '0771234567', blood: 'O+', address: 'Matara', allergies: 'Penicillin' },
    { id: newId(), name: 'Kasun Silva', dob: '1975-09-30', gender: 'Male', phone: '0712345678', blood: 'A+', address: 'Galle', allergies: '' },
  ]
  users.push(await demoPatientUser(patients[0]))
  return {
    ...EMPTY,
    users,
    depts: ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Gynecology', 'Laboratory', 'Pharmacy', 'Nursing', 'Administration']
      .map((name) => ({ id: newId(), name })),
    patients,
    meds: sampleMeds(),
    medsSeeded: true,
    doctors: [
      { id: newId(), name: 'Dr. Amara Perera', dept: 'General Medicine', phone: '0112223344', fee: 2500, days: 'Mon–Fri', hours: '09:00–13:00' },
      { id: newId(), name: 'Dr. Ruwan Jayasuriya', dept: 'Cardiology', phone: '0112223355', fee: 4000, days: 'Tue, Thu', hours: '14:00–18:00' },
    ],
  }
}

async function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY))
    if (saved && saved.users) {
      const data = { ...EMPTY, ...saved }
      // Older saved data has no patient login yet: add the demo one.
      if (!data.users.some((u) => u.role === 'patient') && data.patients[0]) {
        data.users = [...data.users, await demoPatientUser(data.patients[0])]
      }
      // Older saved data has no medicines yet: add the starting stock once.
      if (!data.medsSeeded) {
        data.medsSeeded = true
        if (!data.meds.length) data.meds = sampleMeds()
      }
      return data
    }
  } catch { /* fall through to seed */ }
  return seed()
}

export function DataProvider({ children }) {
  const [db, setDb] = useState(null)
  const actorRef = useRef('-') // username of whoever is signed in, for the audit log

  useEffect(() => { load().then(setDb) }, [])

  // Save to the browser on every change.
  // Later: replace this effect with API calls to your backend.
  useEffect(() => {
    if (!db) return
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)) } catch { /* storage full */ }
  }, [db])

  const withAudit = (d, text) => ({
    ...d,
    audit: [{ t: now(), u: actorRef.current, a: text }, ...d.audit].slice(0, 300),
  })

  const audit = useCallback((text) => setDb((d) => withAudit(d, text)), [])

  const add = useCallback((coll, rec, text) => {
    setDb((d) => withAudit({ ...d, [coll]: [...d[coll], { id: newId(), ...rec }] }, text || 'Added to ' + coll))
  }, [])

  const update = useCallback((coll, id, patch, text) => {
    setDb((d) => withAudit({ ...d, [coll]: d[coll].map((r) => (r.id === id ? { ...r, ...patch } : r)) }, text || 'Updated ' + coll))
  }, [])

  const remove = useCallback((coll, id, text) => {
    setDb((d) => withAudit({ ...d, [coll]: d[coll].filter((r) => r.id !== id) }, text || 'Deleted from ' + coll))
  }, [])

  if (!db) return <p style={{ padding: 24 }}>Loading…</p>

  return (
    <DataContext.Provider value={{ db, add, update, remove, audit, actorRef }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
