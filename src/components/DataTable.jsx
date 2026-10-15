import { useData } from '../context/DataContext'
import { labelOf } from '../utils'

// Text shown in one table cell.
export function cellText(module, row, key, db) {
  const f = module.fields.find((x) => x.key === key)
  const v = row[key]
  if (!f) return v ?? ''
  if (f.type === 'select') return labelOf(f, v, db)
  if (f.money && v !== '' && v != null) return 'Rs ' + Number(v).toLocaleString()
  return v ?? ''
}

// Generic table. `actions(row)` can return extra buttons for a row (used by later steps).
export default function DataTable({ module, rows, onEdit, onDelete, actions }) {
  const { db } = useData()
  const head = (key) => module.fields.find((f) => f.key === key)?.label ?? key

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            {module.columns.map((c) => <th key={c}>{head(c)}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {module.columns.map((c) => <td key={c}>{cellText(module, row, c, db)}</td>)}
              <td className="ac">
                {actions && actions(row)}
                <button onClick={() => onEdit(row)}>Edit</button>
                {onDelete && <button className="dg" onClick={() => onDelete(row)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
