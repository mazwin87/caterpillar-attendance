import { useEffect, useState } from 'react'
import { getStudents, getBranches } from '../lib/supabase'
import {
  getHolidays, getClosures,
  createHoliday, deleteHoliday,
  createClosure, deleteClosure, deletePastClosures,
} from '../lib/services/holidays.service'
import { getMYT } from '../lib/utils/date'

const today = () => getMYT()

export function useHolidays() {
  const [holidays, setHolidays] = useState([])
  const [closures, setClosures] = useState([])
  const [students, setStudents] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    Promise.all([getHolidays(), getClosures(), getStudents(), getBranches()])
      .then(([h, c, s, b]) => {
        setHolidays(h)
        setStudents(s)
        setBranches(b)

        const pastIds = c.filter(cl => (cl.end_date || cl.date) < today()).map(cl => cl.id)
        setClosures(c.filter(cl => !pastIds.includes(cl.id)))
        deletePastClosures(pastIds).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  function isActive(h) {
    const t = today()
    return h.start_date <= t && t <= h.end_date
  }

  function isUpcoming(c) {
    return c.date >= today()
  }

  async function addHoliday(form) {
    setSaving(true)
    try {
      const h = await createHoliday(form)
      setHolidays(prev => [h, ...prev])
    } finally {
      setSaving(false)
    }
  }

  async function removeHoliday(id) {
    await deleteHoliday(id)
    setHolidays(prev => prev.filter(h => h.id !== id))
  }

  async function addClosure(form) {
    setSaving(true)
    try {
      const c = await createClosure(form)
      setClosures(prev => [c, ...prev])
    } finally {
      setSaving(false)
    }
  }

  async function removeClosure(id) {
    await deleteClosure(id)
    setClosures(prev => prev.filter(c => c.id !== id))
  }

  return {
    holidays, closures, students, branches,
    loading, saving,
    isActive, isUpcoming,
    addHoliday, removeHoliday,
    addClosure, removeClosure,
  }
}
