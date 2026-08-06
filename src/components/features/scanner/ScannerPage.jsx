import { useState } from 'react'
import { useAttendance } from '../../../hooks/useAttendance'
import ScannerCamera from './ScannerCamera'
import AttendanceCounts from './AttendanceCounts'
import AdminScannerControls from './AdminScannerControls'
import ManualAttendanceList from './ManualAttendanceList'

export default function ScannerPage({ lang, setLang, t, session }) {
  const [mode, setMode] = useState('camera')
  const att = useAttendance(session)

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: mode === 'camera' ? '#000' : 'var(--bg)' }}>

      {/* Hidden QR reader + camera mount point */}
      <div id="qr-reader-hidden" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '100vw', height: '100vh' }} />
      <div id="camera-container" className="fixed inset-0" style={{ zIndex: mode === 'camera' ? 1 : -1 }} />

      {/* Header */}
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
      </div>

      {/* Camera mode */}
      {mode === 'camera' && (
        <ScannerCamera
          handleScanRef={att.handleScanRef}
          showCard={att.showCard}
          scanResult={att.scanResult}
          onSwitchToManual={() => setMode('manual')}
          t={t}
        />
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', paddingTop: 90 }}>
          <div style={{ padding: '8px 14px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {session?.role === 'admin' && (
              <AdminScannerControls
                branches={att.branches}
                filterBranch={att.filterBranch}
                onBranchChange={att.setFilterBranch}
                runningNow={att.runningNow}
                runResult={att.runResult}
                onRunNow={att.runNow}
              />
            )}
          </div>
          <ManualAttendanceList
            students={att.manualStudents}
            todayAttendance={att.todayAttendance}
            marking={att.marking}
            onMarkPresent={att.markAttendance}
            onMarkLate={att.markLate}
            onMarkAbsent={att.markAbsent}
          />
        </div>
      )}

      <AttendanceCounts
        counts={att.counts}
        absentCount={att.absentCount}
        mode={mode}
        t={t}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
