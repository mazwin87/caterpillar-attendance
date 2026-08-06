export default function Modal({ onClose, children, variant = 'bottom' }) {
  const isCenter = variant === 'center'
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: isCenter ? 'center' : 'flex-end',
        justifyContent: isCenter ? 'center' : undefined,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isCenter ? 480 : undefined,
          background: 'var(--surface)',
          borderRadius: isCenter ? 16 : '20px 20px 0 0',
          paddingTop: 24, paddingLeft: 24, paddingRight: 24,
          paddingBottom: isCenter ? 24 : 100,
          maxHeight: '90vh',
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
