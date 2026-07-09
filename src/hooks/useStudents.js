import { useEffect, useState } from 'react'
import { getStudents } from '../lib/supabase'

// setStudents is returned too since pages apply optimistic local updates
// after add/edit/delete rather than refetching.
export function useStudents(branchId = null) {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStudents(branchId)
      .then(data => { if (!cancelled) setStudents(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [branchId])

  return { students, setStudents, loading }
}
