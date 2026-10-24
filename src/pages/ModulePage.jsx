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
  const [acting, setActing] = useState(null) // { action, row } while an action's small form is open
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

  const save = async (values) => {
    // Optional last step before saving, e.g. turning a typed password into a hash.
    const final = module.beforeSave ? await module.beforeSave(values, editing) : values
    if (editing.id) update(moduleKey, editing.id, final, 'Updated ' + module.noun)
    else add(moduleKey, final, 'Added ' + module.noun)
    setEditing(null)
    tell('Saved.')
  }

  // A module can refuse a delete by returning a reason (for example, deleting your own account).
  const askDelete = (row) => {
    const reason = module.blockDelete?.(row, user)
    if (reason) tell(reason)
    else setDeleting(row)
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
      onClick: () => {
        if (a.view) setViewing(row)
        else if (a.form) setActing({ action: a, row })
        else { a.run(); tell('Done.') }
      },
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
          onDelete={user.role === 'admin' ? askDelete : undefined} // only administrators delete
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
        <Modal title={module.viewerTitle?.(viewing) ?? viewing.name ?? module.title} onClose={() => setViewing(null)}>
          <Viewer record={viewing} />
          <div className="row np" style={{ marginTop: 14 }}>
            <button onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {acting && (
        <Modal title={acting.action.label} onClose={() => setActing(null)}>
          <RecordForm
            module={acting.action.form}
            record={null}
            onSave={(values) => { acting.action.run(values); setActing(null); tell('Done.') }}
            onCancel={() => setActing(null)}
          />
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