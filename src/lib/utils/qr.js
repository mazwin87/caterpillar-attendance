import QRCode from 'qrcode'
import { shortBranchName } from '../constants/branches'

export function generateQRDataURL(studentId, opts = {}) {
  return QRCode.toDataURL(studentId, {
    width: 300, margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    ...opts,
  })
}

export function openQRBatchPrint(studentsWithQR) {
  const branchName = studentsWithQR[0]?.branches?.name || ''
  const html = `<html><head><title>${branchName} — QR Codes</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: #fff; }
      .page-header { text-align: center; padding: 14px 20px 10px; border-bottom: 1px solid #eee; margin-bottom: 10px; }
      .page-header h1 { font-size: 16px; font-weight: bold; color: #1a1a1a; }
      .page-header p  { font-size: 10px; color: #888; margin-top: 3px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; padding: 0 8px; }
      .card { border: 0.5px solid #e0e0e0; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; break-inside: avoid; }
      .card img { width: 130px; height: 130px; display: block; margin: 0 auto 8px; }
      .card .name   { font-size: 11px; font-weight: bold; color: #1a1a1a; margin-bottom: 3px; line-height: 1.3; }
      .card .id     { font-size: 10px; color: #444; font-family: monospace; margin-bottom: 2px; }
      .card .branch { font-size: 9px; color: #888; }
      @media print { @page { margin: 6mm; size: A4; } body { print-color-adjust: exact; } .page-header { margin-bottom: 6px; } }
    </style></head><body>
    <div class="page-header">
      <h1>${branchName}</h1>
      <p>Student QR Codes &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; ${studentsWithQR.length} students</p>
    </div>
    <div class="grid">
      ${studentsWithQR.map(s => `
        <div class="card">
          <img src="${s.qrUrl}" alt="QR" />
          <div class="name">${s.name}</div>
          <div class="id">${s.student_no}</div>
          <div class="branch">${shortBranchName(s.branches?.name)}</div>
        </div>`).join('')}
    </div></body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
}
