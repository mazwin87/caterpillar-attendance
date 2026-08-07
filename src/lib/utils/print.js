import { MONTHS } from '../constants/months'

export function openPrintWindow(html) {
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
}

// Opens one window containing all receipts separated by page breaks.
// Used by the manual-receipt module for multi-month batch printing.
export function openMultiReceiptPrintWindow(payments, studentName, baseUrl = '') {
  const win = window.open('', '_blank')

  const receiptBodies = payments.map(p => {
    const s = p.students
    const b = s?.branches
    const dateStr = new Date(p.paid_date).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    return `
      <div class="receipt-wrap">
        <div class="header">
          <img src="${baseUrl}/logo.png" class="logo" alt="Logo" />
          <div class="company">
            <h1>Caterpillar Playtime Child Care Centre</h1>
            <p>${b?.reg_no || ''}</p>
            <p>${b?.address || ''}</p>
            <p>📞 ${b?.phone || ''} &nbsp;🌐 ${b?.website || ''} &nbsp;✉️ ${b?.email || ''}</p>
          </div>
          <div class="receipt-no">
            <div class="label">№</div>
            <div class="num">${p.receipt_no?.split('-').pop() || p.receipt_no}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="field"><label>Name:</label><span>${s?.name || ''}</span></div>
          <div class="field"><label>Date:</label><span>${dateStr}</span></div>
        </div>
        <div class="fee-section">
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox checked">✓</div><span>Monthly Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Enrollment Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Transit</span></div>
          </div>
          <div class="months">
            ${MONTHS.map(m => `
              <div class="month-item">
                <div class="box ${m === p.month ? 'checked' : ''}">${m === p.month ? '✓' : ''}</div>
                <div>${m.substring(0, 3)}</div>
              </div>
            `).join('')}
          </div>
          <div class="amount-row"><span>RM</span><span class="amount-line">${parseFloat(p.amount).toFixed(2)}</span></div>
        </div>
        <div class="fee-section other">
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox"></div><span>Learning Materials</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Child Care (Full Day)</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Misc.</span></div>
          </div>
          <div class="fee-row">
            <div class="fee-item"><div class="checkbox"></div><span>Other Fee</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Registration</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Insurance</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Transport</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Uniform</span></div>
          </div>
          <div class="fee-row">
            <div style="width:14px;"></div>
            <div class="fee-item"><div class="checkbox"></div><span>Child Care (Half Day)</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Emergency Child Care</span></div>
            <div class="fee-item"><div class="checkbox"></div><span>Others</span></div>
          </div>
          <div class="amount-row"><span>RM</span><span class="amount-line"></span></div>
        </div>
        <div class="total-section">
          <span class="total-label">TOTAL RM</span>
          <span class="total-line">${parseFloat(p.amount).toFixed(2)}</span>
        </div>
        <div class="footer">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
              <span>Payment Method:</span>
              ${['Bank Transfer','Cheque','Cash'].map(m => `
                <div class="method-opt">
                  <div class="checkbox ${p.payment_method === m ? 'checked' : ''}">${p.payment_method === m ? '✓' : ''}</div>
                  <span>${m}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:6px;font-size:12px;">Date &amp; time: ${dateStr}</div>
            <div class="note">All Fees paid are non refundable / transferable.</div>
          </div>
          <div style="text-align:right;font-style:italic;">
            <div style="margin-bottom:20px;">Issued by</div>
            <div style="border-top:1px solid #999;min-width:120px;padding-top:4px;font-size:11px;">${p.issued_by || 'Admin'}</div>
          </div>
        </div>
      </div>`
  }).join('')

  win.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Receipts — ${studentName || ''}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: #fff; }
      .receipt-wrap { padding: 32px; max-width: 700px; margin: 0 auto; page-break-after: always; }
      .receipt-wrap:last-child { page-break-after: avoid; }
      .header { display: flex; align-items: flex-start; gap: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
      .logo { width: 90px; height: 90px; object-fit: contain; flex-shrink: 0; }
      .company h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; margin-bottom: 4px; }
      .company p { font-size: 11px; color: #333; line-height: 1.6; }
      .receipt-no { margin-left: auto; text-align: right; flex-shrink: 0; }
      .receipt-no .label { font-size: 12px; color: #888; }
      .receipt-no .num { font-size: 28px; font-weight: 700; color: #c0392b; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
      .info-row .field { display: flex; gap: 8px; align-items: center; }
      .info-row .field label { font-weight: 600; }
      .info-row .field span { border-bottom: 1px solid #999; min-width: 200px; padding-bottom: 2px; }
      .fee-section { margin-bottom: 16px; }
      .fee-section.other { border-top: 1px solid #ddd; padding-top: 12px; }
      .fee-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .fee-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
      .checkbox { width: 14px; height: 14px; border: 1.5px solid #333; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .checkbox.checked { background: #1a1a1a; color: #fff; }
      .months { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 12px 0; }
      .month-item { text-align: center; font-size: 11px; }
      .month-item .box { width: 24px; height: 24px; border: 1.5px solid #333; margin: 0 auto 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      .month-item .box.checked { background: #1a1a1a; color: #fff; }
      .amount-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 13px; font-weight: 600; }
      .amount-line { border-bottom: 1px solid #999; min-width: 120px; padding-bottom: 2px; }
      .total-section { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
      .total-label { font-size: 16px; font-weight: 700; }
      .total-line { border-bottom: 2px solid #1a1a1a; min-width: 160px; font-size: 16px; font-weight: 700; padding-bottom: 2px; }
      .footer { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; border-top: 1px solid #ddd; padding-top: 12px; }
      .method-opt { display: flex; align-items: center; gap: 4px; font-size: 12px; }
      .note { font-size: 11px; color: #555; margin-top: 8px; }
      @media print { @page { margin: 10mm; } }
    </style>
  </head>
  <body>${receiptBodies}</body>
  </html>`)

  win.document.close()
  win.onload = () => win.print()
}
