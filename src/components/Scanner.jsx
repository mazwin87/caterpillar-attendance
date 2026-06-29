import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { recordScan, supabase } from '../lib/supabase'

const STATUS_CONFIG = {
  PRESENT: { bg: '#00e67622', icon: '✅', badge: 'bg-[#00e676]/20 text-[#00e676]' },
  LATE:    { bg: '#ffd60022', icon: '⏰', badge: 'bg-[#ffd600]/20 text-[#ffd600]' },
  ERROR:   { bg: '#ff174422', icon: '❌', badge: 'bg-[#ff1744]/20 text-[#ff1744]' },
  DUP:     { bg: '#2979ff22', icon: '🔁', badge: 'bg-[#2979ff]/20 text-[#2979ff]' },
}

// Malaysia is UTC+8 — always derive today's date in local time, not UTC,
// so that 9 AM MYT doesn't silently resolve to the previous UTC day.
function getLocalDateString() {
  const now = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day   = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Scanner({ lang, setLang, t, session }) {
  const [result, setResult]                   = useState(null)
  const [showCard, setShowCard]               = useState(false)
  const [counts, setCounts]                   = useState({ present: 0, late: 0, error: 0 })
  const [mode, setMode]                       = useState('camera')
  const [manualStudents, setManualStudents]   = useState([])
  const [manualSearch, setManualSearch]       = useState('')
  const [marking, setMarking]                 = useState(null)
  const [todayAttendance, setTodayAttendance] = useState({})
  const [filterBranch, setFilterBranch] = useState('')
  const [branches, setBranches]         = useState([])
  const [runningNow, setRunningNow]     = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [cameraError, setCameraError]   = useState(null)

  const processingRef = useRef(false)
  const lastScanned   = useRef(null)
  const timerRef      = useRef(null)
  const scannerRef    = useRef(null)
  const sessionRef    = useRef(session)
  const handleScanRef = useRef(null)

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { handleScanRef.current = handleScan })

  // Load today's counts + attendance map
  useEffect(() => {
    async function loadTodayCounts() {
      const today = getLocalDateString()
      const { data } = await supabase
        .from('attendance')
        .select('status, student_id, students!inner(branch_id)')
        .eq('date', today)
      if (!data) return
      const branchId = sessionRef.current?.branch_id
      const filtered = branchId ? data.filter(a => a.students?.branch_id === branchId) : data
      const present  = filtered.filter(a => a.status === 'PRESENT').length
      const late     = filtered.filter(a => a.status === 'LATE').length
      setCounts(prev => ({ ...prev, present, late }))
      const map = Object.fromEntries(data.map(a => [a.student_id, a.status]))
      setTodayAttendance(map)
    }
    loadTodayCounts()
  }, [])

  // Load students for manual mode
  useEffect(() => {
    async function loadStudents() {
      const branchId = sessionRef.current?.role === 'admin' ? filterBranch : sessionRef.current?.branch_id
      let query = supabase.from('students').select('*, branches(name)').eq('is_active', true).order('name')
      if (branchId) query = query.eq('branch_id', branchId)
      const { data } = await query
      setManualStudents(data || [])
    }
    loadStudents()
  }, [filterBranch])

  // Camera scanner
  useEffect(() => {
    // Guard: getUserMedia requires a secure context (HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not available. Please use HTTPS or a supported browser.')
      return
    }

    const html5Qrcode = new Html5Qrcode('qr-reader-hidden')
    scannerRef.current = html5Qrcode

    const startCamera = async () => {
      // Try rear camera first; fall back to any available camera
      const facingModes = ['environment', 'user']
      for (const facingMode of facingModes) {
        try {
          await html5Qrcode.start(
            { facingMode },
            { fps: 10, qrbox: 250 },
            async (decodedText) => {
              if (handleScanRef.current) await handleScanRef.current(decodedText)
            },
            () => {}
          )
          // Move the internally-created video into the visible container
          // Use a small delay to ensure the video element is rendered by the library
          setTimeout(() => {
            const container = document.getElementById('camera-container')
            if (!container || container.querySelector('video')) return
            const hiddenVideo = document.querySelector('#qr-reader-hidden video')
            if (hiddenVideo) {
              hiddenVideo.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;display:block;z-index:1;'
              container.appendChild(hiddenVideo)
            }
          }, 300)
          setCameraError(null)
          return // success — stop trying
        } catch (err) {
          if (facingMode === 'user') {
            // Both modes failed — surface the error to the user
            const msg = err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : err?.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : `Camera error: ${err?.message || 'Unknown error'}`
            setCameraError(msg)
            console.error('Camera start error:', err)
          }
        }
      }
    }

    startCamera()

    return () => {
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {})
    }
  }, [])

  useEffect(() => {
    async function loadBranches() {
      const { data } = await supabase.from('branches').select('id, name, slug').order('name')
      setBranches(data || [])
    }
    if (sessionRef.current?.role === 'admin') loadBranches()
  }, [])

  async function handleScan(text) {
    if (processingRef.current) return
    let studentId = text
    try {
      const url = new URL(text)
      studentId = url.searchParams.get('id') || text
    } catch {}
    const currentSession = sessionRef.current
    if (currentSession?.role === 'teacher' && currentSession?.branch_id) {
      const { data: student } = await supabase.from('students').select('branch_id').eq('id', studentId).single()
      if (!student || student.branch_id !== currentSession.branch_id) {
        setResult({ success: false, error: 'Student not from your branch' })
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
    setResult(data)
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

  async function runNow() {
    setRunningNow(true)
    setRunResult(null)
    try {
      await supabase.functions.invoke('notify_absent_parents')
    } catch (err) {
      console.warn(err)
    } finally {
      setRunningNow(false)
      setRunResult('✅ Notifications sent!')
      setTimeout(() => setRunResult(null), 3000)
    }
  }

  // Shared helper — upsert attendance and confirm the DB write before updating UI.
  // Uses maybeSingle() (not single()) so that "no existing row" is not treated as an error.
  async function upsertAttendance(student, status) {
    const today = getLocalDateString()

    const { data: existing, error: selectError } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', student.id)
      .eq('date', today)
      .maybeSingle()

    if (selectError) throw new Error(`Lookup failed: ${selectError.message}`)

    if (existing) {
      const { error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existing.id)
      if (error) throw new Error(`Update failed: ${error.message}`)
    } else {
      const { error } = await supabase
        .from('attendance')
        .insert({ student_id: student.id, date: today, status, scanned_at: new Date().toISOString() })
      if (error) throw new Error(`Insert failed: ${error.message}`)
    }
  }

  async function markAttendance(student) {
    if (marking) return
    setMarking(student.id)
    try {
      await upsertAttendance(student, 'PRESENT')
      // Only update UI after DB write is confirmed
      const prev = todayAttendance[student.id]
      setTodayAttendance(p => ({ ...p, [student.id]: 'PRESENT' }))
      setCounts(c => ({
        ...c,
        present: c.present + (prev === 'PRESENT' ? 0 : 1),
        late:    prev === 'LATE' ? c.late - 1 : c.late,
      }))
    } catch (err) {
      console.error('Mark present error:', err.message)
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
      console.error('Mark late error:', err.message)
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
      console.error('Mark absent error:', err.message)
      alert(`Could not save attendance: ${err.message}`)
    } finally {
      setMarking(null)
    }
  }

  function getCardConfig(data) {
    if (!data) return STATUS_CONFIG.ERROR
    if (data.success) return data.status === 'LATE' ? STATUS_CONFIG.LATE : STATUS_CONFIG.PRESENT
    return data.error?.toLowerCase().includes('already') ? STATUS_CONFIG.DUP : STATUS_CONFIG.ERROR
  }

  function getStatusLabel(data) {
    if (!data) return t('status_error')
    if (data.success) return data.status === 'LATE' ? t('status_late') : t('status_present')
    return data.error?.toLowerCase().includes('already') ? t('status_dup') : t('status_error')
  }

  function getSubText(data) {
    if (!data) return ''
    if (data.success) return `${t('time_prefix')} ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    const map = {
      'already recorded today': t('already'),
      'student not found':      t('not_found'),
      'student is on approved holiday': t('holiday'),
    }
    return map[data.error?.toLowerCase()] || data.error || ''
  }

  const cfg = getCardConfig(result)

  const filteredManual = manualStudents.filter(s =>
    s.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
    s.student_no.toLowerCase().includes(manualSearch.toLowerCase())
  )

  // Absent = students with no attendance record or explicitly ABSENT
  const absentCount = manualStudents.filter(s =>
    !todayAttendance[s.id] || todayAttendance[s.id] === 'ABSENT'
  ).length

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: mode === 'camera' ? '#000' : 'var(--bg)' }}>

      <div id="qr-reader-hidden" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '100vw', height: '100vh' }} />
      <div id="camera-container" className="fixed inset-0" style={{ zIndex: mode === 'camera' ? 1 : -1 }} />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 pt-10 pb-4"
        style={{
          zIndex: 20,
          background: mode === 'camera' ? 'linear-gradient(to bottom, rgba(0,0,0,0.75) 60%, transparent)' : 'var(--surface)',
          borderBottom: mode === 'manual' ? '0.5px solid var(--border)' : 'none',
        }}>
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, color: mode === 'camera' ? '#fff' : 'var(--text)' }}>Caterpillar Playtime</div>
            <div style={{ fontSize: 9, color: mode === 'camera' ? '#666' : 'var(--muted)', letterSpacing: '0.1em' }}>ATTENDANCE</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: mode === 'camera' ? 'rgba(0,0,0,0.5)' : 'var(--bg)', borderRadius: 20, overflow: 'hidden', border: `0.5px solid ${mode === 'camera' ? 'rgba(255,255,255,0.15)' : 'var(--border)'}` }}>
            <button onClick={() => setMode('camera')}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: mode === 'camera' ? 500 : 400, cursor: 'pointer', border: 'none', background: mode === 'camera' ? '#4caf87' : 'transparent', color: mode === 'camera' ? '#fff' : '#666' }}>
              📷 Scan
            </button>
            <button onClick={() => setMode('manual')}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: mode === 'manual' ? 500 : 400, cursor: 'pointer', border: 'none', background: mode === 'manual' ? '#4caf87' : 'transparent', color: mode === 'manual' ? '#fff' : mode === 'camera' ? '#777' : 'var(--muted)' }}>
              📋 Manual
            </button>
          </div>
          {/* {mode === 'camera' && (
            <div className="flex bg-black/50 backdrop-blur border border-white/10 rounded-full p-1 gap-1">
              {['en', 'bm'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`font-mono text-[11px] px-3 py-1 rounded-full transition-all ${lang === l ? 'bg-[#00e676] text-black font-semibold' : 'text-[#888]'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          )} */}
        </div>
      </div>

      {/* ── CAMERA MODE UI ── */}
      {mode === 'camera' && (
        <>
          {/* Camera error overlay */}
          {cameraError && (
            <div className="fixed inset-0 flex items-center justify-center px-8" style={{ zIndex: 25, background: 'rgba(0,0,0,0.85)' }}>
              <div style={{ background: '#1a1a1a', border: '0.5px solid #ff1744', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 320 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ff1744', marginBottom: 8 }}>Camera unavailable</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{cameraError}</div>
                <button onClick={() => setMode('manual')}
                  style={{ marginTop: 16, background: '#4caf87', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Switch to Manual
                </button>
              </div>
            </div>
          )}
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {[
              'top-[calc(50%-110px)] left-[calc(50%-110px)] border-t-[3px] border-l-[3px] rounded-tl-lg',
              'top-[calc(50%-110px)] left-[calc(50%+82px)]  border-t-[3px] border-r-[3px] rounded-tr-lg',
              'top-[calc(50%+82px)]  left-[calc(50%-110px)] border-b-[3px] border-l-[3px] rounded-bl-lg',
              'top-[calc(50%+82px)]  left-[calc(50%+82px)]  border-b-[3px] border-r-[3px] rounded-br-lg',
            ].map((cls, i) => <div key={i} className={`absolute w-8 h-8 border-[#00e676] ${cls}`} />)}
            <div className="scan-line absolute left-[calc(50%-108px)] w-[216px] h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #00e676, transparent)' }} />
          </div>

          {!showCard && (
            <div className="fixed pointer-events-none"
              style={{ zIndex: 20, top: 'calc(50% + 128px)', left: '50%', transform: 'translateX(-50%)' }}>
              <div className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
                {t('hint')}
              </div>
            </div>
          )}

          <div className={`fixed inset-x-4 transition-all duration-300 ${showCard ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ bottom: 'calc(var(--navbar-height) + 60px)', zIndex: 30 }}>
            <div className={`rounded-2xl border border-white/10 p-5 backdrop-blur-xl ${showCard ? 'slide-up' : ''}`}
              style={{ background: 'rgba(14,14,14,0.96)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: cfg.bg }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg text-white truncate">{result?.student_name || t('not_found')}</div>
                  <span className={`inline-block font-mono text-[11px] px-3 py-0.5 rounded-full mt-1 tracking-widest ${cfg.badge}`}>
                    {getStatusLabel(result)}
                  </span>
                </div>
              </div>
              <div className="font-mono text-[11px] text-[#555] mt-3 pt-3 border-t border-white/5">
                {getSubText(result)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MANUAL MODE UI ── */}
      {mode === 'manual' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', paddingTop: 90 }}>
         <div style={{ padding: '8px 14px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Branch filter — admin only */}
          {session?.role === 'admin' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                style={{ flex: 1, background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }}>
                <option value="">All branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
              </select>
              <button onClick={runNow} disabled={runningNow}
                style={{ background: runningNow ? 'var(--border)' : 'var(--absent)', color: runningNow ? 'var(--muted)' : '#fff', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 500, cursor: runningNow ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {runningNow ? 'Running...' : '🔔 Notify Absent'}
              </button>
              {runResult && (
                <div style={{ fontSize: 12, color: 'var(--present)', background: 'var(--present-bg)', borderRadius: 8, padding: '6px 12px', marginTop: 4 }}>
                  {runResult}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <input
            value={manualSearch}
            onChange={e => setManualSearch(e.target.value)}
            placeholder="Search name or ID..."
            style={{ width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', paddingBottom: 'calc(var(--navbar-height) + 70px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredManual.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 40 }}>No students found</div>
            ) : filteredManual.map(s => {
              const status    = todayAttendance[s.id]
              const isPresent = status === 'PRESENT'
              const isLate    = status === 'LATE'
              const isHoliday = status === 'HOLIDAY'
              const isAbsent  = status === 'ABSENT'
              const isLoading = marking === s.id || marking === s.id + '_late'

              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 12,
                  background: isPresent ? '#edf7f2' : isLate ? '#fffbe6' : isAbsent ? 'var(--absent-bg)' : isHoliday ? 'var(--holiday-bg)' : 'var(--surface)',
                  border: `0.5px solid ${isPresent ? '#4caf87' : isLate ? '#f0a500' : isAbsent ? 'var(--absent)' : isHoliday ? 'var(--holiday)' : 'var(--border)'}`,
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: isPresent ? '#4caf87' : isLate ? '#f0a500' : isHoliday ? 'var(--holiday)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isPresent || isLate ? 14 : 13, fontWeight: 500, color: '#fff',
                  }}>
                    {isPresent ? '✓' : isLate ? '⏰' : isHoliday ? '🏖' : s.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.student_no} · {s.branches?.name?.replace('Caterpillar Playtime ', '')}</div>
                  </div>
                  {isHoliday ? (
                    <span style={{ fontSize: 10, color: 'var(--holiday)', padding: '3px 8px', background: 'var(--holiday-bg)', borderRadius: 6, border: '0.5px solid var(--holiday)' }}>Holiday</span>
                  ) : isPresent ? (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => markLate(s)} disabled={!!marking}
                        style={{ background: '#d4ede2', color: '#2d7a4f', border: '0.5px solid #4caf87', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id + '_late' ? '...' : '✓ Present'}
                      </button>
                      <button onClick={() => markAbsent(s)} disabled={!!marking}
                        style={{ background: 'var(--absent-bg)', color: 'var(--absent)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id + '_absent' ? '...' : 'Absent'}
                      </button>
                    </div>
                  ) : isLate ? (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => markAttendance(s)} disabled={!!marking}
                        style={{ background: '#fff0b3', color: '#8a6000', border: '0.5px solid #e8c840', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id ? '...' : '⏰ Late'}
                      </button>
                      <button onClick={() => markAbsent(s)} disabled={!!marking}
                        style={{ background: 'var(--absent-bg)', color: 'var(--absent)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id + '_absent' ? '...' : 'Absent'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => markAttendance(s)} disabled={!!marking}
                        style={{ background: '#4caf87', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id ? '...' : 'In'}
                      </button>
                      <button onClick={() => markLate(s)} disabled={!!marking}
                        style={{ background: '#fff8e0', color: '#8a6000', border: '0.5px solid #e8c840', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 500, cursor: 'pointer', opacity: marking ? 0.5 : 1 }}>
                        {marking === s.id + '_late' ? '...' : 'Late'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COUNTER BAR ── */}
      <div className="fixed left-0 right-0 flex justify-center pb-5 pt-4"
        style={{
          bottom: 'var(--navbar-height)', zIndex: 20, gap: mode === 'manual' ? '8vw' : '10vw',
          background: mode === 'camera' ? 'linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)' : 'var(--surface)',
          borderTop: mode === 'manual' ? '0.5px solid var(--border)' : 'none',
        }}>
        {mode === 'camera' ? (
          <>
            {[
              { key: 'present', color: '#00e676', val: counts.present, label: t('present') },
              { key: 'late',    color: '#ffd600', val: counts.late,    label: t('late') },
              { key: 'absent',   color: '#ff1744', val: counts.error,   label: t('absent') },
            ].map(c => (
              <div key={c.key} className="text-center">
                <div className="font-mono text-2xl font-bold" style={{ color: c.color }}>{c.val}</div>
                <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: c.color + '99' }}>{c.label}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { key: 'present', color: '#4caf87',        val: counts.present, label: 'Present' },
              { key: 'late',    color: '#f0a500',        val: counts.late,    label: 'Late' },
              { key: 'absent',  color: 'var(--absent)',  val: absentCount,    label: 'Absent' },
            ].map(c => (
              <div key={c.key} className="text-center">
                <div className="font-mono text-2xl font-bold" style={{ color: c.color }}>{c.val}</div>
                <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: c.color + '99' }}>{c.label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}