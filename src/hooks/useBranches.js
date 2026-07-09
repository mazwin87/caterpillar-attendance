import { useEffect, useState } from 'react'
import { getBranches } from '../lib/supabase'

export function useBranches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    getBranches()
      .then(data => { if (!cancelled) setBranches(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { branches, loading }
}
