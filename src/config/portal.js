import { now } from '../utils'

// The form patients use to book their own appointment.
// It has the same shape as a module in modules.js, so RecordForm can show it.
export const BOOKING = {
  noun: 'appointment',
  fields: [
    {
      key: 'doctor',
      label: 'Doctor',
      type: 'select',
      required: true,
      options: (db) => [['', 'Select doctor'], ...db.doctors.map((d) => [d.id, `${d.name} · ${d.dept}`])],
    },
    { key: 'when', label: 'Date and time', type: 'datetime-local', required: true },
    { key: 'reason', label: 'Reason for visit' },
  ],
  validate: (v, _record, db) => {
    if (v.when.replace('T', ' ') < now()) return 'Choose a time in the future.'
    const taken = db.appts.some((a) => a.doctor === v.doctor && a.when === v.when && a.status !== 'Cancelled')
    // Do not reveal who holds the slot.
    return taken ? 'That time is not available. Please choose another time.' : ''
  },
}
