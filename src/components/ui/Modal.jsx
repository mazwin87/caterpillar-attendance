import { MdClose } from 'react-icons/md'

// Bottom-sheet on mobile, centered card on desktop — the modal pattern shared
// by every "add/edit X" form across the app.
export default function Modal({ open, onClose, title, subtitle, maxWidthClass = 'lg:max-w-md', children }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className={`w-full bg-surface p-6 pb-20 max-h-[90vh] overflow-y-auto rounded-t-[20px] lg:rounded-2xl ${maxWidthClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="text-lg font-medium text-ink">{title}</div>
            {subtitle && <div className="text-xs text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-0 text-muted cursor-pointer p-0 flex"
          >
            <MdClose size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
