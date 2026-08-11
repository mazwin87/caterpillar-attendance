import { useState } from 'react'
import { generateQRDataURL } from '../../../lib/utils/qr'
import { STATUS } from '../../../lib/constants/attendance'
import { AGE_GROUP_LABELS, AGE_OPTIONS } from '../../../lib/constants/ageGroups'
import { PageHeader, Table, Input, Select, Button, Spinner } from '../../ui'
import StudentForm from './StudentForm'
import QRCodeModal from './QRCodeModal'

export default function StudentsDesktopView({
  session,
  students, branches, loading, saving, printingQR, attendanceMap,
  getAutoStudentNo, add, update, remove, batchPrintQR,
}) {
  const [search, setSearch]                     = useState('')
  const [filterBranch, setFilterBranch]         = useState('')
  const [filterGroup, setFilterGroup]           = useState('')
  const [filterAttendance, setFilterAttendance] = useState('')

  const [showAddPanel, setShowAddPanel]   = useState(false)
  const [showEditForm, setShowEditForm]   = useState(false)
  const [editStudent, setEditStudent]     = useState(null)

  const [qrModal, setQrModal]     = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printBranch, setPrintBranch]       = useState('')

  const hasActive = search || filterBranch || filterGroup || filterAttendance

  const filtered = students.filter(s => {
    const matchSearch     = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_no.toLowerCase().includes(search.toLowerCase())
    const matchBranch     = !filterBranch || s.branch_id === filterBranch
    const matchGroup      = !filterGroup || s.age_group === filterGroup
    const matchAttendance = !filterAttendance ||
      attendanceMap[s.id] === filterAttendance ||
      (filterAttendance === 'ABSENT' && !attendanceMap[s.id])
    return matchSearch && matchBranch && matchGroup && matchAttendance
  })

  function clearFilters() {
    setSearch('')
    setFilterBranch('')
    setFilterGroup('')
    setFilterAttendance('')
  }

  async function handleAdd(formData) {
    await add(formData)
    setShowAddPanel(false)
  }

  function openEdit(student) {
    setEditStudent(student)
    setShowEditForm(true)
  }

  async function handleEdit(formData) {
    await update(editStudent.id, formData)
    setShowEditForm(false)
    setEditStudent(null)
  }

  function copyTelegramLink(studentId) {
    navigator.clipboard.writeText(`https://t.me/caterpillarAttendanceBot?start=${studentId}`)
    alert('Telegram link copied!')
  }

  async function handleDelete(studentId) {
    if (!window.confirm('Delete this student?')) return
    try {
      await remove(studentId)
    } catch (err) {
      alert(err.message)
    }
  }

  async function openQR(student) {
    setQrModal(student)
    const url = await generateQRDataURL(student.id)
    setQrDataUrl(url)
  }

  function closeQR() { setQrModal(null); setQrDataUrl('') }

  async function handleBatchPrint() {
    if (!printBranch) { alert('Please select a branch'); return }
    try {
      await batchPrintQR(printBranch)
      setShowPrintModal(false)
      setPrintBranch('')
    } catch (err) {
      alert(err.message)
    }
  }

  const tableRows = filtered.map(s => ({
    id:          s.id,
    name:        s.name,
    student_no:  s.student_no,
    branch:      s.branches?.name || '—',
    age_group:   s.age_group || '',
    monthly_fee: s.monthly_fee ?? 0,
    _student:    s,
  }))

  const rowBtn = { padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '0.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }
  const rowBtnDanger = { ...rowBtn, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', color: 'var(--absent)' }

  const columns = [
    {
      key: 'name', label: 'Name', sortable: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--present-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: 'var(--present)', flexShrink: 0 }}>
            {row.name.charAt(0)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.name}</span>
        </span>
      ),
    },
    { key: 'student_no', label: 'ID', sortable: true },
    { key: 'branch', label: 'Branch', sortable: true },
    {
      key: 'age_group', label: 'Age Group', sortable: true,
      render: (row) => AGE_GROUP_LABELS[row.age_group] || '—',
    },
    {
      key: 'monthly_fee', label: 'Fee (RM)', sortable: true,
      render: (row) => row.monthly_fee ? `RM ${row.monthly_fee.toFixed(2)}` : '—',
    },
    {
      key: 'status', label: 'Status', sortable: false,
      render: (row) => {
        const st = attendanceMap[row.id]
        if (!st) return <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
        const cfg = STATUS[st]
        return <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
      },
    },
    {
      key: 'actions', label: '', sortable: false,
      render: (row) => (
        <span style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => copyTelegramLink(row.id)} style={rowBtn}>📱 Telegram</button>
          <button onClick={() => openQR(row._student)} style={rowBtn}>🔲 QR</button>
          <button onClick={() => openEdit(row._student)} style={rowBtn}>✏️ Edit</button>
          <button onClick={() => handleDelete(row.id)} style={rowBtnDanger}>🗑️ Delete</button>
        </span>
      ),
    },
  ]

  const isAdmin = session?.role === 'admin' || session?.role === 'superadmin'
  const pageTitle = isAdmin
    ? (filterBranch ? branches.find(b => b.id === filterBranch)?.name ?? 'Students' : 'Students')
    : (session?.branches?.name || branches[0]?.name || 'Students')

  return (
    <div style={{ minHeight: '100%' }}>
      <PageHeader
        title={pageTitle}
        subtitle={`${filtered.length} of ${students.length} students`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowPrintModal(true)}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Print QR
            </Button>
            <Button onClick={() => setShowAddPanel(true)} style={{ fontSize: 13 }}>
              + Add Student
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <div style={{ padding: '14px 32px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or ID..."
          style={{ width: 260 }}
        />
        {branches.length > 1 && (
          <Select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 160, padding: '11px 12px', fontSize: 13 }}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        )}
        <Select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={{ width: 150, padding: '11px 12px', fontSize: 13 }}>
          <option value="">All ages</option>
          {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={filterAttendance} onChange={e => setFilterAttendance(e.target.value)} style={{ width: 150, padding: '11px 12px', fontSize: 13 }}>
          <option value="">All status</option>
          {['PRESENT', 'LATE', 'ABSENT', 'HOLIDAY'].map(s => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </Select>
        {hasActive && (
          <button onClick={clearFilters} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner />
        </div>
      ) : (
        <div style={{ padding: 32 }}>
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <Table columns={columns} rows={tableRows} emptyMessage="No students found." />
          </div>
        </div>
      )}

      {/* Add slide-in panel */}
      {showAddPanel && (
        <StudentForm
          mode="add"
          variant="panel"
          branches={branches}
          saving={saving}
          onSave={handleAdd}
          onClose={() => setShowAddPanel(false)}
          onBranchSelect={getAutoStudentNo}
        />
      )}

      {/* Edit modal */}
      {showEditForm && editStudent && (
        <StudentForm
          key={editStudent.id}
          mode="edit"
          variant="center"
          initialData={editStudent}
          saving={saving}
          onSave={handleEdit}
          onClose={() => { setShowEditForm(false); setEditStudent(null) }}
        />
      )}

      {qrModal && <QRCodeModal student={qrModal} qrDataUrl={qrDataUrl} onClose={closeQR} />}

      {/* Print QR modal */}
      {showPrintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowPrintModal(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 360, maxWidth: 'calc(100vw - 32px)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Print QR codes</div>
              <Button variant="ghost" onClick={() => setShowPrintModal(false)} style={{ fontSize: 22, padding: 4, lineHeight: 1 }}>×</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Select value={printBranch} onChange={e => setPrintBranch(e.target.value)} style={{ padding: '11px 12px', fontSize: 13 }}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
                9 QR codes per page (3×3), A4 size. Ready to cut and laminate.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setShowPrintModal(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button onClick={handleBatchPrint} disabled={printingQR || !printBranch} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🖨️ {printingQR ? 'Generating...' : 'Print'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
