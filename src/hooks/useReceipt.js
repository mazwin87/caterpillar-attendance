import { useEffect, useState } from 'react'
import { getReceiptById } from '../lib/services/receipts.service'

export function useReceipt(id) {
  const [payment, setPayment]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getReceiptById(id)
      .then(setPayment)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return { payment, loading, notFound }
}
