import { AGE_GROUP_LABELS } from '../../lib/constants'
import { cleanBranchName } from '../../lib/branch'

export default function StudentCard({ student: s, isOpen, onToggleMenu, onCopyTelegram, onOpenQR, onOpenEdit, onDelete }) {
  const ageLabel = AGE_GROUP_LABELS[s.age_group] || s.age_group
  const tgLinked = s.parents?.telegram_chat_id

  return (
    <div
      className="bg-surface border border-border rounded-xl px-3.5 py-3"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-full bg-present-bg flex items-center justify-center text-sm font-medium text-present flex-shrink-0">
          {s.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink overflow-hidden text-ellipsis whitespace-nowrap">{s.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${tgLinked ? 'bg-present-bg text-present' : 'bg-absent-bg text-absent'}`}>
              {tgLinked ? '● Linked' : '○ Unlinked'}
            </span>
            <span className="text-[11px] text-muted">
              {s.student_no} · {cleanBranchName(s.branches?.name)}
            </span>
            {ageLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-holiday-bg text-holiday font-medium flex-shrink-0">
                {ageLabel}
              </span>
            )}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleMenu(s.id) }}
          className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 whitespace-nowrap border border-border ${
            isOpen ? 'bg-border text-ink' : 'bg-page text-muted'
          }`}>
          Actions
        </button>
      </div>

      {isOpen && (
        <div className="mt-2.5 border-t border-border pt-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onCopyTelegram(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-page cursor-pointer text-[13px] text-ink">
              <span className="text-base">📱</span> Telegram
            </button>
            <button onClick={() => onOpenQR(s)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-page cursor-pointer text-[13px] text-ink">
              <span className="text-base">🔲</span> View QR
            </button>
            <button onClick={() => onOpenEdit(s)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-page cursor-pointer text-[13px] text-ink">
              <span className="text-base">✏️</span> Edit
            </button>
            <button onClick={() => onDelete(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-absent bg-absent-bg cursor-pointer text-[13px] text-absent">
              <span className="text-base">🗑️</span> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
