import { useEffect, useRef, useState } from 'react'
import {
  recordScan, verifyStudentBranch,
  getTodayCounts, getStudentsForBranch,
  upsertAttendance, runAbsentMarking,
  getScannerBranches,
} from '../lib/services/attendance.service'

export function useAttendance(session) {
  const [counts, setCounts]               = useState({ present: 0, late: 0, error: 0 })
  const [todayAttendance, setTodayAttendance] = useState({})
  const [manualStudents, setManualStudents]   = useState([])
  const [branches, setBranches]           = useState([])
  const [filterBranch, setFilterBranch]   = useState('')
  const [marking, setMarking]             = useState(null)
  const [runningNow, setRunningNow]       = useState(false)
  const [runResult, setRunResult]         = useState(null)
  const [scanResult, setScanResult]       = useState(null)
  const [showCard, setShowCard]           = useState(false)

  const processingRef  = useRef(false)
  const lastScanned    = useRef(null)
  const timerRef       = useRef(null)
  const sessionRef     = useRef(session)
  const handleScanRef  = useRef(null)

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { handleScanRef.current = handleScan })

  useEffect(() => {
    getTodayCounts(session?.branch_id).then(({ present, late, todayMap }) => {
      setCounts(c => ({ ...c, present, late }))
      setTodayAttendance(todayMap)
    })
  }, [])

  useEffect(() => {
    const branchId = session?.role === 'admin' ? filterBranch : session?.branch_id
    getStudentsForBranch(branchId).then(setManualStudents)
  }, [filterBranch])

  useEffect(() => {
    if (session?.role === 'admin') getScannerBranches().then(setBranches)
  }, [])

  async function handleScan(text) {
    if (processingRef.current) return
    let studentId = text
    try { const url = new URL(text); studentId = url.searchParams.get('id') || text } catch {}

    const currentSession = sessionRef.current
    if (currentSession?.role === 'teacher' && currentSession?.branch_id) {
      const valid = await verifyStudentBranch(studentId, currentSession.branch_id)
      if (!valid) {
        setScanResult({ success: false, error: 'Student not from your branch' })
        setShowCard(true)
        return
      }
    }

    if (studentId === lastScanned.current) return
    lastScanned.current = studentId
    setTimeout(() => { lastScanned.current = null }, 3000)

    processingRef.current = true
    if (navigator.vibrate) navigator.vibrate(40)

    const data = await recordScan(studentId)
    setScanResult(data)
    setShowCard(true)

    if (data.success) {
      const key = data.status === 'LATE' ? 'late' : 'present'
      setCounts(c => ({ ...c, [key]: c[key] + 1 }))
      setTodayAttendance(prev => ({ ...prev, [studentId]: data.status }))
    } else {
      if (!data.error?.toLowerCase().includes('already')) {
        setCounts(c => ({ ...c, error: c.error + 1 }))
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShowCard(false)
      setTimeout(() => { processingRef.current = false }, 300)
    }, 2500)
  }

  async function markAttendance(student) {
    if (marking) return
    setMarking(student.id)
    try {
      await upsertAttendance(student, 'PRESENT')
      const prev = todayAttendance[student.id]
      setTodayAttendance(p => ({ ...p, [student.id]: 'PRESENT' }))
      setCounts(c => ({
        ...c,
        present: c.present + (prev === 'PRESENT' ? 0 : 1),
        late:    prev === 'LATE' ? c.late - 1 : c.late,
      }))
    } catch (err) {
      alert(`Could not save attendance: ${err.message}`)
    } finally {
      setMarking(null)
    }
  }

  async function markLate(student) {
    if (marking) return
    setMarking(student.id + '_late')
    try {
      await upsertAttendance(student, 'LATE')
      const prev = todayAttendance[student.id]
      setTodayAttendance(p => ({ ...p, [student.id]: 'LATE' }))
      setCounts(c => ({
        ...c,
        late:    c.late + (prev === 'LATE' ? 0 : 1),
        present: prev === 'PRESENT' ? c.present - 1 : c.present,
      }))
    } catch (err) {
      alert(`Could not save attendance: ${err.message}`)
    } finally {
      setMarking(null)
    }
  }

  async function markAbsent(student) {
    if (marking) return
    setMarking(student.id + '_absent')
    try {
      await upsertAttendance(student, 'ABSENT')
      const prev = todayAttendance[student.id]
      setTodayAttendance(p => ({ ...p, [student.id]: 'ABSENT' }))
      setCounts(c => ({
        ...c,
        present: prev === 'PRESENT' ? c.present - 1 : c.present,
        late:    prev === 'LATE'    ? c.late - 1    : c.late,
      }))
    } catch (err) {
      alert(`Could not save attendance: ${err.message}`)
    } finally {
      setMarking(null)
    }
  }

  async function runNow() {
    setRunningNow(true)
    setRunResult(null)
    try {
      await runAbsentMarking()
    } catch (err) {
      console.warn(err)
    } finally {
      setRunningNow(false)
      setRunResult('✅ Absent marked & notifications sent!')
      setTimeout(() => setRunResult(null), 3000)
    }
  }

  const absentCount = manualStudents.filter(s =>
    !todayAttendance[s.id] || todayAttendance[s.id] === 'ABSENT'
  ).length

  return {
    counts, todayAttendance, manualStudents, branches,
    filterBranch, setFilterBranch,
    marking, runningNow, runResult,
    scanResult, showCard,
    handleScanRef,
    markAttendance, markLate, markAbsent, runNow,
    absentCount,
  }
}
