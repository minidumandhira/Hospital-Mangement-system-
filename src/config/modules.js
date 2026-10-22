// One entry per data screen. DataTable and RecordForm read this config,
// so adding a simple module means adding one block here.
//
// field: { key, label, type?, options?, required?, money?, default? }
//   type: 'text' (default) | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea'
//   options: a list, or a function (db) => list. Items are 'text' or [value, label].
//   default: starting value for new records (a value or a function).
//
// Optional module settings:
//   columns      field keys shown in the table
//   extra        computed columns: [{ key, label, value: (row) => text }]
//   validate     (values, existingRecord, db) => error message, or '' to allow the save
//   rowActions   (row, { update, db }) => [{ label, run?, view? }] extra buttons per row
//   viewer       a component opened by an action with view: true
//   sort         comparator for the rows (default: newest added first)
//   editLabel    wording for the Edit button, e.g. 'Reschedule'
//   calendar     true = show the List / Calendar toggle

import PatientHistory from '../components/PatientHistory'
import { today } from '../utils'

const patientOptions = (db) => [['', 'Select patient'], ...db.patients.map((p) => [p.id, p.name])]
const doctorOptions = (db) => [['', 'Select doctor'], ...db.doctors.map((d) => [d.id, d.name])]

export const MODULES = {
  patients: {
    title: 'Patients',
    noun: 'patient',
    fields: [
      { key: 'name', label: 'Full name', required: true },
      { key: 'dob', label: 'Date of birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Other'] },
      { key: 'phone', label: 'Phone' },
      {
        key: 'blood',
        label: 'Blood group',
        type: 'select',
        options: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      { key: 'address', label: 'Address' },
      { key: 'allergies', label: 'Allergies' },
    ],
    columns: ['name', 'gender', 'phone', 'blood'],
    viewer: PatientHistory,
    rowActions: () => [{ label: 'History', view: true }],
  },

  appts: {
    title: 'Appointments',
    noun: 'appointment',
    editLabel: 'Reschedule',
    calendar: true,
    fields: [
      { key: 'patient', label: 'Patient', type: 'select', options: patientOptions, required: true },
      { key: 'doctor', label: 'Doctor', type: 'select', options: doctorOptions, required: true },
      { key: 'when', label: 'Date and time', type: 'datetime-local', required: true },
      { key: 'reason', label: 'Reason' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['Scheduled', 'Checked-in', 'Completed', 'Cancelled'],
        default: 'Scheduled',
      },
    ],
    columns: ['when', 'patient', 'doctor', 'status'],
    sort: (a, b) => (a.when < b.when ? -1 : 1), // upcoming first
    // A doctor cannot have two active appointments at the same time.
    validate: (v, record, db) =>
      v.status !== 'Cancelled' &&
      db.appts.some((a) => a.id !== record?.id && a.doctor === v.doctor && a.when === v.when && a.status !== 'Cancelled')
        ? 'That doctor already has an appointment at this time.'
        : '',
    // Status tracking: Scheduled -> Checked-in -> Completed (or Cancelled at any open stage).
    rowActions: (r, { update }) => {
      const set = (status, label) => ({
        label,
        run: () => update('appts', r.id, { status }, 'Appointment ' + status.toLowerCase()),
      })
      if (r.status === 'Scheduled') return [set('Checked-in', 'Check in'), set('Cancelled', 'Cancel')]
      if (r.status === 'Checked-in') return [set('Completed', 'Complete'), set('Cancelled', 'Cancel')]
      return []
    },
  },

  records: {
    title: 'Medical records',
    noun: 'record',
    fields: [
      { key: 'patient', label: 'Patient', type: 'select', options: patientOptions, required: true },
      { key: 'doctor', label: 'Doctor', type: 'select', options: doctorOptions, required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: today },
      { key: 'diagnosis', label: 'Diagnosis', required: true },
      { key: 'treatment', label: 'Treatment', type: 'textarea' },
      { key: 'prescription', label: 'Prescription (medicine, dose, duration)', type: 'textarea' },
      { key: 'report', label: 'Medical report', type: 'textarea' },
    ],
    columns: ['date', 'patient', 'doctor', 'diagnosis'],
    sort: (a, b) => (a.date < b.date ? 1 : -1), // latest first
  },

  adm: {
    title: 'Admissions',
    noun: 'admission',
    fields: [
      { key: 'patient', label: 'Patient', type: 'select', options: patientOptions, required: true },
      { key: 'ward', label: 'Ward' },
      { key: 'bed', label: 'Bed' },
      { key: 'rate', label: 'Daily charge (Rs)', type: 'number', money: true },
      { key: 'ad', label: 'Admitted on', type: 'date', required: true, default: today },
      { key: 'out', label: 'Discharged on', type: 'date' },
    ],
    columns: ['patient', 'ward', 'bed', 'ad', 'status'],
    extra: [{ key: 'status', label: 'Status', value: (r) => (r.out ? 'Discharged' : 'Admitted') }],
    sort: (a, b) => (a.ad < b.ad ? 1 : -1),
    validate: (v) => (v.out && v.out < v.ad ? 'The discharge date is before the admission date.' : ''),
    rowActions: (r, { update }) =>
      r.out ? [] : [{ label: 'Discharge', run: () => update('adm', r.id, { out: today() }, 'Patient discharged') }],
  },

  doctors: {
    title: 'Doctors',
    noun: 'doctor',
    fields: [
      { key: 'name', label: 'Name', required: true },
      {
        key: 'dept',
        label: 'Department',
        type: 'select',
        options: (db) => db.depts.map((d) => d.name),
      },
      { key: 'phone', label: 'Phone' },
      { key: 'fee', label: 'Consultation fee (Rs)', type: 'number', money: true },
      { key: 'days', label: 'Working days' },
      { key: 'hours', label: 'Hours' },
    ],
    columns: ['name', 'dept', 'days', 'hours', 'fee'],
  },

  depts: {
    title: 'Departments',
    noun: 'department',
    fields: [{ key: 'name', label: 'Name', required: true }],
    columns: ['name'],
  },
}

// Sidebar entries are built from the modules, plus the dashboard.
export const NAV = [
  { key: 'dash', label: 'Dashboard', to: '/' },
  ...Object.entries(MODULES).map(([key, m]) => ({ key, label: m.title, to: '/' + key })),
  // Patient portal
  { key: 'my', label: 'My appointments', to: '/my' },
  { key: 'myrecord', label: 'My health record', to: '/myrecord' },
]
