import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { addStudent, supabase } from '../lib/supabase'
import { useBranches } from '../hooks/useBranches'
import { useStudents } from '../hooks/useStudents'
import { CenteredSpinner } from './ui/Spinner'
import StudentFilters from './students/StudentFilters'
import StudentCard from './students/StudentCard'
import AddStudentModal from './students/AddStudentModal'
import EditStudentModal from './students/EditStudentModal'
import QRModal from './students/QRModal'
import PrintQRModal from './students/PrintQRModal'

const EMPTY_FORM = {
  name: '', student_no: '', branch_id: '', age_group: '',
  parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', monthly_fee: ''
}

export default function Students({ t, session }) {
  const teacherBranchId = session?.role === 'teacher' ? session?.branch_id : null
  const { branches: allBranches } = useBranches()
  const { students, setStudents, loading: studentsLoading } = useStudents(teacherBranchId)

  const branches = session?.role === 'teacher'
    ? allBranches.filter(br => br.id === session?.branch_id)
    : allBranches

  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editStudent, setEditStudent]   = useState(null)
  const [search, setSearch]             = useState('')
  const [filterBranch, setFilterBranch]       = useState('')
  const [filterGroup, setFilterGroup]   = useState([])
  const [openMenu, setOpenMenu]         = useState(null)
  const [qrModal, setQrModal]           = useState(null)
  const [qrDataUrl, setQrDataUrl]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState({
    name: '', age_group: '', date_of_birth: '', monthly_fee: ''
  })
  const [printingQR, setPrintingQR]         = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printBranch, setPrintBranch]       = useState('')
  const [errors, setErrors]                 = useState({})
  const [filterTelegram, setFilterTelegram]     = useState('')
  const [filterAttendance, setFilterAttendance] = useState('')
  const [todayAttendance, setTodayAttendance]   = useState([])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    supabase.from('attendance').select('student_id, status').eq('date', today)
      .then(({ data }) => setTodayAttendance(data || []))
      .finally(() => setLoading(false))
  }, [])

  async function generateStudentNo(branchId) {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return ''
    const prefix = branch.slug.toUpperCase()
    const { data } = await supabase
      .from('students').select('student_no')
      .eq('branch_id', branchId)
      .order('student_no', { ascending: false }).limit(1)
    let next = 1
    if (data && data.length > 0) {
      const num = parseInt(data[0].student_no.split('-').pop())
      if (!isNaN(num)) next = num + 1
    }
    return `${prefix}-${String(next).padStart(3, '0')}`
  }

  async function openQR(student) {
    setQrModal(student)
    setOpenMenu(null)
    const url = await QRCode.toDataURL(student.id, {
      width: 300, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' }
    })
    setQrDataUrl(url)
  }

  function openEdit(student) {
    setEditStudent(student)
    setEditForm({
      name:          student.name,
      date_of_birth: student.date_of_birth || '',
      monthly_fee:   student.monthly_fee || '',
      age_group:     student.age_group || '',
    })
    setOpenMenu(null)
    setShowEditForm(true)
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name:          editForm.name,
          date_of_birth: editForm.date_of_birth || null,
          monthly_fee:   parseFloat(editForm.monthly_fee) || 0,
          age_group:     editForm.age_group || null,
        })
        .eq('id', editStudent.id)
      if (error) throw error
      const { data } = await supabase
        .from('students')
        .select('*, branches(name), parents(telegram_chat_id)')
        .eq('id', editStudent.id)
        .single()
      setStudents(prev => prev.map(s => s.id === editStudent.id ? data : s))
      setShowEditForm(false)
      setEditStudent(null)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(studentId) {
    if (!window.confirm('Delete this student?')) return
    setOpenMenu(null)
    const { error } = await supabase.from('students').update({ is_active: false }).eq('id', studentId)
    if (error) { alert(error.message); return }
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  function copyTelegramLink(studentId) {
    const link = `https://t.me/caterpillarAttendanceBot?start=${studentId}`
    navigator.clipboard.writeText(link)
    setOpenMenu(null)
    alert('Telegram link copied!')
  }

  async function handleAdd(e) {
    e.preventDefault()
    const newErrors = {}
    if (!form.name.trim())         newErrors.name          = 'Required'
    if (!form.branch_id)           newErrors.branch_id     = 'Required'
    if (!form.age_group)           newErrors.age_group     = 'Required'
    if (!form.date_of_birth)       newErrors.date_of_birth = 'Required'
    if (!form.monthly_fee)         newErrors.monthly_fee   = 'Required'
    if (!form.parent_name.trim())  newErrors.parent_name   = 'Required'
    if (!form.parent_phone.trim()) newErrors.parent_phone  = 'Required'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setSaving(true)
    try {
      const student = await addStudent({
        name:          form.name,
        student_no:    form.student_no,
        branch_id:     form.branch_id,
        date_of_birth: form.date_of_birth || null,
        monthly_fee:   parseFloat(form.monthly_fee) || 0,
        age_group:     form.age_group || null,
      })
      if (form.parent_name || form.parent_phone || form.parent_email) {
        await supabase.from('parents').insert({
          student_id: student.id,
          name:       form.parent_name  || null,
          phone:      form.parent_phone || null,
          email:      form.parent_email || null,
        })
      }
      setStudents(prev => [student, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleBatchPrint() {
    if (!printBranch) { alert('Please select a branch'); return }
    setPrintingQR(true)
    const { data: branchStudents } = await supabase
      .from('students').select('*, branches(name)')
      .eq('branch_id', printBranch).eq('is_active', true).order('student_no')
    if (!branchStudents || branchStudents.length === 0) {
      alert('No students found for this branch')
      setPrintingQR(false)
      return
    }
    const qrPromises = branchStudents.map(s =>
      QRCode.toDataURL(s.id, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => ({ ...s, qrUrl: url }))
    )
    const studentsWithQR = await Promise.all(qrPromises)
    const branchName = studentsWithQR[0]?.branches?.name || ''
    const html = `<html><head><title>${branchName} — QR Codes</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page-header { text-align: center; padding: 14px 20px 10px; border-bottom: 1px solid #eee; margin-bottom: 10px; }
        .page-header h1 { font-size: 16px; font-weight: bold; color: #1a1a1a; }
        .page-header p  { font-size: 10px; color: #888; margin-top: 3px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; padding: 0 8px; }
        .card { border: 0.5px solid #e0e0e0; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; break-inside: avoid; }
        .card img { width: 130px; height: 130px; display: block; margin: 0 auto 8px; }
        .card .name { font-size: 11px; font-weight: bold; color: #1a1a1a; margin-bottom: 3px; line-height: 1.3; }
        .card .id { font-size: 10px; color: #444; font-family: monospace; margin-bottom: 2px; }
        .card .branch { font-size: 9px; color: #888; }
        @media print { @page { margin: 6mm; size: A4; } body { print-color-adjust: exact; } .page-header { margin-bottom: 6px; } }
      </style></head><body>
      <div class="page-header">
        <h1>${branchName}</h1>
        <p>Student QR Codes &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ${branchStudents.length} students</p>
      </div>
      <div class="grid">
        ${studentsWithQR.map(s => `
          <div class="card">
            <img src="${s.qrUrl}" alt="QR" />
            <div class="name">${s.name}</div>
            <div class="id">${s.student_no}</div>
            <div class="branch">${s.branches?.name?.replace('Caterpillar Playtime ', '')}</div>
          </div>`).join('')}
      </div></body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); setPrintingQR(false); setShowPrintModal(false); setPrintBranch('') }
  }

  const attendanceMap = Object.fromEntries(todayAttendance.map(a => [a.student_id, a.status]))

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

  return (
    <div className="min-h-full bg-page pb-[100px]"
      onClick={() => setOpenMenu(null)}>

      <StudentFilters
        filteredCount={filtered.length}
        totalCount={students.length}
        onOpenAdd={() => setShowForm(true)}
        onOpenPrint={() => setShowPrintModal(true)}
        search={search}
        onSearchChange={setSearch}
        branches={branches}
        filterBranch={filterBranch}
        onFilterBranchChange={setFilterBranch}
        filterGroup={filterGroup}
        onFilterGroupChange={setFilterGroup}
        filterTelegram={filterTelegram}
        onFilterTelegramChange={setFilterTelegram}
        filterAttendance={filterAttendance}
        onFilterAttendanceChange={setFilterAttendance}
        onClearFilters={() => { setFilterBranch(''); setFilterGroup([]); setFilterTelegram(''); setFilterAttendance('') }}
      />

      {/* Student list */}
      <div className="lg:max-w-5xl lg:mx-auto p-4">
       {(loading || studentsLoading) ? (
          <CenteredSpinner padding={48} />
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted text-[13px] p-12">No students found</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(s => (
            <StudentCard
              key={s.id}
              student={s}
              isOpen={openMenu === s.id}
              onToggleMenu={id => setOpenMenu(openMenu === id ? null : id)}
              onCopyTelegram={copyTelegramLink}
              onOpenQR={openQR}
              onOpenEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
        )}
      </div>

      <AddStudentModal
        open={showForm}
        onClose={() => { setShowForm(false); setErrors({}) }}
        form={form}
        setForm={setForm}
        errors={errors}
        setErrors={setErrors}
        branches={branches}
        onGenerateStudentNo={generateStudentNo}
        onSubmit={handleAdd}
        saving={saving}
      />

      <EditStudentModal
        open={showEditForm && !!editStudent}
        onClose={() => setShowEditForm(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEdit}
        saving={saving}
      />

      <QRModal
        student={qrModal}
        qrDataUrl={qrDataUrl}
        onClose={() => { setQrModal(null); setQrDataUrl('') }}
      />

      <PrintQRModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        branches={branches}
        printBranch={printBranch}
        setPrintBranch={setPrintBranch}
        onPrint={handleBatchPrint}
        printing={printingQR}
      />
    </div>
  )
}
