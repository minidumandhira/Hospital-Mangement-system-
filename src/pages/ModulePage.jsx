import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { MODULES } from '../config/modules'
import DataTable, { cellText } from '../components/DataTable'
import RecordForm from '../components/RecordForm'
import Modal from '../components/Modal'

// One page that lists, searches, adds, edits and deletes any module in config/modules.js.
export default function ModulePage({ moduleKey }) {
  const module = MODULES[moduleKey]
  const { db, add, update, remove } = useData()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, record = edit
  const [deleting, setDeleting] = useState(null)
  const [status, setStatus] = useState('')

  const tell = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 3000) }

  const rows = db[moduleKey]
    .filter((r) => {
      if (!query) return true
      const text = module.columns.map((c) => cellText(module, r, c, db)).join(' ')
      return text.toLowerCase().includes(query.toLowerCase())
    })
    .slice()
    .reverse() // newest first

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

  return (
    <>
      <header>
        <h1>{module.title}</h1>
        <div className="tools">
          <input
            placeholder={'Search ' + module.title.toLowerCase()}
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="pri" onClick={() => setEditing({})}>Add {module.noun}</button>
        </div>
      </header>

      {status && <p role="status" className="mu">{status}</p>}

      {rows.length ? (
        <DataTable
          module={module}
          rows={rows}
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
        <Modal title={(editing.id ? 'Edit ' : 'Add ') + module.noun} onClose={() => setEditing(null)}>
          <RecordForm module={module} record={editing.id ? editing : null} onSave={save} onCancel={() => setEditing(null)} />
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
