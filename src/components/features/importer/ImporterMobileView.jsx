export default function ImporterMobileView({
  importData, importErrors, importing, importDone,
  downloadTemplate, handleCSVFile, handleImport, reset,
}) {
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
              <ColumnGuide />
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
              <PreviewCard importData={importData} />
            )}

            {importData.length > 0 && importErrors.length === 0 && (
              <button onClick={handleImport} disabled={importing}
                style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: importing ? 0.6 : 1 }}>
                {importing ? `Importing ${importData.length} records...` : `Import ${importData.length} records`}
              </button>
            )}
          </>
        ) : (
          <ResultsView importDone={importDone} reset={reset} />
        )}
      </div>
    </div>
  )
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {cols.map(item => (
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
  )
}

function PreviewCard({ importData }) {
  return (
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
  )
}

function ResultsView({ importDone, reset }) {
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
