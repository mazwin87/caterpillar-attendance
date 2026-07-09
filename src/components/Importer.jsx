import { useState } from 'react'
import { importStudentsCSV } from '../lib/supabase'
import { MONTHS, PAYMENT_METHODS, AGE_GROUPS } from '../lib/constants'

const VALID_SLUGS = ['KLTS', 'SNTL', 'WGMJ', 'MXIM']

export default function Importer() {
  const [importData, setImportData]   = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting]     = useState(false)
  const [importDone, setImportDone]   = useState(null)

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

      // Validate
      const errors = []
        rows.forEach((r, i) => {
            const rowNum = i + 2
            if (!r.name?.trim())         errors.push(`Row ${rowNum}: name is required`)
            if (!r.student_no?.trim())   errors.push(`Row ${rowNum}: student_no is required`)
            if (!r.branch_slug?.trim())  errors.push(`Row ${rowNum}: branch_slug is required`)
            if (!r.date_of_birth?.trim()) errors.push(`Row ${rowNum}: date_of_birth is required`)
            if (!r.monthly_fee?.trim())  errors.push(`Row ${rowNum}: monthly_fee is required`)
            if (!r.parent_name?.trim())  errors.push(`Row ${rowNum}: parent_name is required`)
            if (!r.parent_phone?.trim()) errors.push(`Row ${rowNum}: parent_phone is required`)

            if (r.branch_slug && !VALID_SLUGS.includes(r.branch_slug.trim().toUpperCase())) {
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
    const results = await importStudentsCSV(importData)
    setImportDone(results)
    setImporting(false)
  }

  function reset() {
    setImportData([])
    setImportErrors([])
    setImportDone(null)
  }

  return (
    <div className="min-h-full bg-page" style={{ paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-5 px-5">
       <div className="lg:max-w-2xl lg:mx-auto">
        <div className="text-[11px] text-muted tracking-[0.08em] uppercase mb-1">Admin · Import</div>
        <div className="text-[22px] font-medium text-ink">Students Importer</div>
        <div className="text-[13px] text-muted mt-1">Bulk import students, parents and fee history from a CSV file</div>
       </div>
      </div>

      <div className="lg:max-w-2xl lg:mx-auto p-4 flex flex-col gap-3">

        {!importDone ? (
          <>
            {/* Step 1 — Download template */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[13px] font-medium text-ink mb-1">Step 1 — Download the template</div>
              <div className="text-xs text-muted mb-3 leading-relaxed">
                Open in Excel or Google Sheets, fill in your student data, then save as .csv
              </div>
              <button onClick={downloadTemplate}
                className="bg-page border border-border rounded-[10px] px-4 py-2.5 text-[13px] text-ink cursor-pointer flex items-center gap-2">
                📥 Download CSV Template
              </button>
            </div>

            {/* Column guide */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[13px] font-medium text-ink mb-3">Column guide</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { col: 'name',                req: true,  desc: 'Student full name' },
                  { col: 'student_no',          req: true,  desc: 'Unique ID e.g. MXIM-001' },
                  { col: 'branch_slug',         req: true,  desc: 'KLTS / SNTL / WGMJ / MXIM' },
                  { col: 'age_group', req: true, desc: '3-6months / 7-12months / 1year / 2year / 3year / 4year / 5year / 6year' },
                  { col: 'date_of_birth',       req: true, desc: 'Format: YYYY-MM-DD e.g. 2021-03-15' },
                  { col: 'monthly_fee',         req: true, desc: 'Numbers only e.g. 650' },
                  { col: 'parent_name',         req: true, desc: 'Parent or guardian name' },
                  { col: 'parent_phone',        req: true, desc: 'e.g. 0123456789' },
                  { col: 'parent_email',        req: true, desc: 'Parent email address' },
                  { col: 'fee_month',           req: false, desc: 'Full month name e.g. April' },
                  { col: 'fee_year',            req: false, desc: 'e.g. 2026' },
                  { col: 'fee_amount',          req: false, desc: 'Numbers only e.g. 650' },
                  { col: 'fee_payment_method',  req: false, desc: 'Cash / Bank Transfer / Cheque' },
                  { col: 'fee_paid_date',       req: false, desc: 'Format: YYYY-MM-DD e.g. 2026-04-01' },
                ].map(item => (
                  <div key={item.col} className="flex gap-2.5 items-start py-1.5 border-b border-border">
                    <div className={`rounded-md px-2 py-0.5 text-[11px] flex-shrink-0 font-mono border ${
                        item.req ? 'bg-absent-bg border-absent text-absent' : 'bg-page border-border text-muted'
                      }`}>
                      {item.req ? 'Required' : 'Optional'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-ink font-mono">{item.col}</div>
                      <div className="text-[11px] text-muted mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Upload */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[13px] font-medium text-ink mb-1">Step 2 — Upload your CSV</div>
              <div className="text-xs text-muted mb-3">Make sure all required columns are filled in correctly</div>
              <input type="file" accept=".csv" onChange={handleCSVFile}
                className="text-[13px] text-ink w-full" />
            </div>

            {/* Validation errors */}
            {importErrors.length > 0 && (
              <div className="bg-absent-bg border border-absent rounded-xl px-4 py-3.5">
                <div className="text-[13px] font-medium text-absent mb-2">
                  ⚠️ {importErrors.length} error{importErrors.length > 1 ? 's' : ''} found — fix before importing
                </div>
                {importErrors.map((e, i) => (
                  <div key={i} className="text-xs text-absent mb-1">• {e}</div>
                ))}
              </div>
            )}

            {/* Preview */}
            {importData.length > 0 && importErrors.length === 0 && (
              <div className="bg-present-bg border border-present rounded-xl px-4 py-3.5">
                <div className="text-[13px] font-medium text-present mb-2.5">
                  ✅ {importData.length} records ready to import
                </div>
                {importData.slice(0, 6).map((r, i) => (
                  <div key={i} className="text-xs text-ink py-1.5 border-b border-border flex justify-between gap-2">
                    <div>
                      <span className="font-medium">{r.name}</span>
                      <span className="text-muted"> · {r.student_no} · {r.branch_slug}· {r.age_group}</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {r.parent_phone && <span className="text-[10px] bg-holiday-bg text-holiday px-1.5 py-0.5 rounded-md">Parent</span>}
                      {r.fee_amount   && <span className="text-[10px] bg-present-bg text-present px-1.5 py-0.5 rounded-md">Fee RM{r.fee_amount}</span>}
                    </div>
                  </div>
                ))}
                {importData.length > 6 && (
                  <div className="text-[11px] text-muted mt-1.5">...and {importData.length - 6} more</div>
                )}
              </div>
            )}

            {/* Import button */}
            {importData.length > 0 && importErrors.length === 0 && (
              <button onClick={handleImport} disabled={importing}
                className="bg-present text-white border-0 rounded-[10px] py-3.5 text-sm font-medium cursor-pointer disabled:opacity-60">
                {importing ? `Importing ${importData.length} records...` : `Import ${importData.length} records`}
              </button>
            )}
          </>
        ) : (
          /* Results */
          <div className="flex flex-col gap-3">
            <div className="bg-present-bg border border-present rounded-xl p-4">
              <div className="text-base font-medium text-present mb-1">
                ✅ {importDone.success.length} records imported successfully
              </div>
              <div className="text-xs text-muted">
                Students, parents and fee history have been added to the system.
              </div>
            </div>

            {importDone.errors.length > 0 && (
              <div className="bg-absent-bg border border-absent rounded-xl p-4">
                <div className="text-[13px] font-medium text-absent mb-2">
                  ⚠️ {importDone.errors.length} records failed
                </div>
                {importDone.errors.map((e, i) => (
                  <div key={i} className="text-xs text-absent mb-1">
                    • {e.row?.student_no || e.row?.name} — {e.reason}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-holiday-bg border border-holiday rounded-[10px] px-4 py-3 text-xs text-holiday leading-relaxed">
              Next steps: Go to <strong>Students</strong> → share the Telegram link with each parent → print and laminate QR cards for daily scanning.
            </div>

            <div className="flex gap-2.5">
              <button onClick={reset}
                className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">
                Import another file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
