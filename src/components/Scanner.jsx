import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { recordScan } from '../lib/supabase'

const STATUS_CONFIG = {
  PRESENT: { bg: '#00e67622', icon: '✅', badge: 'bg-[#00e676]/20 text-[#00e676]' },
  LATE:    { bg: '#ffd60022', icon: '⏰', badge: 'bg-[#ffd600]/20 text-[#ffd600]' },
  ERROR:   { bg: '#ff174422', icon: '❌', badge: 'bg-[#ff1744]/20 text-[#ff1744]' },
  DUP:     { bg: '#2979ff22', icon: '🔁', badge: 'bg-[#2979ff]/20 text-[#2979ff]' },
}

export default function Scanner({ lang, setLang, t }) {
  const [result, setResult]     = useState(null)
  const [showCard, setShowCard] = useState(false)
  const [counts, setCounts]     = useState({ present: 0, late: 0, error: 0 })
  const processingRef = useRef(false)
  const lastScanned   = useRef(null)
  const timerRef      = useRef(null)
  const scannerRef    = useRef(null)

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode('qr-reader-hidden')
    scannerRef.current = html5Qrcode

    Html5Qrcode.getCameras().then(cameras => {
      if (!cameras || cameras.length === 0) return

      // prefer back camera
      const camera = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      ) || cameras[cameras.length - 1]

      html5Qrcode.start(
        camera.id,
        { fps: 10, qrbox: 250 },
        async (decodedText) => { await handleScan(decodedText) },
        () => {}
      ).then(() => {
        // Grab the video element html5-qrcode created and move it to our fullscreen container
        const hiddenVideo = document.querySelector('#qr-reader-hidden video')
        const container   = document.getElementById('camera-container')
        if (hiddenVideo && container) {
          hiddenVideo.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `
          container.appendChild(hiddenVideo)
        }
      })
    })

    return () => {
      html5Qrcode.isScanning && html5Qrcode.stop().catch(() => {})
    }
  }, [])

  async function handleScan(text) {
  if (processingRef.current) return

  let studentId = text
  try {
    const url = new URL(text)
    studentId = url.searchParams.get('id') || text
  } catch {}

  // For teachers — verify student belongs to their branch
  if (session?.role === 'teacher' && session?.branch_id) {
    const { data: student } = await supabase
      .from('students')
      .select('branch_id')
      .eq('id', studentId)
      .single()

    if (!student || student.branch_id !== session.branch_id) {
      setResult({ success: false, error: 'Student not from your branch' })
      setShowCard(true)
      return
    }
  } // ← this closing brace was missing

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
      'student not found': t('not_found'),
      'student is on approved holiday': t('holiday'),
    }
    return map[data.error?.toLowerCase()] || data.error || ''
  }

  const cfg = getCardConfig(result)

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">

      {/* Hidden div where html5-qrcode initialises — we steal the video from here */}
      <div id="qr-reader-hidden" style={{ display: 'none' }} />

      {/* Our fullscreen camera container — video gets moved here */}
      <div
        id="camera-container"
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      />

      {/* Viewfinder corners + scan line */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {[
          'top-[calc(50%-110px)] left-[calc(50%-110px)] border-t-[3px] border-l-[3px] rounded-tl-lg',
          'top-[calc(50%-110px)] left-[calc(50%+82px)]  border-t-[3px] border-r-[3px] rounded-tr-lg',
          'top-[calc(50%+82px)]  left-[calc(50%-110px)] border-b-[3px] border-l-[3px] rounded-bl-lg',
          'top-[calc(50%+82px)]  left-[calc(50%+82px)]  border-b-[3px] border-r-[3px] rounded-br-lg',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-8 h-8 border-[#00e676] ${cls}`} />
        ))}
        <div
          className="scan-line absolute left-[calc(50%-108px)] w-[216px] h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #00e676, transparent)' }}
        />
      </div>

      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 pt-10 pb-6"
        style={{ zIndex: 20, background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 60%, transparent)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00e676] rounded-xl flex items-center justify-center text-lg">🐛</div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight">Caterpillar</div>
            <div className="font-mono text-[10px] text-[#777] tracking-widest">ATTENDANCE</div>
          </div>
        </div>
        <div className="flex bg-black/50 backdrop-blur border border-white/10 rounded-full p-1 gap-1">
          {['en', 'bm'].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`font-mono text-[11px] px-3 py-1 rounded-full transition-all
                ${lang === l ? 'bg-[#00e676] text-black font-semibold' : 'text-[#888]'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      {!showCard && (
        <div
          className="fixed pointer-events-none"
          style={{ zIndex: 20, top: 'calc(50% + 128px)', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
            {t('hint')}
          </div>
        </div>
      )}

      {/* Counter bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center gap-10 pb-5 pt-4"
        style={{ zIndex: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)' }}
      >
        {[
          { key: 'present', color: '#00e676', val: counts.present, label: t('present') },
          { key: 'late',    color: '#ffd600', val: counts.late,    label: t('late') },
          { key: 'error',   color: '#ff1744', val: counts.error,   label: t('error') },
        ].map(c => (
          <div key={c.key} className="text-center">
            <div className="font-mono text-2xl font-bold" style={{ color: c.color }}>{c.val}</div>
            <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: c.color + '99' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Result card */}
      <div
        className={`fixed inset-x-4 transition-all duration-300 ${showCard ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ bottom: '80px', zIndex: 30 }}
      >
        <div
          className={`rounded-2xl border border-white/10 p-5 backdrop-blur-xl ${showCard ? 'slide-up' : ''}`}
          style={{ background: 'rgba(14,14,14,0.96)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: cfg.bg }}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-white truncate">
                {result?.student_name || t('not_found')}
              </div>
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

    </div>
  )
}