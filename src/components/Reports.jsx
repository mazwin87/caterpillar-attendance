import { useState } from 'react'
import { getBranches, supabase } from '../lib/supabase'
import { useEffect } from 'react'

const STATUS_COLORS = {
  PRESENT: 'var(--present)',
  LATE:    'var(--late)',
  ABSENT:  'var(--absent)',
  HOLIDAY: 'var(--holiday)',
}

const STATUS_BG = {
  PRESENT: 'var(--present-bg)',
  LATE:    'var(--late-bg)',
  ABSENT:  'var(--absent-bg)',
  HOLIDAY: 'var(--holiday-bg)',
}

export default function Reports({ t }) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [branches, setBranches]     = useState([])
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [filterBranch, setFilter]   = useState('')
  const [startDate, setStartDate]   = useState(weekAgo)
  const [endDate, setEndDate]       = useState(today)
  const [searched, setSearched]     = useState(false)

  useEffect(() => {
    getBranches().then(setBranches)
  }, [])

  async function fetchRecords() {
    setLoading(true)
    setSearched(true)
    let query = supabase
      .from('attendance')
      .select('*, absence_reason, students(name, student_no, branches(name), classes(name))')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('status', { ascending: true })

    if (filterBranch) {
      query = query.eq('branch_id', filterBranch)
    }

    const { data, error } = await query
    if (error) { alert(error.message); setLoading(false); return }
    setRecords(data || [])
    setLoading(false)
  }

  function exportCSV() {
    const headers = ['Date', 'Name', 'Student No', 'Branch', 'Class', 'Status', 'Absence Reason', 'Scan Time']
    const rows = records.map(r => [
      r.date,
      r.students?.name || '',
      r.students?.student_no || '',
      r.students?.branches?.name?.replace('Caterpillar_', '') || '',
      r.students?.classes?.name || '',
      r.status,
      r.absence_reason?.replace('_', ' ') || '',
      r.scanned_at ? new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : '',
    ])

    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `attendance_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const branchName = filterBranch
      ? branches.find(b => b.id === filterBranch)?.name || 'All Branches'
      : 'All Branches'

    const html = `
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .sub { color: #888; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f0f0f0; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 11px; }
          td { padding: 7px 8px; border: 1px solid #eee; font-size: 11px; }
          tr:nth-child(even) { background: #fafafa; }
          .PRESENT { color: #2d7a4f; font-weight: bold; }
          .LATE    { color: #9a6b1a; font-weight: bold; }
          .ABSENT  { color: #b03030; font-weight: bold; }
          .HOLIDAY { color: #4a6fa5; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Caterpillar Attendance Report</h1>
        <div class="sub">${branchName} &nbsp;·&nbsp; ${startDate} to ${endDate} &nbsp;·&nbsp; ${records.length} records</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>ID</th>
              <th>Branch</th>
              <th>Class</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.students?.name || ''}</td>
                <td>${r.students?.student_no || ''}</td>
                <td>${r.students?.branches?.name?.replace('Caterpillar_', '') || ''}</td>
                <td>${r.students?.classes?.name || ''}</td>
                <td class="${r.status}">${r.status}</td>
                <td>${r.absence_reason?.replace('_', ' ') || ''}</td>
                <td>${r.scanned_at ? new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  // Group records by date for display
  const grouped = records.reduce((acc, r) => {
    const date = r.date
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})

  const inp = {
    style: {
      background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
      color: 'var(--text)', outline: 'none',
    }
  }
  
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Reports</div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>From</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} {...inp} style={{ ...inp.style, width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>To</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} {...inp} style={{ ...inp.style, width: '100%' }} />
            </div>
          </div>

          <select value={filterBranch} onChange={e => setFilter(e.target.value)} {...inp} style={{ ...inp.style, width: '100%' }}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <button onClick={fetchRecords} disabled={loading}
            style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '12px 16px' }}>

        {/* Summary + Export */}
        {searched && !loading && (
          <>
            {/* Export buttons */}
            {records.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={exportCSV}
                  style={{ flex: 1, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
                  📥 Export CSV
                </button>
                <button onClick={exportPDF}
                  style={{ flex: 1, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
                  🖨️ Export PDF
                </button>
              </div>
            )}

            {/* No results */}
            {records.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>
                No records found for this period
              </div>
            )}
          </>
        )}

        {/* Records grouped by date */}
        {Object.entries(grouped).map(([date, dayRecords]) => (
          <div key={date} style={{ marginBottom: 12 }}>
            {/* Date header */}
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '8px 0 6px', fontWeight: 500 }}>
              {new Date(date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span style={{ marginLeft: 8, color: 'var(--hint)', fontWeight: 400 }}>{dayRecords.length} records</span>
            </div>

            {/* Records for that date */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {dayRecords.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  borderBottom: i < dayRecords.length - 1 ? '0.5px solid var(--border)' : 'none'
                }}>
                  {/* Avatar */}
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: STATUS_BG[r.status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: STATUS_COLORS[r.status], flexShrink: 0 }}>
                    {r.students?.name?.charAt(0)}
                  </div>

                  {/* Name + branch */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.students?.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                      {r.students?.student_no} · {r.students?.branches?.name?.replace('Caterpillar_', '')}
                      {r.students?.classes?.name ? ` · ${r.students.classes.name}` : ''}
                    </div>
                  </div>

                  {/* Status + reason + time */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: STATUS_BG[r.status], color: STATUS_COLORS[r.status], fontWeight: 500 }}>
                      {r.status}
                    </span>
                    {r.absence_reason && (
                      <span style={{ fontSize: 9, color: 'var(--absent)', textTransform: 'capitalize' }}>
                        {r.absence_reason.replace('_', ' ')}
                      </span>
                    )}
                    {r.scanned_at && (
                      <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                        {new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}