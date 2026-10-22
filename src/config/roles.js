// The seven user roles from the specification.
export const ROLES = [
  ['admin', 'Administrator'],
  ['doctor', 'Doctor'],
  ['nurse', 'Nurse'],
  ['reception', 'Receptionist'],
  ['lab', 'Laboratory staff'],
  ['pharm', 'Pharmacist'],
  ['acct', 'Accountant'],
  ['patient', 'Patient'],
]

// Which screens each role can open. 'all' means everything.
// Keys for screens that don't exist yet are fine: they are ignored until you add them.
export const ACCESS = {
  admin: 'all',
  doctor: ['dash', 'patients', 'appts', 'records', 'labs', 'reports'],
  nurse: ['dash', 'patients', 'appts', 'records', 'adm'],
  reception: ['dash', 'patients', 'appts', 'adm'],
  lab: ['dash', 'labs'],
  pharm: ['dash', 'meds', 'rx'],
  acct: ['dash', 'bills', 'reports'],
  patient: ['my', 'myrecord'], // patient portal screens
}

// Portal screens belong to patients only. Even the administrator does not get them.
export const PORTAL_SCREENS = ['my', 'myrecord']

export const roleName = (role) => ROLES.find(([v]) => v === role)?.[1] ?? role
