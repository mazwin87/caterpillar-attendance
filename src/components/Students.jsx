import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getStudents, getBranches, addStudent, supabase } from '../lib/supabase'

function getAgeGroup(dob) {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  const years = (today - birth) / (365.25 * 24 * 60 * 60 * 1000)
  if (years < 1)  return { label: 'Infant',    color: '#c2185b', bg: '#fce4f3' }
  if (years < 3)  return { label: 'Toddler',   color: '#7b1fa2', bg: '#f3e5f5' }
  if (years < 4)  return { label: 'Playgroup', color: '#1565c0', bg: '#e3f2fd' }
  if (years <= 6) return { label: 'Preschool', color: '#2d7a4f', bg: '#eef6f1' }
  return { label: 'Other', color: '#888', bg: '#f5f5f5' }
}

function getAge(dob) {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  if (months < 12) return `${months}m`
  const years = Math.floor(months / 12)
  const rem   = months % 12
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`
}

const AGE_GROUPS = ['Infant', 'Toddler', 'Playgroup', 'Preschool']

export default function Students({ t }) {
  const [students, setStudents]       = useState([])
  const [branches, setBranches]       = useState([])
  const [classes, setClasses]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [search, setSearch]           = useState('')
  const [filterBranch, setFilter]     = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [openMenu, setOpenMenu]       = useState(null)
  const [qrModal, setQrModal]         = useState(null)
  const [qrDataUrl, setQrDataUrl]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState({
    name: '', student_no: '', branch_id: '', class_id: '',
    parent_name: '', parent_phone: '', parent_email: '', date_of_birth: ''
  })
  const [editForm, setEditForm]       = useState({
    name: '', class_id: '', date_of_birth: ''
  })
  const [printingQR, setPrintingQR] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printBranch, setPrintBranch] = useState('')

  useEffect(() => {
    Promise.all([getStudents(), getBranches(), supabase.from('classes').select('*')])
      .then(([s, b, { data: c }]) => { setStudents(s); setBranches(b); setClasses(c || []) })
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
      class_id:      student.class_id || '',
      date_of_birth: student.date_of_birth || '',
    })
    setOpenMenu(null)
    setShowEditForm(true)
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          name:          editForm.name,
          class_id:      editForm.class_id || null,
          date_of_birth: editForm.date_of_birth || null,
        })
        .eq('id', editStudent.id)
        .select('*, classes(name), branches(name), parents(telegram_chat_id), date_of_birth')
        .single()
      if (error) throw error
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
    setSaving(true)
    try {
      const student = await addStudent({
        name: form.name, student_no: form.student_no,
        branch_id: form.branch_id, class_id: form.class_id || null,
        date_of_birth: form.date_of_birth || null,
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
      setForm({ name: '', student_no: '', branch_id: '', class_id: '', parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '' })
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleBatchPrint() {
  if (!printBranch) { alert('Please select a branch'); return }
  setPrintingQR(true)

  const { data: branchStudents } = await supabase
    .from('students')
    .select('*, branches(name)')
    .eq('branch_id', printBranch)
    .eq('is_active', true)
    .order('student_no')

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

  const html = `
    <html>
    <head>
      <title>${branchName} — QR Codes</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page-header { text-align: center; padding: 20px 20px 12px; border-bottom: 1px solid #eee; }
        .page-header h1 { font-size: 18px; font-weight: bold; color: #1a1a1a; }
        .page-header p { font-size: 11px; color: #888; margin-top: 4px; }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
        }
        .card {
          border: 1px solid #e0e0e0;
          padding: 32px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 48vh;
          break-inside: avoid;
        }
        .card img {
          width: 200px;
          height: 200px;
          display: block;
          margin: 0 auto 16px;
        }
        .card .name {
          font-size: 14px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .card .id {
          font-size: 13px;
          color: #444;
          font-family: monospace;
          margin-bottom: 4px;
        }
        .card .branch {
          font-size: 11px;
          color: #888;
        }
        @media print {
          @page { margin: 8mm; size: A4; }
          body { print-color-adjust: exact; }
          .card { min-height: 46vh; }
        }
      </style>
      </head>
      <body>
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
              <div class="branch">${s.branches?.name?.replace('Caterpillar_', '')}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.onload = () => {
      win.print()
      setPrintingQR(false)
      setShowPrintModal(false)
      setPrintBranch('')
    }
  }

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.student_no.toLowerCase().includes(search.toLowerCase())
    const matchBranch = !filterBranch || s.branch_id === filterBranch
    const group = getAgeGroup(s.date_of_birth)
    const matchGroup = !filterGroup || group?.label === filterGroup
    return matchSearch && matchBranch && matchGroup
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

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 100 }}
      onClick={() => setOpenMenu(null)}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Students</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowPrintModal(true)}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🖨️</span> Print QR
            </button>
            <button onClick={e => { e.stopPropagation(); setShowForm(true) }}
              style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              + Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID..." {...inp} style={{ ...inp.style, flex: 1 }} />
          <select value={filterBranch} onChange={e => setFilter(e.target.value)}
            style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            <option value="">All</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
          </select>
        </div>

        {/* Age group filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...AGE_GROUPS].map(g => (
            <button key={g} onClick={() => setFilterGroup(g)}
              style={{
                background: filterGroup === g ? 'var(--present)' : 'var(--bg)',
                color: filterGroup === g ? '#fff' : 'var(--muted)',
                border: `0.5px solid ${filterGroup === g ? 'var(--present)' : 'var(--border)'}`,
                borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {g || 'All ages'}
            </button>
          ))}
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
          const ageGroup = getAgeGroup(s.date_of_birth)
          const age      = getAge(s.date_of_birth)
          const tgLinked = s.parents?.telegram_chat_id
          const isOpen   = openMenu === s.id

          return (
            <div key={s.id}
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}
              onClick={e => e.stopPropagation()}>

              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: ageGroup?.bg || 'var(--present-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: ageGroup?.color || 'var(--present)', flexShrink: 0 }}>
                  {s.name.charAt(0)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0, background: tgLinked ? 'var(--present-bg)' : 'var(--absent-bg)', color: tgLinked ? 'var(--present)' : 'var(--absent)' }}>
                      {tgLinked ? '● TG' : '○ TG'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {s.student_no} · {s.branches?.name?.replace('Caterpillar_', '')}
                      {s.classes?.name ? ` · ${s.classes.name}` : ''}
                    </span>
                    {ageGroup && (
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: ageGroup.bg, color: ageGroup.color, fontWeight: 500, flexShrink: 0 }}>
                        {ageGroup.label}{age ? ` · ${age}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions button */}
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : s.id) }}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.15s',
                    background: isOpen ? 'var(--border)' : 'var(--bg)',
                    border: '0.5px solid var(--border)',
                    color: isOpen ? 'var(--text)' : 'var(--muted)',
                  }}>
                  Actions
                </button>
              </div>

              {/* Action sheet — expands inline */}
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
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {divider('Student info')}
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" {...inp} />
              <select required value={form.branch_id}
                onChange={async e => {
                  const branchId = e.target.value
                  const studentNo = await generateStudentNo(branchId)
                  setForm(f => ({ ...f, branch_id: branchId, student_no: studentNo, class_id: '' }))
                }} {...inp}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <input value={form.student_no} readOnly placeholder="Student ID — select branch first"
                  style={{ ...inp.style, color: 'var(--muted)', background: 'var(--border)', paddingRight: 70 }} />
                {form.student_no && (
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--present)', background: 'var(--present-bg)', padding: '2px 8px', borderRadius: 10 }}>Auto</span>
                )}
              </div>
              <select value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))} {...inp}>
                <option value="">Select class (optional)</option>
                {classes.filter(c => c.branch_id === form.branch_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date of birth</div>
                  <input type="date" value={form.date_of_birth} max={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} {...inp} />                {form.date_of_birth && (() => {
                  const g = getAgeGroup(form.date_of_birth)
                  const a = getAge(form.date_of_birth)
                  return g ? <div style={{ marginTop: 6 }}><span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: g.bg, color: g.color, fontWeight: 500 }}>{g.label} · {a}</span></div> : null
                })()}
              </div>
              {divider('Parent info')}
              <input value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} placeholder="Parent / guardian name" {...inp} />
              <input value={form.parent_phone} type="tel" onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))} placeholder="Phone number e.g. 012-345 6789" {...inp} />
              <input value={form.parent_email} type="email" onChange={e => setForm(f => ({ ...f, parent_email: e.target.value }))} placeholder="Email (optional)" {...inp} />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)}
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
              <select value={editForm.class_id} onChange={e => setEditForm(f => ({ ...f, class_id: e.target.value }))} {...inp}>
                <option value="">Select class (optional)</option>
                {classes.filter(c => c.branch_id === editStudent.branch_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date of birth</div>
                  <input type="date" value={editForm.date_of_birth} max={new Date().toISOString().split('T')[0]} onChange={e => setEditForm(f => ({ ...f, date_of_birth: e.target.value }))} {...inp} />                    {editForm.date_of_birth && (() => {
                  const g = getAgeGroup(editForm.date_of_birth)
                  const a = getAge(editForm.date_of_birth)
                  return g ? <div style={{ marginTop: 6 }}><span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: g.bg, color: g.color, fontWeight: 500 }}>{g.label} · {a}</span></div> : null
                })()}
              </div>
              <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)' }}>
                Student ID and branch cannot be changed after registration.
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
      {showPrintModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
    onClick={() => setShowPrintModal(false)}>
    <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 100 }}
      onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Print QR codes</div>
        <button onClick={() => setShowPrintModal(false)}
          style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={printBranch} onChange={e => setPrintBranch(e.target.value)} {...inp}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
          2 QR codes per page, A4 size. Ready to cut and laminate.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowPrintModal(false)}
            style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleBatchPrint} disabled={printingQR || !printBranch}
            style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: (printingQR || !printBranch) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>🖨️</span> {printingQR ? 'Generating...' : 'Print'}
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