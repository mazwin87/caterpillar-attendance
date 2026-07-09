import { useState, useEffect } from 'react'
import { getBranches, supabase } from '../lib/supabase'
import { STATUS_CLASSES } from '../lib/constants'
import { cleanBranchName } from '../lib/branch'

const inputClass = "bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-[13px] text-ink outline-none w-full"

export default function Reports({ t }) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [branches, setBranches]     = useState([])
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [filterBranch, setFilterBranch]   = useState('')
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
      cleanBranchName(r.students?.branches?.name) || '',
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
                <td>${cleanBranchName(r.students?.branches?.name) || ''}</td>
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

  const grouped = records.reduce((acc, r) => {
    const date = r.date
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})

  return (
    <div className="min-h-full bg-page pb-20">

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-4 px-5">
       <div className="lg:max-w-5xl lg:mx-auto">
        <div className="text-[22px] font-medium text-ink mb-3.5">Reports</div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-2">
          <div className="grid grid-cols-2 lg:flex lg:flex-1 gap-2">
            <div className="lg:max-w-[180px]">
              <div className="text-[11px] text-muted mb-1">From</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div className="lg:max-w-[180px]">
              <div className="text-[11px] text-muted mb-1">To</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className={`lg:max-w-xs ${inputClass}`}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <button onClick={fetchRecords} disabled={loading}
            className="lg:flex-shrink-0 lg:px-8 bg-present text-white border-0 rounded-[10px] py-2.5 text-sm font-medium cursor-pointer disabled:opacity-60">
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
       </div>
      </div>

      {/* Results */}
      <div className="lg:max-w-5xl lg:mx-auto p-4">

        {searched && !loading && (
          <>
            {records.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button onClick={exportCSV}
                  className="flex-1 bg-surface border border-border rounded-[10px] py-2.5 text-[13px] text-ink cursor-pointer font-medium">
                  📥 Export CSV
                </button>
                <button onClick={exportPDF}
                  className="flex-1 bg-surface border border-border rounded-[10px] py-2.5 text-[13px] text-ink cursor-pointer font-medium">
                  🖨️ Export PDF
                </button>
              </div>
            )}

            {records.length === 0 && (
              <div className="text-center text-muted text-[13px] p-12">
                No records found for this period
              </div>
            )}
          </>
        )}

        {/* Records grouped by date */}
        {Object.entries(grouped).map(([date, dayRecords]) => (
          <div key={date} className="mb-3">
            <div className="text-[11px] text-muted tracking-wider uppercase py-2 font-medium">
              {new Date(date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="ml-2 text-hint font-normal">{dayRecords.length} records</span>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {dayRecords.map((r, i) => {
                const cls = STATUS_CLASSES[r.status]
                return (
                <div key={r.id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${i < dayRecords.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${cls.bg} ${cls.text}`}>
                    {r.students?.name?.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap">{r.students?.name}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {r.students?.student_no} · {cleanBranchName(r.students?.branches?.name)}
                      {r.students?.classes?.name ? ` · ${r.students.classes.name}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls.bg} ${cls.text}`}>
                      {r.status}
                    </span>
                    {r.absence_reason && (
                      <span className="text-[9px] text-absent capitalize">
                        {r.absence_reason.replace('_', ' ')}
                      </span>
                    )}
                    {r.scanned_at && (
                      <span className="text-[9px] text-muted">
                        {new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
