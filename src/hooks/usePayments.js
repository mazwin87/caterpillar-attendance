import { useEffect, useState } from 'react'
import { getPayments } from '../lib/supabase'

export function usePayments(branchId = null) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPayments(branchId)
      .then(data => { if (!cancelled) setPayments(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [branchId])

  return { payments, setPayments, loading }
}
