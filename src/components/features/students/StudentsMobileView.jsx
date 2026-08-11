import { useState } from 'react'
import { generateQRDataURL } from '../../../lib/utils/qr'
import { Input, Select, Button, Modal, Spinner } from '../../ui'
import StudentFilters from './StudentFilters'
import StudentList from './StudentList'
import StudentForm from './StudentForm'
import QRCodeModal from './QRCodeModal'

export default function StudentsMobileView({
  students, branches, loading, saving, printingQR, attendanceMap,
  getAutoStudentNo, add, update, remove, batchPrintQR,
}) {
  const [search, setSearch]                     = useState('')
  const [filterBranch, setFilterBranch]         = useState('')
  const [filterGroup, setFilterGroup]           = useState([])
  const [filterTelegram, setFilterTelegram]     = useState('')
  const [filterAttendance, setFilterAttendance] = useState('')
  const [openMenu, setOpenMenu]                 = useState(null)

  const [showAddForm, setShowAddForm]   = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editStudent, setEditStudent]   = useState(null)

  const [qrModal, setQrModal]     = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printBranch, setPrintBranch]       = useState('')

  const filtered = students.filter(s => {
    const matchSearch     = s.name.toLowerCase().includes(search.toLowerCase()) ||
                            s.student_no.toLowerCase().includes(search.toLowerCase())
    const matchBranch     = !filterBranch || s.branch_id === filterBranch
    const matchGroup      = filterGroup.length === 0 || filterGroup.includes(s.age_group)
    const matchTelegram   = !filterTelegram ||
      (filterTelegram === 'linked'    &&  s.parents?.telegram_chat_id) ||
      (filterTelegram === 'notlinked' && !s.parents?.telegram_chat_id)
    const matchAttendance = !filterAttendance ||
      attendanceMap[s.id] === filterAttendance ||
      (filterAttendance === 'ABSENT' && !attendanceMap[s.id])
    return matchSearch && matchBranch && matchGroup && matchTelegram && matchAttendance
  })

  async function handleAdd(formData) {
    await add(formData)
    setShowAddForm(false)
  }

  function openEdit(student) {
    setEditStudent(student)
    setOpenMenu(null)
    setShowEditForm(true)
  }

  async function handleEdit(formData) {
    await update(editStudent.id, formData)
    setShowEditForm(false)
    setEditStudent(null)
  }

  async function handleDelete(studentId) {
    if (!window.confirm('Delete this student?')) return
    setOpenMenu(null)
    try {
      await remove(studentId)
    } catch (err) {
      alert(err.message)
    }
  }

  async function openQR(student) {
    setOpenMenu(null)
    setQrModal(student)
    const url = await generateQRDataURL(student.id)
    setQrDataUrl(url)
  }

  function closeQR() { setQrModal(null); setQrDataUrl('') }

  function copyTelegramLink(studentId) {
    navigator.clipboard.writeText(`https://t.me/caterpillarAttendanceBot?start=${studentId}`)
    setOpenMenu(null)
    alert('Telegram link copied!')
  }

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

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 100 }}
      onClick={() => setOpenMenu(null)}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Students</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{filtered.length} of {students.length} students</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowPrintModal(true)}
              style={{ borderRadius: 20, padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Print QR
            </Button>
            <Button onClick={e => { e.stopPropagation(); setShowAddForm(true) }}
              style={{ borderRadius: 20, padding: '8px 16px', fontSize: 13 }}>
              + Add
            </Button>
          </div>
        </div>

        {/* Search + branch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            style={{ flex: 1 }}
          />
          <Select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            style={{ padding: '11px 12px', fontSize: 13, flexShrink: 0 }}
          >
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
          </Select>
        </div>

        <StudentFilters
          branches={branches}
          filterBranch={filterBranch}         setFilterBranch={setFilterBranch}
          filterGroup={filterGroup}           setFilterGroup={setFilterGroup}
          filterTelegram={filterTelegram}     setFilterTelegram={setFilterTelegram}
          filterAttendance={filterAttendance} setFilterAttendance={setFilterAttendance}
        />
      </div>

      {/* Student list */}
      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : (
          <StudentList
            students={filtered}
            attendanceMap={attendanceMap}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onEdit={openEdit}
            onDelete={handleDelete}
            onViewQR={openQR}
            onCopyTelegramLink={copyTelegramLink}
          />
        )}
      </div>

      {showAddForm && (
        <StudentForm
          mode="add"
          branches={branches}
          saving={saving}
          onSave={handleAdd}
          onClose={() => setShowAddForm(false)}
          onBranchSelect={getAutoStudentNo}
        />
      )}

      {showEditForm && editStudent && (
        <StudentForm
          key={editStudent.id}
          mode="edit"
          initialData={editStudent}
          saving={saving}
          onSave={handleEdit}
          onClose={() => { setShowEditForm(false); setEditStudent(null) }}
        />
      )}

      {qrModal && <QRCodeModal student={qrModal} qrDataUrl={qrDataUrl} onClose={closeQR} />}

      {showPrintModal && (
        <Modal onClose={() => setShowPrintModal(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Print QR codes</div>
            <Button variant="ghost" onClick={() => setShowPrintModal(false)} style={{ fontSize: 22, padding: 4, lineHeight: 1 }}>×</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Select value={printBranch} onChange={e => setPrintBranch(e.target.value)}>
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
        </Modal>
      )}
    </div>
  )
}
