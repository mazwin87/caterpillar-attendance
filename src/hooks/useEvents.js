import { useEffect, useState } from 'react'
import { getEvents, createEvent, deleteEvent, getBranches } from '../lib/services/events.service'
import { getMYT } from '../lib/utils/date'

export function useEvents() {
  const [events, setEvents]     = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    Promise.all([getEvents(), getBranches()])
      .then(([e, b]) => { setEvents(e); setBranches(b) })
      .finally(() => setLoading(false))
  }, [])

  const today = getMYT()

  function isToday(ev)    { return ev.date === today }
  function isUpcoming(ev) { return ev.date > today }
  function isPast(ev)     { return ev.date < today }

  async function addEvent(form) {
    setSaving(true)
    try {
      const ev = await createEvent(form)
      setEvents(prev => [ev, ...prev])
    } finally {
      setSaving(false)
    }
  }

  async function removeEvent(id) {
    if (!window.confirm('Delete this event?')) return
    await deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return {
    events, branches, loading, saving,
    isToday, isUpcoming, isPast,
    addEvent, removeEvent,
  }
}
