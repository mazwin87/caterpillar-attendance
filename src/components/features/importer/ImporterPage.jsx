import { useState } from 'react'
import { importStudentsCSV } from '../../../lib/services/importer.service'
import { BRANCH_SLUGS } from '../../../lib/constants/branches'
import { AGE_GROUPS } from '../../../lib/constants/ageGroups'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'

export default function ImporterPage({ session }) {
  const [importData, setImportData]     = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting]       = useState(false)
  const [importDone, setImportDone]     = useState(null)

  function downloadTemplate() {
    const headers  = 'name,student_no,branch_slug,age_group,date_of_birth,monthly_fee,parent_name,parent_phone,parent_email,fee_month,fee_year,fee_amount,fee_payment_method,fee_paid_date'
    const example1 = 'Muhammad Aqil bin Hafiz,MXIM-010,MXIM,3year,2021-03-15,650,Hafiz bin Ahmad,0123456789,hafiz@email.com,April,2026,650,Cash,2026-04-01'
    const example2 = 'Nur Sofia binti Razak,MXIM-011,MXIM,2year,2022-07-20,650,Razak bin Ali,0187654321,razak@email.com,,,,'
    const example3 = 'Ahmad Luqman bin Ismail,KLTS-010,KLTS,1year,2023-01-10,600,Ismail bin Daud,0112223333,,,,,,'
    const csv = [headers, example1, example2, example3].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'students_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCSVFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.trim().split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj = {}
        headers.forEach((h, i) => { obj[h] = values[i] || '' })
        return obj
      }).filter(r => r.name?.trim())

      const errors = []
      rows.forEach((r, i) => {
        const rowNum = i + 2
        if (!r.name?.trim())          errors.push(`Row ${rowNum}: name is required`)
        if (!r.student_no?.trim())    errors.push(`Row ${rowNum}: student_no is required`)
        if (!r.branch_slug?.trim())   errors.push(`Row ${rowNum}: branch_slug is required`)
        if (!r.date_of_birth?.trim()) errors.push(`Row ${rowNum}: date_of_birth is required`)
        if (!r.monthly_fee?.trim())   errors.push(`Row ${rowNum}: monthly_fee is required`)
        if (!r.parent_name?.trim())   errors.push(`Row ${rowNum}: parent_name is required`)
        if (!r.parent_phone?.trim())  errors.push(`Row ${rowNum}: parent_phone is required`)

        if (r.branch_slug && !BRANCH_SLUGS.includes(r.branch_slug.trim().toUpperCase())) {
          errors.push(`Row ${rowNum}: branch_slug "${r.branch_slug}" is invalid — must be KLTS, SNTL, WGMJ or MXIM`)
        }
        if (!r.age_group?.trim()) errors.push(`Row ${rowNum}: age_group is required`)
        if (r.age_group && !AGE_GROUPS.includes(r.age_group.trim())) {
          errors.push(`Row ${rowNum}: age_group "${r.age_group}" is invalid — must be one of: ${AGE_GROUPS.join(', ')}`)
        }
        if (r.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(r.date_of_birth.trim())) {
          errors.push(`Row ${rowNum}: date_of_birth must be YYYY-MM-DD format`)
        }
        if (r.fee_month && !MONTHS.includes(r.fee_month.trim())) {
          errors.push(`Row ${rowNum}: fee_month "${r.fee_month}" is invalid — use full month name e.g. April`)
        }
        if (r.fee_payment_method && !PAYMENT_METHODS.includes(r.fee_payment_method.trim())) {
          errors.push(`Row ${rowNum}: fee_payment_method must be Cash, Bank Transfer or Cheque`)
        }
        if (r.fee_paid_date && !/^\d{4}-\d{2}-\d{2}$/.test(r.fee_paid_date.trim())) {
          errors.push(`Row ${rowNum}: fee_paid_date must be YYYY-MM-DD format`)
        }
      })

      setImportErrors(errors)
      setImportData(rows)
      setImportDone(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (importErrors.length > 0) { alert('Please fix all errors before importing'); return }
    if (importData.length === 0) { alert('No data to import'); return }
    setImporting(true)
    const results = await importStudentsCSV(importData, session?.id)
    setImportDone(results)
    setImporting(false)
  }

  function reset() {
    setImportData([])
    setImportErrors([])
    setImportDone(null)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Admin · Import</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Students Importer</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Bulk import students, parents and fee history from a CSV file</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {!importDone ? (
          <>
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Step 1 — Download the template</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                Open in Excel or Google Sheets, fill in your student data, then save as .csv
              </div>
              <button onClick={downloadTemplate}
                style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                📥 Download CSV Template
              </button>
            </div>

            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 12 }}>Column guide</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { col: 'name',               req: true,  desc: 'Student full name' },
                  { col: 'student_no',         req: true,  desc: 'Unique ID e.g. MXIM-001' },
                  { col: 'branch_slug',        req: true,  desc: 'KLTS / SNTL / WGMJ / MXIM' },
                  { col: 'age_group',          req: true,  desc: '3-6months / 7-12months / 1year / 2year / 3year / 4year / 5year / 6year' },
                  { col: 'date_of_birth',      req: true,  desc: 'Format: YYYY-MM-DD e.g. 2021-03-15' },
                  { col: 'monthly_fee',        req: true,  desc: 'Numbers only e.g. 650' },
                  { col: 'parent_name',        req: true,  desc: 'Parent or guardian name' },
                  { col: 'parent_phone',       req: true,  desc: 'e.g. 0123456789' },
                  { col: 'parent_email',       req: true,  desc: 'Parent email address' },
                  { col: 'fee_month',          req: false, desc: 'Full month name e.g. April' },
                  { col: 'fee_year',           req: false, desc: 'e.g. 2026' },
                  { col: 'fee_amount',         req: false, desc: 'Numbers only e.g. 650' },
                  { col: 'fee_payment_method', req: false, desc: 'Cash / Bank Transfer / Cheque' },
                  { col: 'fee_paid_date',      req: false, desc: 'Format: YYYY-MM-DD e.g. 2026-04-01' },
                ].map(item => (
                  <div key={item.col} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ background: item.req ? 'var(--absent-bg)' : 'var(--bg)', border: `0.5px solid ${item.req ? 'var(--absent)' : 'var(--border)'}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: item.req ? 'var(--absent)' : 'var(--muted)', flexShrink: 0, fontFamily: 'monospace' }}>
                      {item.req ? 'Required' : 'Optional'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontFamily: 'monospace' }}>{item.col}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Step 2 — Upload your CSV</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Make sure all required columns are filled in correctly</div>
              <input type="file" accept=".csv" onChange={handleCSVFile}
                style={{ fontSize: 13, color: 'var(--text)', width: '100%' }} />
            </div>

            {importErrors.length > 0 && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--absent)', marginBottom: 8 }}>
                  ⚠️ {importErrors.length} error{importErrors.length > 1 ? 's' : ''} found — fix before importing
                </div>
                {importErrors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--absent)', marginBottom: 4 }}>• {e}</div>
                ))}
              </div>
            )}

            {importData.length > 0 && importErrors.length === 0 && (
              <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', marginBottom: 10 }}>
                  ✅ {importData.length} records ready to import
                </div>
                {importData.slice(0, 6).map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text)', padding: '6px 0', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      <span style={{ color: 'var(--muted)' }}> · {r.student_no} · {r.branch_slug} · {r.age_group}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {r.parent_phone && <span style={{ fontSize: 10, background: 'var(--holiday-bg)', color: 'var(--holiday)', padding: '1px 6px', borderRadius: 8 }}>Parent</span>}
                      {r.fee_amount   && <span style={{ fontSize: 10, background: 'var(--present-bg)', color: 'var(--present)', padding: '1px 6px', borderRadius: 8 }}>Fee RM{r.fee_amount}</span>}
                    </div>
                  </div>
                ))}
                {importData.length > 6 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>...and {importData.length - 6} more</div>
                )}
              </div>
            )}

            {importData.length > 0 && importErrors.length === 0 && (
              <button onClick={handleImport} disabled={importing}
                style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
                {importing ? `Importing ${importData.length} records...` : `Import ${importData.length} records`}
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--present)', marginBottom: 4 }}>
                ✅ {importDone.success.length} records imported successfully
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Students, parents and fee history have been added to the system.
              </div>
            </div>

            {importDone.errors.length > 0 && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 12, padding: '16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--absent)', marginBottom: 8 }}>
                  ⚠️ {importDone.errors.length} records failed
                </div>
                {importDone.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--absent)', marginBottom: 4 }}>
                    • {e.row?.student_no || e.row?.name} — {e.reason}
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
              Next steps: Go to <strong>Students</strong> → share the Telegram link with each parent → print and laminate QR cards for daily scanning.
            </div>

            <button onClick={reset}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
