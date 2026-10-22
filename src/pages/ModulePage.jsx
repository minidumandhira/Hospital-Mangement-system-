import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { MODULES } from '../config/modules'
import DataTable, { cellText } from '../components/DataTable'
import RecordForm from '../components/RecordForm'
import WeekCalendar from '../components/WeekCalendar'
import Modal from '../components/Modal'

// One page that lists, searches, adds, edits and deletes any module in config/modules.js.
export default function ModulePage({ moduleKey }) {
  const module = MODULES[moduleKey]
  const Viewer = module.viewer
  const { db, add, update, remove } = useData()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, record = edit
  const [deleting, setDeleting] = useState(null)
  const [viewing, setViewing] = useState(null) // record shown in the module's viewer
  const [calendar, setCalendar] = useState(false)
  const [status, setStatus] = useState('')

  const tell = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 3000) }

  const all = db[moduleKey]
  const rows = all
    .filter((r) => {
      if (!query) return true
      const text = module.columns.map((c) => cellText(module, r, c, db)).join(' ')
      return text.toLowerCase().includes(query.toLowerCase())
    })
    .slice()
    .sort(module.sort || (() => 1)) // default: newest added first
  if (!module.sort) rows.reverse()

  const save = (values) => {
    if (editing.id) update(moduleKey, editing.id, values, 'Updated ' + module.noun)
    else add(moduleKey, values, 'Added ' + module.noun)
    setEditing(null)
    tell('Saved.')
  }

  const confirmDelete = () => {
    remove(moduleKey, deleting.id, 'Deleted ' + module.noun)
    setDeleting(null)
    tell('Deleted.')
  }

  // Extra row buttons come from the module config.
  const actions = (row) =>
    (module.rowActions?.(row, { update, db }) || []).map((a) => ({
      label: a.label,
      onClick: () => (a.view ? setViewing(row) : (a.run(row), tell('Done.'))),
    }))

  const showCalendar = module.calendar && calendar

  return (
    <>
      <header>
        <h1>{module.title}</h1>
        <div className="tools">
          {!showCalendar && (
            <input
              placeholder={'Search ' + module.title.toLowerCase()}
              aria-label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          {module.calendar && (
            <button onClick={() => setCalendar(!calendar)}>{calendar ? 'List view' : 'Calendar view'}</button>
          )}
          <button className="pri" onClick={() => setEditing({})}>Add {module.noun}</button>
        </div>
      </header>

      {status && <p role="status" className="mu">{status}</p>}

      {showCalendar ? (
        <WeekCalendar appts={all} onSelect={setEditing} />
      ) : rows.length ? (
        <DataTable
          module={module}
          rows={rows}
          actions={actions}
          onEdit={setEditing}
          onDelete={user.role === 'admin' ? setDeleting : undefined} // only administrators delete
        />
      ) : (
        <p className="empty">
          {query
            ? `No match for “${query}”.`
            : `No ${module.title.toLowerCase()} yet. Use “Add ${module.noun}” to create the first one.`}
        </p>
      )}

      {editing && (
        <Modal
          title={(editing.id ? module.editLabel || 'Edit' : 'Add') + ' ' + module.noun}
          onClose={() => setEditing(null)}
        >
          <RecordForm module={module} record={editing.id ? editing : null} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {viewing && Viewer && (
        <Modal title={viewing.name || module.title} onClose={() => setViewing(null)}>
          <Viewer record={viewing} />
          <div className="row" style={{ marginTop: 14 }}>
            <button onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete this record? This cannot be undone." onClose={() => setDeleting(null)}>
          <div className="row">
            <button className="pri" onClick={confirmDelete}>Confirm</button>
            <button onClick={() => setDeleting(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  )
}
