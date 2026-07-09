import { useEffect, useState } from 'react'
import { getStudents, getBranches, addHoliday, supabase } from '../lib/supabase'
import { cleanBranchName } from '../lib/branch'
import { CenteredSpinner } from './ui/Spinner'
import Modal from './ui/Modal'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

const actionsButton = (isOpen) =>
  `px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 whitespace-nowrap transition-all duration-150 border border-border ${
    isOpen ? 'bg-border text-ink' : 'bg-page text-muted'
  }`

export default function Holidays({ t, isAdmin }) {
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

  return (
    <div className="min-h-full bg-page pb-20">

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border px-5">
       <div className="lg:max-w-5xl lg:mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[22px] font-medium text-ink">Time Off</div>
          {(activeTab === 'holidays' || (activeTab === 'closures' && isAdmin)) && (
            <button
              onClick={() => activeTab === 'holidays' ? setShowForm(true) : setShowClosureForm(true)}
              className="bg-present text-white border-0 rounded-full px-4 py-2 text-[13px] font-medium cursor-pointer">
              + Add
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="lg:max-w-md flex">
          {[
            { key: 'holidays', label: 'Student Leave' },
            { key: 'closures', label: 'School Closures' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 bg-transparent border-0 cursor-pointer py-2.5 text-[13px] transition-all duration-150 border-b-2 ${
                activeTab === tab.key ? 'text-present border-present font-medium' : 'text-muted border-transparent font-normal'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
       </div>
      </div>

      {/* Content */}
      <div className="lg:max-w-5xl lg:mx-auto p-4 flex flex-col gap-2"
        onClick={() => { setOpenLeaveMenu(null); setOpenClosureMenu(null) }}>
        {loading ? (
          <CenteredSpinner padding={48} color="var(--holiday)" />
        ) : activeTab === 'holidays' ? (

          holidays.length === 0 ? (
            <div className="text-center text-muted text-[13px] p-12">No student leave recorded</div>
          ) : holidays.map(h => {
            const isOpen = openLeaveMenu === h.id
            return (
              <div key={h.id}
                className="bg-surface border border-border rounded-xl px-4 py-3"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap">{h.students?.name}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {h.students?.student_no} · {cleanBranchName(h.branches?.name)}
                    </div>
                    <div className="text-xs text-holiday mt-1.5">{h.start_date} → {h.end_date}</div>
                    {h.reason && <div className="text-xs text-muted mt-1">{h.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive(h) && (
                      <span className="bg-holiday-bg text-holiday text-[10px] px-2.5 py-0.5 rounded-full font-medium">Active</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); setOpenLeaveMenu(isOpen ? null : h.id) }}
                      className={actionsButton(isOpen)}>
                      Actions
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-2.5 border-t border-border pt-2.5">
                    <button onClick={() => handleDeleteHoliday(h.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-absent bg-absent-bg cursor-pointer text-[13px] text-absent w-full">
                      <span className="text-base">🗑️</span> Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })

        ) : (

          <>
            <div className="text-xs text-muted py-2 px-0">
              On these days the cron will not run — no absent marking or notifications will be sent.
            </div>
            {closures.length === 0 ? (
              <div className="text-center text-muted text-[13px] p-12">No school closures added</div>
            ) : closures.map(c => {
                  const isOpen = openClosureMenu === c.id
                  return (
                    <div key={c.id}
                      className="bg-surface border border-border rounded-xl px-4 py-3"
                      onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink">{c.label}</div>
                          <div className={`text-xs mt-1 ${isUpcoming(c) ? 'text-holiday' : 'text-muted'}`}>
                            {c.end_date && c.end_date !== c.date
                              ? `${new Date(c.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} — ${new Date(c.end_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`
                              : new Date(c.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            }
                          </div>
                        </div>
                        {isUpcoming(c) && (
                          <span className="bg-holiday-bg text-holiday text-[10px] px-2.5 py-0.5 rounded-full font-medium flex-shrink-0">Upcoming</span>
                        )}
                        {isAdmin && (
                          <button onClick={e => { e.stopPropagation(); setOpenClosureMenu(isOpen ? null : c.id) }}
                            className={actionsButton(isOpen)}>
                            Actions
                          </button>
                        )}
                      </div>

                      {isOpen && (
                        <div className="mt-2.5 border-t border-border pt-2.5">
                          <div className="grid grid-cols-1 gap-1.5">
                            <button onClick={() => handleDeleteClosure(c.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-absent bg-absent-bg cursor-pointer text-[13px] text-absent">
                              <span className="text-base">🗑️</span> Delete
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
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add student leave">
            <form onSubmit={handleAddHoliday} className="flex flex-col gap-2.5">
              <select required value={form.branch_id}
                onChange={e => setForm(f => ({ ...f, branch_id: e.target.value, student_id: '' }))} className={inputClass}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select required value={form.student_id}
                onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} className={inputClass}>
                <option value="">Select student</option>
                {students.filter(s => !form.branch_id || s.branch_id === form.branch_id).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-muted mb-1">Start date</div>
                  <input required type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <div className="text-[11px] text-muted mb-1">End date</div>
                  <input required type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason (optional)" className={inputClass} />
              <div className="flex gap-2.5 mt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-present border-0 rounded-[10px] py-3 text-sm text-white font-medium cursor-pointer disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Add school closure modal */}
      <Modal open={showClosureForm} onClose={() => setShowClosureForm(false)} title="Add school closure">
            <form onSubmit={handleAddClosure} className="flex flex-col gap-2.5">
              <input required value={closureForm.label}
                onChange={e => setClosureForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Hari Raya Aidilfitri" className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-muted mb-1">Start date</div>
                <input required type="date" value={closureForm.date}
                  onChange={e => setClosureForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <div className="text-[11px] text-muted mb-1">End date</div>
                <input required type="date" value={closureForm.end_date}
                  onChange={e => setClosureForm(f => ({ ...f, end_date: e.target.value }))} className={inputClass} />
              </div>
            </div>
              <div className="bg-absent-bg border border-absent rounded-[10px] px-3.5 py-2.5 text-xs text-absent leading-relaxed">
                On this date the system will NOT mark anyone absent or send notifications.
              </div>
              <div className="flex gap-2.5 mt-1">
                <button type="button" onClick={() => setShowClosureForm(false)}
                  className="flex-1 bg-page border border-border rounded-[10px] py-3 text-sm text-muted cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-present border-0 rounded-[10px] py-3 text-sm text-white font-medium cursor-pointer disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  )
}
