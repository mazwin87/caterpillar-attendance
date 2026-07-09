export default function Spinner({ size = 24, color = 'var(--present)' }) {
  return (
    <div
      className="rounded-full border-2 border-border animate-[spin_0.8s_linear_infinite]"
      style={{ width: size, height: size, borderTopColor: color }}
    />
  )
}

export function CenteredSpinner({ padding = 48, size, color }) {
  return (
    <div className="flex justify-center" style={{ padding }}>
      <Spinner size={size} color={color} />
    </div>
  )
}
