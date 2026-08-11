import { useState } from 'react'
import { MdArrowUpward, MdArrowDownward, MdUnfoldMore } from 'react-icons/md'

export default function Table({ columns, rows, emptyMessage = 'No data.' }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const va = a[sortKey] ?? ''
        const vb = b[sortKey] ?? ''
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : rows

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontWeight: 500, color: 'var(--muted)',
                  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: col.sortable ? 'pointer' : 'default',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.label}
                  {col.sortable && (
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? <MdArrowUpward size={13} />
                        : <MdArrowDownward size={13} />
                      : <MdUnfoldMore size={13} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : sorted.map((row, i) => (
            <tr
              key={row.id ?? i}
              style={{ borderBottom: '0.5px solid var(--border)' }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '14px 16px', color: 'var(--text)', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
