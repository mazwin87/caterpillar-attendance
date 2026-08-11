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
  const [reportType, setReportType]     = useState('attendance-log')

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

  // Single source — used by Slot A metric cards and future Slot C charts
  const total   = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const late    = records.filter(r => r.status === 'LATE').length
  const absent  = records.filter(r => r.status === 'ABSENT').length
  const holiday = records.filter(r => r.status === 'HOLIDAY').length
  const pct     = n => total > 0 ? Math.round((n / total) * 100) : 0

  const metrics = {
    total,
    present,  presentPct:  pct(present),
    late,     latePct:     pct(late),
    absent,   absentPct:   pct(absent),
    holiday,  holidayPct:  pct(holiday),
  }

  return {
    branches, records, grouped,
    loading, searched,
    filterBranch, setFilterBranch,
    startDate, setStartDate,
    endDate, setEndDate,
    reportType, setReportType,
    metrics,
    fetchRecords,
  }
}
