export default function QRModal({ student, qrDataUrl, onClose }) {
  if (!student) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
      onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 w-full max-w-[300px] text-center"
        onClick={e => e.stopPropagation()}>
        <div className="text-base font-medium text-ink mb-0.5">{student.name}</div>
        <div className="text-xs text-muted mb-5">{student.student_no}</div>
        {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-[200px] h-[200px] rounded-lg border border-border mb-5 mx-auto" />}
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 bg-page border border-border rounded-[10px] py-2.5 text-sm text-muted cursor-pointer">Close</button>
          <a href={qrDataUrl} download={`${student.student_no}-qr.png`}
            className="flex-1 bg-present rounded-[10px] py-2.5 text-sm text-white font-medium text-center no-underline block">
            Download
          </a>
        </div>
      </div>
    </div>
  )
}
