// One entry per data screen. DataTable and RecordForm read this config,
// so adding a simple module means adding one block here.
//
// field: { key, label, type?, options?, required?, money? }
// columns: which field keys show in the table.

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
]
