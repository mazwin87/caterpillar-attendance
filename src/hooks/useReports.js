import { useEffect, useState } from 'react'
import { getBranches } from '../lib/supabase'
import { getAttendanceRange } from '../lib/services/reports.service'
import { getMYT, getMYTDaysAgo } from '../lib/utils/date'

const today   = () => getMYT()
const weekAgo = () => getMYTDaysAgo(6)

export function useReports() {
  const [branches, setBranches]         = useState([])
  const [records, setRecords]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [searched, setSearched]         = useState(false)
  const [filterBranch, setFilterBranch] = useState('')
  const [startDate, setStartDate]       = useState(weekAgo)
  const [endDate, setEndDate]           = useState(today)

  useEffect(() => {
    getBranches().then(setBranches)
  }, [])

  async function fetchRecords() {
    setLoading(true)
    setSearched(true)
    try {
      const data = await getAttendanceRange(startDate, endDate, filterBranch || null)
      setRecords(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const grouped = records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  return {
    branches, records, grouped,
    loading, searched,
    filterBranch, setFilterBranch,
    startDate, setStartDate,
    endDate, setEndDate,
    fetchRecords,
  }
}
