import { PageHeader, SplitPane } from '../../ui'

function ColumnGuide() {
  const cols = [
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
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {cols.map(item => (
        <div key={item.col} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ background: item.req ? 'var(--absent-bg)' : 'var(--bg)', border: `0.5px solid ${item.req ? 'var(--absent)' : 'var(--border)'}`, borderRadius: 6, padding: '2px 6px', fontSize: 10, color: item.req ? 'var(--absent)' : 'var(--muted)', flexShrink: 0, fontFamily: 'monospace' }}>
            {item.req ? 'Req' : 'Opt'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', fontFamily: 'monospace' }}>{item.col}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeedbackPanel({ importData, importErrors, importing, importDone, handleImport, reset }) {
  if (importDone) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--present)', marginBottom: 4 }}>
            ✅ {importDone.success.length} records imported successfully
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Students, parents and fee history have been added to the system.</div>
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
    )
  }

  if (importErrors.length > 0) {
    return (
      <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 12, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--absent)', marginBottom: 8 }}>
          ⚠️ {importErrors.length} error{importErrors.length > 1 ? 's' : ''} found — fix before importing
        </div>
        {importErrors.map((e, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--absent)', marginBottom: 4 }}>• {e}</div>
        ))}
      </div>
    )
  }

  if (importData.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--present-bg)', border: '0.5px solid var(--present)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--present)', marginBottom: 10 }}>
            ✅ {importData.length} records ready to import
          </div>
          {importData.slice(0, 10).map((r, i) => (
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
          {importData.length > 10 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>...and {importData.length - 10} more</div>
          )}
        </div>
        <button onClick={handleImport} disabled={importing}
          style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
          {importing ? `Importing ${importData.length} records...` : `Import ${importData.length} records`}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)', textAlign: 'center', minHeight: 200 }}>
      <div style={{ fontSize: 40 }}>📂</div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Upload a CSV to preview</div>
      <div style={{ fontSize: 13 }}>Errors and record previews appear here after you select a file</div>
    </div>
  )
}

export default function ImporterDesktopView({
  importData, importErrors, importing, importDone,
  downloadTemplate, handleCSVFile, handleImport, reset,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <PageHeader
        title="Students Importer"
        subtitle="Bulk import students, parents and fee history from a CSV file"
      />
      <SplitPane
        leftWidth={460}
        left={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>Column guide</div>
              <ColumnGuide />
            </div>

            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Step 2 — Upload your CSV</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Make sure all required columns are filled in correctly</div>
              <input type="file" accept=".csv" onChange={handleCSVFile}
                style={{ fontSize: 13, color: 'var(--text)', width: '100%' }} />
            </div>
          </div>
        }
        right={
          <FeedbackPanel
            importData={importData}
            importErrors={importErrors}
            importing={importing}
            importDone={importDone}
            handleImport={handleImport}
            reset={reset}
          />
        }
      />
    </div>
  )
}
