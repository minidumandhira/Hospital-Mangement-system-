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
//   viewer       a component opened by an action with view: true (title from viewerTitle(row))
//   form actions { label, form: { fields }, run(values) } open a small form first
//   sort         comparator for the rows (default: newest added first)
//   editLabel    wording for the Edit button, e.g. 'Reschedule'
//   calendar     true = show the List / Calendar toggle

import PatientHistory from '../components/PatientHistory'
import { today, stockAlerts } from '../utils'
import LabReport from '../components/LabReport'

const patientOptions = (db) => [['', 'Select patient'], ...db.patients.map((p) => [p.id, p.name])]
const medOptions = (db) => [['', 'None'], ...db.meds.map((m) => [m.id, m.name])]
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
      { key: 'med', label: 'Prescribed medicine (from stock)', type: 'select', options: medOptions },
      { key: 'qty', label: 'Quantity', type: 'number' },
      { key: 'dosage', label: 'Dosage instructions' },
      { key: 'prescription', label: 'Prescription notes', type: 'textarea' },
      { key: 'report', label: 'Medical report', type: 'textarea' },
    ],
    columns: ['date', 'patient', 'doctor', 'diagnosis'],
    sort: (a, b) => (a.date < b.date ? 1 : -1), // latest first
    validate: (v, record) => {
      if (v.med && !(v.qty > 0)) return 'Enter a quantity for the prescribed medicine.'
      // Once the pharmacy has dispensed it, the medicine and quantity are fixed.
      if (record?.disp && (v.med !== record.med || v.qty !== record.qty))
        return 'This prescription was already dispensed, so the medicine and quantity cannot change.'
      return ''
    },
  },

  labs: {
    title: 'Laboratory',
    noun: 'test request',
    fields: [
      { key: 'patient', label: 'Patient', type: 'select', options: patientOptions, required: true },
      { key: 'doctor', label: 'Requested by', type: 'select', options: doctorOptions },
      { key: 'test', label: 'Test', required: true },
      { key: 'price', label: 'Charge (Rs)', type: 'number', money: true },
      { key: 'date', label: 'Requested on', type: 'date', default: today },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['Requested', 'Sample collected', 'Completed'],
        default: 'Requested',
      },
      { key: 'result', label: 'Result', type: 'textarea' },
    ],
    columns: ['date', 'patient', 'test', 'status'],
    sort: (a, b) => (a.date < b.date ? 1 : -1),
    validate: (v) => (v.status === 'Completed' && !v.result ? 'Enter the result before marking the test Completed.' : ''),
    viewer: LabReport,
    viewerTitle: () => 'Laboratory report',
    // Workflow: Requested -> Sample collected -> Completed (result entered) -> printable report.
    rowActions: (r, { update }) => {
      if (r.status === 'Requested')
        return [{ label: 'Collect sample', run: () => update('labs', r.id, { status: 'Sample collected' }, 'Lab sample collected') }]
      if (r.status === 'Sample collected')
        return [{
          label: 'Enter result',
          form: { fields: [{ key: 'result', label: 'Result', type: 'textarea', required: true }] },
          run: (v) => update('labs', r.id, { status: 'Completed', result: v.result }, 'Lab result entered'),
        }]
      return [{ label: 'Report', view: true }]
    },
  },

  meds: {
    title: 'Pharmacy stock',
    noun: 'medicine',
    fields: [
      { key: 'name', label: 'Medicine', required: true },
      { key: 'batch', label: 'Batch' },
      { key: 'stock', label: 'Stock', type: 'number', required: true },
      { key: 'reorder', label: 'Reorder level', type: 'number' },
      { key: 'price', label: 'Unit price (Rs)', type: 'number', money: true },
      { key: 'expiry', label: 'Expiry date', type: 'date' },
    ],
    columns: ['name', 'batch', 'stock', 'price', 'expiry', 'alerts'],
    extra: [{ key: 'alerts', label: 'Alerts', value: (m) => stockAlerts(m).join(', ') }],
    sort: (a, b) => (a.name < b.name ? -1 : 1),
    rowActions: (m, { update }) => [{
      label: 'Restock',
      form: {
        fields: [
          { key: 'qty', label: 'Quantity received', type: 'number', required: true },
          { key: 'expiry', label: 'New expiry date (optional)', type: 'date' },
        ],
      },
      run: (v) => update('meds', m.id,
        { stock: Number(m.stock) + v.qty, ...(v.expiry ? { expiry: v.expiry } : {}) },
        'Restocked ' + m.name),
    }],
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
  ...Object.entries(MODULES).flatMap(([key, m]) => {
    const item = { key, label: m.title, to: '/' + key }
    // The prescription queue is a custom page that sits right after Pharmacy stock.
    return key === 'meds' ? [item, { key: 'rx', label: 'Prescriptions', to: '/rx' }] : [item]
  }),
  // Patient portal
  { key: 'my', label: 'My appointments', to: '/my' },
  { key: 'myrecord', label: 'My health record', to: '/myrecord' },
]
