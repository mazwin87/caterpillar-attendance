import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const STATUS_CONFIG = {
  PRESENT: { bg: '#00e67622', icon: '✅', badge: 'bg-[#00e676]/20 text-[#00e676]' },
  LATE:    { bg: '#ffd60022', icon: '⏰', badge: 'bg-[#ffd600]/20 text-[#ffd600]' },
  ERROR:   { bg: '#ff174422', icon: '❌', badge: 'bg-[#ff1744]/20 text-[#ff1744]' },
  DUP:     { bg: '#2979ff22', icon: '🔁', badge: 'bg-[#2979ff]/20 text-[#2979ff]' },
}

function getCardConfig(data) {
  if (!data) return STATUS_CONFIG.ERROR
  if (data.success) return data.status === 'LATE' ? STATUS_CONFIG.LATE : STATUS_CONFIG.PRESENT
  return data.error?.toLowerCase().includes('already') ? STATUS_CONFIG.DUP : STATUS_CONFIG.ERROR
}

function getStatusLabel(data, t) {
  if (!data) return t('status_error')
  if (data.success) return data.status === 'LATE' ? t('status_late') : t('status_present')
  return data.error?.toLowerCase().includes('already') ? t('status_dup') : t('status_error')
}

function getSubText(data, t) {
  if (!data) return ''
  if (data.success) return `${t('time_prefix')} ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  const map = {
    'already recorded today':         t('already'),
    'student not found':              t('not_found'),
    'student is on approved holiday': t('holiday'),
  }
  return map[data.error?.toLowerCase()] || data.error || ''
}

// handleScanRef is a ref (from useAttendance) so camera callback never captures a stale closure.
export default function ScannerCamera({ handleScanRef, showCard, scanResult, onCameraError, onSwitchToManual, t }) {
  const [cameraError, setCameraError] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera not available. Please use HTTPS or a supported browser.'
      setCameraError(msg)
      onCameraError?.(msg)
      return
    }

    const html5Qrcode = new Html5Qrcode('qr-reader-hidden')
    scannerRef.current = html5Qrcode

    const startCamera = async () => {
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
          return
        } catch (err) {
          if (facingMode === 'user') {
            const msg = err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : err?.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : `Camera error: ${err?.message || 'Unknown error'}`
            setCameraError(msg)
            onCameraError?.(msg)
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

  const cfg = getCardConfig(scanResult)

  return (
    <>
      {cameraError && (
        <div className="fixed inset-0 flex items-center justify-center px-8" style={{ zIndex: 25, background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ background: '#1a1a1a', border: '0.5px solid #ff1744', borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#ff1744', marginBottom: 8 }}>Camera unavailable</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{cameraError}</div>
            <button
              onClick={onSwitchToManual}
              style={{ marginTop: 16, background: '#4caf87', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Switch to Manual
            </button>
          </div>
        </div>
      )}

      {/* QR bracket overlay */}
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

      {/* Hint text */}
      {!showCard && (
        <div className="fixed pointer-events-none"
          style={{ zIndex: 20, top: 'calc(50% + 128px)', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full whitespace-nowrap">
            {t('hint')}
          </div>
        </div>
      )}

      {/* Scan result card */}
      <div className={`fixed inset-x-4 transition-all duration-300 ${showCard ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ bottom: 'calc(var(--navbar-height) + 60px)', zIndex: 30 }}>
        <div className={`rounded-2xl border border-white/10 p-5 backdrop-blur-xl ${showCard ? 'slide-up' : ''}`}
          style={{ background: 'rgba(14,14,14,0.96)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: cfg.bg }}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-white truncate">{scanResult?.student_name || t('not_found')}</div>
              <span className={`inline-block font-mono text-[11px] px-3 py-0.5 rounded-full mt-1 tracking-widest ${cfg.badge}`}>
                {getStatusLabel(scanResult, t)}
              </span>
            </div>
          </div>
          <div className="font-mono text-[11px] text-[#555] mt-3 pt-3 border-t border-white/5">
            {getSubText(scanResult, t)}
          </div>
        </div>
      </div>
    </>
  )
}
