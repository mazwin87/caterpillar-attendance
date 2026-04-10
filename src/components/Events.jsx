import { useEffect, useState } from 'react'
import { getBranches, supabase } from '../lib/supabase'

const AGE_GROUPS = ['Infant', 'Toddler', 'Playgroup', 'Preschool']

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

  const inp = {
    style: {
      width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none'
    }
  }

  const branchName = (id) => branches.find(b => b.id === id)?.name?.replace('Caterpillar_', '') || id

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Events</div>
          <button onClick={() => setShowForm(true)}
            style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Event list */}
     <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        onClick={() => setOpenEventMenu(null)}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--present)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 48 }}>No events yet</div>
        ) : events.map(ev => {
            const isOpen = openEventMenu === ev.id
            return (
                <div key={ev.id}
                style={{
                    background: 'var(--surface)',
                    border: `0.5px solid ${isToday(ev) ? 'var(--present)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px',
                }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{ev.name}</div>
                        {isToday(ev) && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)', fontWeight: 500 }}>Today</span>
                        )}
                        {isUpcoming(ev) && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)', fontWeight: 500 }}>Upcoming</span>
                        )}
                        {isPast(ev) && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg)', color: 'var(--muted)' }}>Past</span>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                        {new Date(ev.date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setOpenEventMenu(isOpen ? null : ev.id) }}
                    style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                        flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 8, transition: 'all 0.15s',
                        background: isOpen ? 'var(--border)' : 'var(--bg)',
                        border: '0.5px solid var(--border)',
                        color: isOpen ? 'var(--text)' : 'var(--muted)',
                    }}>
                    Actions
                    </button>
                </div>

                {/* Branches */}
                <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branches</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ev.branches.map(id => (
                        <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--present-bg)', color: 'var(--present)' }}>
                        {branchName(id)}
                        </span>
                    ))}
                    </div>
                </div>

                {/* Age groups */}
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age groups</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ev.age_groups.map(g => (
                        <span key={g} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--holiday-bg)', color: 'var(--holiday)' }}>
                        {g}
                        </span>
                    ))}
                    </div>
                </div>

                {/* Action sheet */}
                {isOpen && (
                    <div style={{ marginTop: 10, borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                    <button onClick={() => handleDelete(ev.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '0.5px solid var(--absent)', background: 'var(--absent-bg)', cursor: 'pointer', fontSize: 13, color: 'var(--absent)', width: '100%' }}>
                        <span style={{ fontSize: 16 }}>🗑️</span> Delete
                    </button>
                    </div>
                )}
                </div>
            )
            })}
      </div>

      {/* Add event modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 80, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Add event</div>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Event name e.g. Sports Day" {...inp} />

              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Date</div>
                <input required type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} {...inp} />
              </div>

              {/* Branch selection */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branches involved</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {branches.map(b => {
                    const selected = form.branches.includes(b.id)
                    return (
                      <button key={b.id} type="button"
                        onClick={() => setForm(f => ({ ...f, branches: toggleItem(f.branches, b.id) }))}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                          background: selected ? 'var(--present)' : 'var(--bg)',
                          color: selected ? '#fff' : 'var(--muted)',
                          border: `0.5px solid ${selected ? 'var(--present)' : 'var(--border)'}`,
                          fontWeight: selected ? 500 : 400,
                        }}>
                        {b.name.replace('Caterpillar_', '')}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Age group selection */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age groups involved</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AGE_GROUPS.map(g => {
                    const selected = form.age_groups.includes(g)
                    return (
                      <button key={g} type="button"
                        onClick={() => setForm(f => ({ ...f, age_groups: toggleItem(f.age_groups, g) }))}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                          background: selected ? 'var(--holiday)' : 'var(--bg)',
                          color: selected ? '#fff' : 'var(--muted)',
                          border: `0.5px solid ${selected ? 'var(--holiday)' : 'var(--border)'}`,
                          fontWeight: selected ? 500 : 400,
                        }}>
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ background: 'var(--holiday-bg)', border: '0.5px solid var(--holiday)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--holiday)', lineHeight: 1.6 }}>
                On event day the scanner will only accept students from selected branches and age groups. The "Run now" button will only mark absent students from these groups.
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}