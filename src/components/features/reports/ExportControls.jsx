import { downloadCSV } from '../../../lib/utils/csv'
import { openPrintWindow } from '../../../lib/utils/print'
import { shortBranchName } from '../../../lib/constants/branches'
import { Button } from '../../ui'

function buildPDFHtml(records, branchName, startDate, endDate) {
  return `
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
          <tr><th>Date</th><th>Name</th><th>ID</th><th>Branch</th><th>Class</th><th>Status</th><th>Reason</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${r.students?.name || ''}</td>
              <td>${r.students?.student_no || ''}</td>
              <td>${shortBranchName(r.students?.branches?.name)}</td>
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
}

export default function ExportControls({ records, branches, filterBranch, startDate, endDate }) {
  if (records.length === 0) return null

  function handleCSV() {
    const headers = ['Date', 'Name', 'Student No', 'Branch', 'Class', 'Status', 'Absence Reason', 'Scan Time']
    const rows = records.map(r => [
      r.date,
      r.students?.name || '',
      r.students?.student_no || '',
      shortBranchName(r.students?.branches?.name),
      r.students?.classes?.name || '',
      r.status,
      r.absence_reason?.replace('_', ' ') || '',
      r.scanned_at ? new Date(r.scanned_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : '',
    ])
    downloadCSV(headers, rows, `attendance_${startDate}_${endDate}.csv`)
  }

  function handlePDF() {
    const branchName = filterBranch
      ? branches.find(b => b.id === filterBranch)?.name || 'All Branches'
      : 'All Branches'
    openPrintWindow(buildPDFHtml(records, branchName, startDate, endDate))
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <Button variant="secondary" onClick={handleCSV} style={{ flex: 1, padding: '10px', fontSize: 13 }}>
        📥 Export CSV
      </Button>
      <Button variant="secondary" onClick={handlePDF} style={{ flex: 1, padding: '10px', fontSize: 13 }}>
        🖨️ Export PDF
      </Button>
    </div>
  )
}
