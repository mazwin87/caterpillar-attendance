import { supabase } from '../supabase'
import { MONTHS } from '../constants/months'

// Bot token is duplicated from fees.service.js — both move server-side in the telegram module refactor
const BOT_TOKEN      = '8728256755:AAHlNR5j7UlZqi-y4IomHu2pD0kSrBLyZuY'
const RECEIPT_ORIGIN = 'https://nimonimo.tech'

export async function sendTelegramMultiReceipt({ payments, student, paymentMethod, paidDate }) {
  const { data: parent, error } = await supabase
    .from('parents')
    .select('telegram_chat_id, name')
    .eq('student_id', student.id)
    .single()

  if (error) throw error

  if (!parent?.telegram_chat_id) {
    throw new Error('Parent has no Telegram linked. Please share the receipts manually.')
  }

  const sorted      = [...payments].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))
  const totalAmount = sorted.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const monthsList  = sorted.map(p => p.month).join(', ')
  const year        = sorted[0]?.year

  const msg =
    `🧾 *Receipts — ${sorted.length} month${sorted.length > 1 ? 's' : ''}*\n\n` +
    `👦 Student: ${student?.name}\n` +
    `📅 Months: ${monthsList} ${year}\n` +
    `💰 Total: RM ${totalAmount.toFixed(2)}\n` +
    `💳 Payment: ${paymentMethod}\n` +
    `📆 Date: ${new Date(paidDate).toLocaleDateString('en-MY')}\n\n` +
    `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`

  const inline_keyboard = sorted.map(p => ([{
    text: `🧾 ${p.month} ${p.year} — RM ${parseFloat(p.amount).toFixed(2)}`,
    url: `${RECEIPT_ORIGIN}/receipt/${p.id}`,
  }]))

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: parent.telegram_chat_id,
      text: msg,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard },
    }),
  })

  const result = await res.json()
  if (!result.ok) throw new Error(result.description)
  return { sent: sorted.length }
}
