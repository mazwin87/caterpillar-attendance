export default function Modal({ onClose, children, variant = 'bottom' }) {
  const isCenter = variant === 'center'
  const isPanel  = variant === 'panel'
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: isCenter ? 'center' : isPanel ? 'stretch' : 'flex-end',
        justifyContent: isCenter ? 'center' : isPanel ? 'flex-end' : undefined,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: isPanel ? 480 : '100%',
          maxWidth: isCenter ? 480 : undefined,
          background: 'var(--surface)',
          borderRadius: isPanel ? 0 : isCenter ? 16 : '20px 20px 0 0',
          borderLeft: isPanel ? '0.5px solid var(--border)' : undefined,
          boxShadow: isPanel ? '-8px 0 32px rgba(0,0,0,0.12)' : undefined,
          paddingTop: 24, paddingLeft: 24, paddingRight: 24,
          paddingBottom: isPanel ? 32 : isCenter ? 24 : 100,
          height: isPanel ? '100%' : undefined,
          maxHeight: isPanel ? undefined : '90vh',
          overflowY: 'auto',
          margin: isCenter ? 16 : undefined,
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
