import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getStudents, getBranches, addStudent, supabase } from '../lib/supabase'

const AGE_GROUPS = [
  '3-6months', '7-12months', '1year', '2year', '3year', '4year', '5year', '6year'
]

const AGE_GROUP_LABELS = {
  '3-6months':  '3–6 Months',
  '7-12months': '7–12 Months',
  '1year': '1 Year',
  '2year': '2 Years',
  '3year': '3 Years',
  '4year': '4 Years',
  '5year': '5 Years',
  '6year': '6 Years',
}

export default function Students({ t, session }) {
  const [students, setStudents]         = useState([])
  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editStudent, setEditStudent]   = useState(null)
  const [search, setSearch]             = useState('')
  const [filterBranch, setFilter]       = useState('')
  const [filterGroup, setFilterGroup]   = useState([])
  const [openMenu, setOpenMenu]         = useState(null)
  const [qrModal, setQrModal]           = useState(null)
  const [qrDataUrl, setQrDataUrl]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [form, setForm] = useState({
    name: '', student_no: '', branch_id: '', age_group: '',
    parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', monthly_fee: ''
  })
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
    Promise.all([
      getStudents(session?.role === 'teacher' ? session?.branch_id : null),
      getBranches(),
      supabase.from('attendance').select('student_id, status').eq('date', today),
    ])
      .then(([s, b, { data: a }]) => {
        setStudents(s)
        setTodayAttendance(a || [])
        setBranches(session?.role === 'teacher'
          ? b.filter(br => br.id === session?.branch_id)
          : b
        )
      })
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
    const { error } = await supabase.from('students').delete().eq('id', studentId)
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
      setForm({ name: '', student_no: '', branch_id: '', age_group: '', parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', monthly_fee: '' })
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

  const inp = {
    style: {
      width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none'
    }
  }

  const divider = (label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 2px' }}>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
    </div>
  )

  const AGE_OPTIONS = [
    { value: '3-6months',  label: '3 – 6 Months' },
    { value: '7-12months', label: '7 – 12 Months' },
    { value: '1year',      label: '1 Year' },
    { value: '2year',      label: '2 Years' },
    { value: '3year',      label: '3 Years' },
    { value: '4year',      label: '4 Years' },
    { value: '5year',      label: '5 Years' },
    { value: '6year',      label: '6 Years' },
  ]

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 100 }}
      onClick={() => setOpenMenu(null)}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>

        {/* Title + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Students</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{filtered.length} of {students.length} students</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowPrintModal(true)}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Print QR
            </button>
            <button onClick={e => { e.stopPropagation(); setShowForm(true) }}
              style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Search + branch */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            style={{ ...inp.style, flex: 1 }} />
          <select value={filterBranch} onChange={e => setFilter(e.target.value)}
            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', flexShrink: 0 }}>
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
          </select>
        </div>

        {/* Filter card */}
        <div style={{ background: 'var(--bg)', borderRadius: 12, border: '0.5px solid var(--border)', overflow: 'hidden' }}>

          {/* Age group */}
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Age group</div>
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
              {['', ...AGE_GROUPS].map(g => {
                const isActive = g === '' ? filterGroup.length === 0 : filterGroup.includes(g)
                return (
                  <button key={g}
                    onClick={() => {
                      if (g === '') setFilterGroup([])
                      else setFilterGroup(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
                    }}
                    style={{
                      background: isActive ? '#4caf87' : 'var(--surface)',
                      color:      isActive ? '#fff' : 'var(--muted)',
                      border:     `0.5px solid ${isActive ? '#4caf87' : 'var(--border)'}`,
                      borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                    {g ? AGE_GROUP_LABELS[g] : 'All'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Telegram + Attendance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ padding: '10px 14px', borderRight: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Telegram link</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { val: '',          label: 'All' },
                  { val: 'linked',    label: '● Linked' },
                  { val: 'notlinked', label: '○ Unlinked' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setFilterTelegram(opt.val)}
                    style={{
                      background: filterTelegram === opt.val ? '#4caf87' : 'var(--surface)',
                      color:      filterTelegram === opt.val ? '#fff' : 'var(--muted)',
                      border:     `0.5px solid ${filterTelegram === opt.val ? '#4caf87' : 'var(--border)'}`,
                      borderRadius: 8, padding: '5px 8px', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Attendance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { val: '',        label: 'All',       color: null },
                  { val: 'PRESENT', label: '✓ Present', color: '#4caf87' },
                  { val: 'LATE',    label: '⏰ Late',   color: '#f0a500' },
                  { val: 'ABSENT',  label: '✗ Absent',  color: 'var(--absent)' },
                  { val: 'HOLIDAY', label: '🏖 Holiday', color: 'var(--holiday)' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setFilterAttendance(opt.val)}
                    style={{
                      background: filterAttendance === opt.val ? (opt.color || '#4caf87') : 'var(--surface)',
                      color:      filterAttendance === opt.val ? '#fff' : 'var(--muted)',
                      border:     `0.5px solid ${filterAttendance === opt.val ? (opt.color || '#4caf87') : 'var(--border)'}`,
                      borderRadius: 8, padding: '5px 8px', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active filters + clear */}
          {(filterGroup.length > 0 || filterTelegram || filterAttendance || filterBranch) && (
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#edf7f2' }}>
              <div style={{ fontSize: 11, color: '#4caf87', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  filterBranch && branches.find(b => b.id === filterBranch)?.slug,
                  ...filterGroup.map(g => AGE_GROUP_LABELS[g]),
                  filterTelegram === 'linked'    && 'Linked',
                  filterTelegram === 'notlinked' && 'Unlinked',
                  filterAttendance && filterAttendance.charAt(0) + filterAttendance.slice(1).toLowerCase(),
                ].filter(Boolean).map((f, i) => (
                  <span key={i} style={{ background: '#4caf87', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>
                    {f}
                  </span>
                ))}
              </div>
              <button onClick={() => { setFilter(''); setFilterGroup([]); setFilterTelegram(''); setFilterAttendance('') }}
                style={{ fontSize: 11, color: '#4caf87', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Clear all ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--present)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>No students found</div>
        ) : filtered.map(s => {
          const ageLabel = AGE_GROUP_LABELS[s.age_group] || s.age_group
          const tgLinked = s.parents?.telegram_chat_id
          const isOpen   = openMenu === s.id
          return (
            <div key={s.id}
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--present-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: 'var(--present)', flexShrink: 0 }}>
                  {s.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: tgLinked ? 'var(--present-bg)' : 'var(--absent-bg)', color: tgLinked ? 'var(--present)' : 'var(--absent)' }}>
                      {tgLinked ? '● Linked' : '○ Unlinked'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {s.student_no} · {s.branches?.name?.replace('Caterpillar Playtime ', '')}
                    </span>
                    {ageLabel && (
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500, flexShrink: 0 }}>
                        {ageLabel}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : s.id) }}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', background: isOpen ? 'var(--border)' : 'var(--bg)', border: '0.5px solid var(--border)', color: isOpen ? 'var(--text)' : 'var(--muted)' }}>
                  Actions
                </button>
              </div>

              {isOpen && (
                <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button onClick={() => copyTelegramLink(s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                      <span style={{ fontSize: 16 }}>📱</span> Telegram
                    </button>
                    <button onClick={() => openQR(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                      <span style={{ fontSize: 16 }}>🔲</span> View QR
                    </button>
                    <button onClick={() => openEdit(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                      <span style={{ fontSize: 16 }}>✏️</span> Edit
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)' }}>
                      <span style={{ fontSize: 16 }}>🗑️</span> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add student modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowForm(false)}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 80, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add student</div>
              <button onClick={() => { setShowForm(false); setErrors({}) }} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {divider('Student info')}
              <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(f => ({ ...f, name: '' })) }} placeholder="Full name" {...inp} />
              {errors.name && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: -6 }}>⚠️ Student name is required</div>}

              <select value={form.branch_id}
                onChange={async e => {
                  const branchId = e.target.value
                  const studentNo = await generateStudentNo(branchId)
                  setForm(f => ({ ...f, branch_id: branchId, student_no: studentNo, age_group: '' }))
                  setErrors(f => ({ ...f, branch_id: '' }))
                }} {...inp}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.branch_id && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: -6 }}>⚠️ Please select a branch</div>}

              <div style={{ position: 'relative' }}>
                <input value={form.student_no} readOnly placeholder="Student ID — select branch first"
                  style={{ ...inp.style, color: 'var(--muted)', background: 'var(--border)', paddingRight: 70 }} />
                {form.student_no && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--present)', background: 'var(--present-bg)', padding: '2px 8px', borderRadius: 10 }}>Auto</span>
                )}
              </div>

              <select value={form.age_group} onChange={e => { setForm(f => ({ ...f, age_group: e.target.value })); setErrors(f => ({ ...f, age_group: '' })) }} {...inp}>
                <option value="">Select age group</option>
                {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.age_group && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: -6 }}>⚠️ Please select an age group</div>}

              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date of birth</div>
                <input type="date" value={form.date_of_birth} max={new Date().toISOString().split('T')[0]}
                  onChange={e => { setForm(f => ({ ...f, date_of_birth: e.target.value })); setErrors(f => ({ ...f, date_of_birth: '' })) }} {...inp} />
                {errors.date_of_birth && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: 4 }}>⚠️ Please enter date of birth</div>}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Monthly fee (RM)</div>
                <input type="number" step="0.01" value={form.monthly_fee || ''}
                  onChange={e => { setForm(f => ({ ...f, monthly_fee: e.target.value })); setErrors(f => ({ ...f, monthly_fee: '' })) }}
                  placeholder="0.00" {...inp} />
                {errors.monthly_fee && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: 4 }}>⚠️ Please enter monthly fee</div>}
              </div>

              {divider('Parent info')}
              <input value={form.parent_name}
                onChange={e => { setForm(f => ({ ...f, parent_name: e.target.value })); setErrors(f => ({ ...f, parent_name: '' })) }}
                placeholder="Parent / guardian name" {...inp} />
              {errors.parent_name && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: -6 }}>⚠️ Parent name is required</div>}

              <input value={form.parent_phone} type="tel"
                onChange={e => { setForm(f => ({ ...f, parent_phone: e.target.value })); setErrors(f => ({ ...f, parent_phone: '' })) }}
                placeholder="Phone number e.g. 012-345 6789" {...inp} />
              {errors.parent_phone && <div style={{ fontSize: 11, color: 'var(--absent)', marginTop: -6 }}>⚠️ Phone number is required</div>}

              <input value={form.parent_email} type="email"
                onChange={e => { setForm(f => ({ ...f, parent_email: e.target.value })); setErrors(f => ({ ...f, parent_email: '' })) }}
                placeholder="Email (optional)" {...inp} />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setErrors({}) }}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit student modal */}
      {showEditForm && editStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowEditForm(false)}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 80, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Edit student</div>
              <button onClick={() => setShowEditForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" {...inp} />
              <select value={editForm.age_group} onChange={e => setEditForm(f => ({ ...f, age_group: e.target.value }))} {...inp}>
                <option value="">Select age group</option>
                {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date of birth</div>
                <input type="date" value={editForm.date_of_birth} max={new Date().toISOString().split('T')[0]}
                  onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} {...inp} />
              </div>
              <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)' }}>
                Student ID and branch cannot be changed after registration.
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Monthly fee (RM)</div>
                <input type="number" step="0.01" value={editForm.monthly_fee || ''}
                  onChange={e => setEditForm(f => ({ ...f, monthly_fee: e.target.value }))}
                  placeholder="0.00" {...inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEditForm(false)}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setQrModal(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 300, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{qrModal.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>{qrModal.student_no}</div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 8, border: '0.5px solid var(--border)', marginBottom: 20 }} />}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setQrModal(null); setQrDataUrl('') }}
                style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 11, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>Close</button>
              <a href={qrDataUrl} download={`${qrModal.student_no}-qr.png`}
                style={{ flex: 1, background: 'var(--present)', borderRadius: 10, padding: 11, fontSize: 14, color: '#fff', fontWeight: 500, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Print QR modal */}
      {showPrintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowPrintModal(false)}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 100 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Print QR codes</div>
              <button onClick={() => setShowPrintModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={printBranch} onChange={e => setPrintBranch(e.target.value)} {...inp}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
                9 QR codes per page (3×3), A4 size. Ready to cut and laminate.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowPrintModal(false)}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleBatchPrint} disabled={printingQR || !printBranch}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: (printingQR || !printBranch) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  🖨️ {printingQR ? 'Generating...' : 'Print'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}