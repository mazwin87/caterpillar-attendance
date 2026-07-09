import { useEffect, useState } from 'react'
import { getBranches, supabase } from '../lib/supabase'
import { AGE_GROUPS, AGE_GROUP_LABELS } from '../lib/constants'
import { cleanBranchName } from '../lib/branch'
import { CenteredSpinner } from './ui/Spinner'
import Modal from './ui/Modal'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"

const PILL_BASE = "px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-all duration-150 border"
const PILL_VARIANTS = {
  present: {
    selected:   `${PILL_BASE} bg-present text-white border-present font-medium`,
    unselected: `${PILL_BASE} bg-page text-muted border-border font-normal`,
  },
  holiday: {
    selected:   `${PILL_BASE} bg-holiday text-white border-holiday font-medium`,
    unselected: `${PILL_BASE} bg-page text-muted border-border font-normal`,
  },
}

function pillButton(selected, color) {
  return PILL_VARIANTS[color][selected ? 'selected' : 'unselected']
}

export default function Events({ t }) {
  const [events, setEvents]     = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({
    name: '', date: '', branches: [], age_groups: []
  })
  const [openEventMenu, setOpenEventMenu] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*, branches_data:branches').order('date', { ascending: false }),
      getBranches(),
    ]).then(([{ data: e }, b]) => {
      setEvents(e || [])
      setBranches(b)
    }).finally(() => setLoading(false))
  }, [])

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    setEvents(data || [])
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (form.branches.length === 0) { alert('Select at least one branch'); return }
    if (form.age_groups.length === 0) { alert('Select at least one age group'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('events').insert({
        name:       form.name,
        date:       form.date,
        branches:   form.branches,
        age_groups: form.age_groups,
      })
      if (error) throw error
      await fetchEvents()
      setShowForm(false)
      setForm({ name: '', date: '', branches: [], age_groups: [] })
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function toggleItem(arr, item) {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
  }

  const today = new Date().toISOString().split('T')[0]

  const isToday    = e => e.date === today
  const isUpcoming = e => e.date > today
  const isPast     = e => e.date < today

  const branchName = (id) => cleanBranchName(branches.find(b => b.id === id)?.name) || id

  return (
    <div className="min-h-full bg-page pb-20">

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-4 px-5">
       <div className="lg:max-w-5xl lg:mx-auto flex items-center justify-between">
          <div className="text-[22px] font-medium text-ink">Events</div>
          <button onClick={() => setShowForm(true)}
            className="bg-present text-white border-0 rounded-full px-4 py-2 text-[13px] font-medium cursor-pointer">
            + Add
          </button>
       </div>
      </div>

      {/* Event list */}
     <div className="lg:max-w-5xl lg:mx-auto p-4"
        onClick={() => setOpenEventMenu(null)}>
        {loading ? (
          <CenteredSpinner padding={48} />
        ) : events.length === 0 ? (
          <div className="text-center text-muted text-[13px] p-12">No events yet</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {events.map(ev => {
            const isOpen = openEventMenu === ev.id
            return (
                <div key={ev.id}
                className={`bg-surface border rounded-xl p-4 ${isToday(ev) ? 'border-present' : 'border-border'}`}
                onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[15px] font-medium text-ink">{ev.name}</div>
                        {isToday(ev) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-present-bg text-present font-medium">Today</span>
                        )}
                        {isUpcoming(ev) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-holiday-bg text-holiday font-medium">Upcoming</span>
                        )}
                        {isPast(ev) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-page text-muted">Past</span>
                        )}
                    </div>
                    <div className="text-xs text-muted mt-1">
                        {new Date(ev.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setOpenEventMenu(isOpen ? null : ev.id) }}
                    className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 whitespace-nowrap ml-2 transition-all duration-150 border border-border ${
                      isOpen ? 'bg-border text-ink' : 'bg-page text-muted'
                    }`}>
                    Actions
                    </button>
                </div>

                {/* Branches */}
                <div className="mb-1.5">
                    <div className="text-[10px] text-muted mb-1 uppercase tracking-wider">Branches</div>
                    <div className="flex flex-wrap gap-1">
                    {ev.branches.map(id => (
                        <span key={id} className="text-[11px] px-2 py-0.5 rounded-full bg-present-bg text-present">
                        {branchName(id)}
                        </span>
                    ))}
                    </div>
                </div>

                {/* Age groups */}
                <div>
                    <div className="text-[10px] text-muted mb-1 uppercase tracking-wider">Age groups</div>
                    <div className="flex flex-wrap gap-1">
                    {ev.age_groups.map(g => (
                      <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-holiday-bg text-holiday">
                        {AGE_GROUP_LABELS[g] || g}
                      </span>
                    ))}
                    </div>
                </div>

                {/* Action sheet */}
                {isOpen && (
                    <div className="mt-2.5 border-t border-border pt-2.5">
                    <button onClick={() => handleDelete(ev.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-absent bg-absent-bg cursor-pointer text-[13px] text-absent w-full">
                        <span className="text-base">🗑️</span> Delete
                    </button>
                    </div>
                )}
                </div>
            )
            })}
        </div>
        )}
      </div>

      {/* Add event modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add event">
            <form onSubmit={handleAdd} className="flex flex-col gap-3">

              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Event name e.g. Sports Day" className={inputClass} />

              <div>
                <div className="text-[11px] text-muted mb-1">Date</div>
                <input required type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputClass} />
              </div>

              {/* Branch selection */}
              <div>
                <div className="text-[11px] text-muted mb-2 uppercase tracking-wider">Branches involved</div>
                <div className="flex flex-wrap gap-1.5">
                  {branches.map(b => {
                    const selected = form.branches.includes(b.id)
                    return (
                      <button key={b.id} type="button"
                        onClick={() => setForm(f => ({ ...f, branches: toggleItem(f.branches, b.id) }))}
                        className={pillButton(selected, 'present')}>
                        {cleanBranchName(b.name)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Age group selection */}
              <div>
                <div className="text-[11px] text-muted mb-2 uppercase tracking-wider">Age groups involved</div>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_GROUPS.map(g => {
                    const selected = form.age_groups.includes(g)
                    return (
                      <button key={g} type="button"
                        onClick={() => setForm(f => ({ ...f, age_groups: toggleItem(f.age_groups, g) }))}
                        className={pillButton(selected, 'holiday')}>
                        {AGE_GROUP_LABELS[g]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-holiday-bg border border-holiday rounded-[10px] px-3.5 py-2.5 text-xs text-holiday leading-relaxed">
                On event day the scanner will only accept students from selected branches and age groups. The "Run now" button will only mark absent students from these groups.
              </div>

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
    </div>
  )
}
