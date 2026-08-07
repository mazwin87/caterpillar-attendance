export default function AttendanceCounts({ counts, absentCount, mode, t }) {
  const cameraItems = [
    { key: 'present', color: '#00e676', val: counts.present, label: t('present') },
    { key: 'late',    color: '#ffd600', val: counts.late,    label: t('late') },
    { key: 'absent',  color: '#ff1744', val: counts.error,   label: t('absent') },
  ]
  const manualItems = [
    { key: 'present', color: '#4caf87',       val: counts.present, label: 'Present' },
    { key: 'late',    color: '#f0a500',        val: counts.late,    label: 'Late' },
    { key: 'absent',  color: 'var(--absent)',  val: absentCount,    label: 'Absent' },
  ]
  const items = mode === 'camera' ? cameraItems : manualItems

  return (
    <div
      className="fixed left-0 right-0 flex justify-center pb-5 pt-4"
      style={{
        bottom: 'var(--navbar-height)', zIndex: 20,
        gap: mode === 'manual' ? '8vw' : '10vw',
        background: mode === 'camera' ? 'linear-gradient(to top, rgba(0,0,0,0.85) 60%, transparent)' : 'var(--surface)',
        borderTop: mode === 'manual' ? '0.5px solid var(--border)' : 'none',
      }}
    >
      {items.map(c => (
        <div key={c.key} className="text-center">
          <div className="font-mono text-2xl font-bold" style={{ color: c.color }}>{c.val}</div>
          <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: c.color + '99' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}
