export default function SplitPane({ left, right, leftWidth = 420 }) {
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{
        width: leftWidth, flexShrink: 0, overflowY: 'auto',
        borderRight: '0.5px solid var(--border)', padding: 24,
      }}>
        {left}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {right}
      </div>
    </div>
  )
}
