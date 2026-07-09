import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { recordScan, supabase } from '../lib/supabase'
import { cleanBranchName } from '../lib/branch'

const STATUS_CONFIG = {
  PRESENT: { bg: '#00e67622', icon: '✅', badge: 'bg-[#00e676]/20 text-[#00e676]' },
  LATE:    { bg: '#ffd60022', icon: '⏰', badge: 'bg-[#ffd600]/20 text-[#ffd600]' },
  ERROR:   { bg: '#ff174422', icon: '❌', badge: 'bg-[#ff1744]/20 text-[#ff1744]' },
  DUP:     { bg: '#2979ff22', icon: '🔁', badge: 'bg-[#2979ff]/20 text-[#2979ff]' },
}

// Static Tailwind classes for the manual attendance row states.
const ROW_CLASSES = {
  PRESENT: 'bg-present-bg border-present',
  LATE:    'bg-late-bg border-late',
  ABSENT:  'bg-absent-bg border-absent',
  HOLIDAY: 'bg-holiday-bg border-holiday',
  DEFAULT: 'bg-surface border-border',
}
const AVATAR_CLASSES = {
  PRESENT: 'bg-present',
  LATE:    'bg-late',
  HOLIDAY: 'bg-holiday',
  DEFAULT: 'bg-border',
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
      await supabase.rpc('run_daily_absent_marking')
      await supabase.functions.invoke('notify_absent_parents')
    } catch (err) {
      console.warn(err)
    } finally {
      setRunningNow(false)
      setRunResult('✅ Absent marked & notifications sent!')
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
        .insert({ student_id: student.id, branch_id: student.branch_id, date: today, status, scanned_at: new Date().toISOString() })
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
    <div className={`fixed inset-0 overflow-hidden ${mode === 'camera' ? 'bg-black' : 'bg-page'}`}>

      <div id="qr-reader-hidden" className="fixed -top-[9999px] -left-[9999px] w-screen h-screen" />
      <div id="camera-container" className={`fixed inset-0 ${mode === 'camera' ? 'z-[1]' : '-z-[1]'}`} />

      {/* ── HEADER ── */}
      <div className={`fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-10 pb-4 ${
          mode === 'manual' ? 'bg-surface border-b border-border' : ''
        }`}
        style={mode === 'camera' ? { background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 60%, transparent)' } : undefined}>
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" className="w-[34px] h-[34px] object-contain" />
          <div>
            <div className={`font-medium text-[13px] ${mode === 'camera' ? 'text-white' : 'text-ink'}`}>Caterpillar Playtime</div>
            <div className={`text-[9px] tracking-widest ${mode === 'camera' ? 'text-[#666]' : 'text-muted'}`}>ATTENDANCE</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className={`flex rounded-full overflow-hidden border ${
              mode === 'camera' ? 'bg-black/50 border-white/15' : 'bg-page border-border'
            }`}>
            <button onClick={() => setMode('camera')}
              className={`px-3 py-1.5 text-[11px] cursor-pointer border-0 ${
                mode === 'camera' ? 'font-medium bg-present text-white' : 'font-normal bg-transparent text-[#666]'
              }`}>
              📷 Scan
            </button>
            <button onClick={() => setMode('manual')}
              className={`px-3 py-1.5 text-[11px] cursor-pointer border-0 ${
                mode === 'manual' ? 'font-medium bg-present text-white' : `font-normal bg-transparent ${mode === 'camera' ? 'text-[#777]' : 'text-muted'}`
              }`}>
              📋 Manual
            </button>
          </div>
        </div>
      </div>

      {/* ── CAMERA MODE UI ── */}
      {mode === 'camera' && (
        <>
          {/* Camera error overlay */}
          {cameraError && (
            <div className="fixed inset-0 z-25 flex items-center justify-center px-8 bg-black/85">
              <div className="bg-[#1a1a1a] border border-[#ff1744] rounded-2xl p-6 text-center max-w-[320px]">
                <div className="text-3xl mb-3">📷</div>
                <div className="text-sm font-medium text-[#ff1744] mb-2">Camera unavailable</div>
                <div className="text-xs text-[#888] leading-relaxed">{cameraError}</div>
                <button onClick={() => setMode('manual')}
                  className="mt-4 bg-present text-white border-0 rounded-[10px] px-6 py-2.5 text-[13px] font-medium cursor-pointer">
                  Switch to Manual
                </button>
              </div>
            </div>
          )}
          <div className="fixed inset-0 pointer-events-none z-10">
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
            <div className="fixed pointer-events-none z-20 top-[calc(50%+128px)] left-1/2 -translate-x-1/2">
              <div className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
                {t('hint')}
              </div>
            </div>
          )}

          <div className={`fixed inset-x-4 z-30 transition-all duration-300 ${showCard ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ bottom: 'calc(var(--navbar-height) + 60px)' }}>
            <div className={`rounded-2xl border border-white/10 p-5 backdrop-blur-xl bg-[rgba(14,14,14,0.96)] ${showCard ? 'slide-up' : ''}`}>
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
        <div className="fixed inset-0 flex flex-col pt-[90px]">
         <div className="px-3.5 py-2 bg-surface border-b border-border flex flex-col gap-2">
          {/* Branch filter — admin only */}
          {session?.role === 'admin' && (
            <div className="flex gap-2">
              <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                className="flex-1 bg-page border border-border rounded-[10px] px-3 py-2 text-[13px] text-ink outline-none">
                <option value="">All branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.slug}</option>)}
              </select>
              <button onClick={runNow} disabled={runningNow}
                className={`text-white border-0 rounded-[10px] px-3.5 py-2 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                  runningNow ? 'bg-border text-muted cursor-not-allowed' : 'bg-absent cursor-pointer'
                }`}>
                {runningNow ? 'Running...' : '🔔 Notify Absent'}
              </button>
              {runResult && (
                <div className="text-xs text-present bg-present-bg rounded-lg px-3 py-1.5 mt-1">
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
            className="w-full box-border bg-page border border-border rounded-[10px] px-3.5 py-2.5 text-sm text-ink outline-none"
          />
        </div>

          <div className="flex-1 overflow-y-auto px-3.5 py-2.5 flex flex-col gap-1.5" style={{ paddingBottom: 'calc(var(--navbar-height) + 70px)' }}>
            {filteredManual.length === 0 ? (
              <div className="text-center text-muted text-[13px] p-10">No students found</div>
            ) : filteredManual.map(s => {
              const status    = todayAttendance[s.id]
              const isPresent = status === 'PRESENT'
              const isLate    = status === 'LATE'
              const isHoliday = status === 'HOLIDAY'
              const isAbsent  = status === 'ABSENT'
              const isLoading = marking === s.id || marking === s.id + '_late'
              const rowCls    = ROW_CLASSES[status] || ROW_CLASSES.DEFAULT
              const avatarCls = AVATAR_CLASSES[status] || AVATAR_CLASSES.DEFAULT

              return (
                <div key={s.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${rowCls} ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
                  <div className={`w-[34px] h-[34px] rounded-full flex-shrink-0 flex items-center justify-center font-medium text-white ${avatarCls} ${isPresent || isLate ? 'text-sm' : 'text-[13px]'}`}>
                    {isPresent ? '✓' : isLate ? '⏰' : isHoliday ? '🏖' : s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis">{s.name}</div>
                    <div className="text-[10px] text-muted">{s.student_no} · {cleanBranchName(s.branches?.name)}</div>
                  </div>
                  {isHoliday ? (
                    <span className="text-[10px] text-holiday px-2 py-1 bg-holiday-bg rounded-md border border-holiday">Holiday</span>
                  ) : isPresent ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => markLate(s)} disabled={!!marking}
                        className="bg-present-bg text-present border border-present rounded-lg px-2.5 py-1 text-[11px] font-medium cursor-pointer disabled:opacity-50">
                        {marking === s.id + '_late' ? '...' : '✓ Present'}
                      </button>
                      <button onClick={() => markAbsent(s)} disabled={!!marking}
                        className="bg-absent-bg text-absent border border-absent rounded-lg px-2 py-1 text-[10px] font-medium cursor-pointer disabled:opacity-50">
                        {marking === s.id + '_absent' ? '...' : 'Absent'}
                      </button>
                    </div>
                  ) : isLate ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => markAttendance(s)} disabled={!!marking}
                        className="bg-late-bg text-late border border-late rounded-lg px-2.5 py-1 text-[11px] font-medium cursor-pointer disabled:opacity-50">
                        {marking === s.id ? '...' : '⏰ Late'}
                      </button>
                      <button onClick={() => markAbsent(s)} disabled={!!marking}
                        className="bg-absent-bg text-absent border border-absent rounded-lg px-2 py-1 text-[10px] font-medium cursor-pointer disabled:opacity-50">
                        {marking === s.id + '_absent' ? '...' : 'Absent'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => markAttendance(s)} disabled={!!marking}
                        className="bg-present text-white border-0 rounded-[7px] px-2.5 py-1.5 text-[11px] font-medium cursor-pointer disabled:opacity-50">
                        {marking === s.id ? '...' : 'In'}
                      </button>
                      <button onClick={() => markLate(s)} disabled={!!marking}
                        className="bg-late-bg text-late border border-late rounded-[7px] px-2.5 py-1.5 text-[11px] font-medium cursor-pointer disabled:opacity-50">
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
      <div className={`fixed left-0 right-0 z-20 flex justify-center pb-5 pt-4 ${
          mode === 'manual' ? 'bg-surface border-t border-border' : ''
        }`}
        style={{
          bottom: 'var(--navbar-height)', gap: mode === 'manual' ? '8vw' : '10vw',
          background: mode === 'camera' ? 'linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)' : undefined,
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
              { key: 'present', color: 'var(--present)',        val: counts.present, label: 'Present' },
              { key: 'late',    color: 'var(--late)',        val: counts.late,    label: 'Late' },
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
    </div>
  )
}
