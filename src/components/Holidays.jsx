import { useEffect, useState } from 'react'
import { getStudents, getBranches, addHoliday, supabase } from '../lib/supabase'

export default function Holidays({ t }) {
  const [holidays, setHolidays]     = useState([])
  const [closures, setClosures]     = useState([])
  const [students, setStudents]     = useState([])
  const [branches, setBranches]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [showClosureForm, setShowClosureForm] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState('holidays') // 'holidays' | 'closures'
  const [form, setForm]             = useState({
    student_id: '', branch_id: '', start_date: '', end_date: '', reason: ''
  })
  const [closureForm, setClosureForm] = useState({
    date: '', end_date: '', label: ''
  })
  const [openClosureMenu, setOpenClosureMenu] = useState(null)
  const [openLeaveMenu, setOpenLeaveMenu] = useState(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    Promise.all([
      supabase.from('holidays').select('*, students(name, student_no), branches(name)').order('start_date', { ascending: false }),
      supabase.from('school_calendar').select('*').eq('is_off_day', true).order('date', { ascending: false }),
      getStudents(),
      getBranches(),
    ]).then(([{ data: h }, { data: c }, s, b]) => {
      setHolidays(h || [])
      setClosures(c || [])
      setStudents(s)
      setBranches(b)

      // Auto delete past closures
      const pastIds = (c || [])
        .filter(closure => {
          const endDate = closure.end_date || closure.date
          return endDate < today
        })
        .map(closure => closure.id)

      if (pastIds.length > 0) {
        supabase.from('school_calendar')
          .delete()
          .in('id', pastIds)
          .then(() => {
            setClosures(prev => prev.filter(c => !pastIds.includes(c.id)))
          })
      }
    }).finally(() => setLoading(false))
  }, [])

  async function handleAddHoliday(e) {
    e.preventDefault(); setSaving(true)
    console.log('Holiday form data:', form) // ADD THIS
    try {
      const h = await addHoliday(form)
      const { data } = await supabase
        .from('holidays')
        .select('*, students(name, student_no), branches(name)')
        .eq('id', h.id).single()
      setHolidays(prev => [data, ...prev])
      setShowForm(false)
      setForm({ student_id: '', branch_id: '', start_date: '', end_date: '', reason: '' })
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteHoliday(id) {
    if (!window.confirm('Delete this student leave?')) return
    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setHolidays(prev => prev.filter(h => h.id !== id))
    setOpenLeaveMenu(null)
  }

  async function handleAddClosure(e) {
    e.preventDefault(); setSaving(true)
    try {
      const { data, error } = await supabase
        .from('school_calendar')
        .insert({
          date:       closureForm.date,
          end_date:   closureForm.end_date || closureForm.date,
          label:      closureForm.label,
          is_off_day: true,
          branch_id:  null,
        })
        .select().single()
      if (error) throw error
      setClosures(prev => [data, ...prev])
      setShowClosureForm(false)
      setClosureForm({ date: '', end_date: '', label: '' })
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteClosure(id) {
    if (!window.confirm('Remove this school closure?')) return
    await supabase.from('school_calendar').delete().eq('id', id)
    setClosures(prev => prev.filter(c => c.id !== id))
  }

  const isActive = h => {
    const today = new Date().toISOString().split('T')[0]
    return h.start_date <= today && today <= h.end_date
  }

  const isUpcoming = c => c.date >= new Date().toISOString().split('T')[0]

  const inp = {
    style: {
      width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none'
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Time Off</div>
          <button
            onClick={() => activeTab === 'holidays' ? setShowForm(true) : setShowClosureForm(true)}
            style={{
              background: 'var(--present)',
              color: '#fff', border: 'none', borderRadius: 20,
              padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer'
            }}>
            + Add
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'holidays', label: 'Student Leave' },
            { key: 'closures', label: 'School Closures' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 0', fontSize: 13, fontWeight: 500,
                color: activeTab === tab.key ? 'var(--present)' : 'var(--muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--present)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        onClick={() => { setOpenLeaveMenu(null); setOpenClosureMenu(null) }}>        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--holiday)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : activeTab === 'holidays' ? (

          // ── Student Leave ──
          holidays.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>No student leave recorded</div>
          ) : holidays.map(h => {
            const isOpen = openLeaveMenu === h.id
            return (
              <div key={h.id}
                style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.students?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {h.students?.student_no} · {h.branches?.name?.replace('Caterpillar_', '')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--holiday)', marginTop: 6 }}>{h.start_date} → {h.end_date}</div>
                    {h.reason && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{h.reason}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isActive(h) && (
                      <span style={{ background: 'var(--holiday-bg)', color: 'var(--holiday)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>Active</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); setOpenLeaveMenu(isOpen ? null : h.id) }}
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
                </div>

                {isOpen && (
                  <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                    <button onClick={() => handleDeleteHoliday(h.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)', width: '100%' }}>
                      <span style={{ fontSize: 16 }}>🗑️</span> Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })

        ) : (

          // ── School Closures ──
          <>
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0 8px' }}>
              On these days the cron will not run — no absent marking or notifications will be sent.
            </div>
            {closures.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>No school closures added</div>
            ) : closures.map(c => {
                  const isOpen = openClosureMenu === c.id
                  return (
                    <div key={c.id}
                      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{c.label}</div>
                          <div style={{ fontSize: 12, color: isUpcoming(c) ? 'var(--holiday)' : 'var(--muted)', marginTop: 4 }}>
                            {c.end_date && c.end_date !== c.date
                              ? `${new Date(c.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} — ${new Date(c.end_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`
                              : new Date(c.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            }
                          </div>
                        </div>
                        {isUpcoming(c) && (
                          <span style={{ background: 'var(--holiday-bg)', color: 'var(--holiday)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>Upcoming</span>
                        )}
                        <button onClick={e => { e.stopPropagation(); setOpenClosureMenu(isOpen ? null : c.id) }}
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

                      {isOpen && (
                        <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                            <button onClick={() => handleDeleteClosure(c.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)' }}>
                              <span style={{ fontSize: 16 }}>🗑️</span> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
          </>
        )}
      </div>

      {/* Add student leave modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom:80, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add student leave</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAddHoliday} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select required value={form.branch_id}
                onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, student_id: '' }))} {...inp}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select required value={form.student_id}
                onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} {...inp}>
                <option value="">Select student</option>
                {students.filter(s => !form.branch_id || s.branch_id === form.branch_id).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Start date</div>
                  <input required type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} {...inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>End date</div>
                  <input required type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} {...inp} />
                </div>
              </div>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason (optional)" {...inp} />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add school closure modal */}
      {showClosureForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end'}}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom:80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add school closure</div>
              <button onClick={() => setShowClosureForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleAddClosure} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input required value={closureForm.label}
                onChange={e => setClosureForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Hari Raya Aidilfitri" {...inp} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Start date</div>
                <input required type="date" value={closureForm.date}
                  onChange={e => setClosureForm(f => ({ ...f, date: e.target.value }))} {...inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>End date</div>
                <input required type="date" value={closureForm.end_date}
                  onChange={e => setClosureForm(f => ({ ...f, end_date: e.target.value }))} {...inp} />
              </div>
            </div>
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--absent)', lineHeight: 1.6 }}>
                On this date the system will NOT mark anyone absent or send notifications.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowClosureForm(false)}
                  style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14, color: 'var(--muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: 'var(--present)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}