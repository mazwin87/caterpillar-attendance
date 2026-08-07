import { useState, useEffect } from 'react'
import {
  getDailySummary, getDrilldown, overrideStatus,
  getTodayEvent, markAbsentForEvent, markAllAbsent,
} from '../lib/services/dashboard.service'

export function useDashboard(session) {
  const [summary, setSummary]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeStatus, setActiveStatus]     = useState(null)
  const [activeBranch, setActiveBranch]     = useState(null)
  const [students, setStudents]             = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [overrideStudent, setOverrideStudent] = useState(null)

  useEffect(() => {
    getDailySummary()
      .then(data => {
        if (session?.role === 'teacher' && session?.branch_id) {
          const branchName = session?.branches?.name
          setSummary(data.filter(b => b.branch === branchName))
        } else {
          setSummary(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusClick(status, branchName = null) {
    if (activeStatus === status && activeBranch === branchName) {
      setActiveStatus(null); setActiveBranch(null); setStudents([]); return
    }
    setActiveStatus(status); setActiveBranch(branchName); setLoadingStudents(true)
    const data = await getDrilldown(status, branchName, session)
    setStudents(data)
    setLoadingStudents(false)
  }

  function closeDrilldown() {
    setActiveStatus(null); setActiveBranch(null); setStudents([])
  }

  async function handleOverride(attendanceId, newStatus) {
    try {
      await overrideStatus(attendanceId, newStatus)
      setStudents(prev => prev.map(a =>
        a.id === attendanceId ? { ...a, status: newStatus } : a
      ))
      setOverrideStudent(null)
      getDailySummary().then(setSummary)
    } catch (err) {
      alert(err.message)
    }
  }

  async function runManualAttendance() {
    if (!window.confirm('Mark all unscanned students as absent and send notifications?')) return

    try {
      const todayEvent = await getTodayEvent()

      if (todayEvent) {
        const confirmed = window.confirm(
          `Event detected: "${todayEvent.name}"\n\nOnly students from selected branches and age groups will be marked absent. Continue?`
        )
        if (!confirmed) return
        const { count } = await markAbsentForEvent(todayEvent, session?.id)
        if (count === 0) { alert('No eligible students found for this event.'); return }
        alert(`Done! ${count} students marked absent for "${todayEvent.name}".`)
      } else {
        await markAllAbsent(session?.id)
        alert('Done! Absent students marked and notifications sent.')
      }

      getDailySummary().then(setSummary)
    } catch (err) {
      alert(err.message)
    }
  }

  const totals = summary.reduce((acc, b) => ({
    present: acc.present + (b.present || 0),
    late:    acc.late    + (b.late    || 0),
    absent:  acc.absent  + (b.absent  || 0),
    holiday: acc.holiday + (b.holiday || 0),
    total:   acc.total   + (b.total   || 0),
  }), { present: 0, late: 0, absent: 0, holiday: 0, total: 0 })

  return {
    summary, loading, totals,
    activeStatus, activeBranch, students, loadingStudents,
    overrideStudent, setOverrideStudent,
    handleStatusClick, closeDrilldown, handleOverride, runManualAttendance,
  }
}
