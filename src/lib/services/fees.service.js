import { supabase } from '../supabase'

const BOT_TOKEN      = '8728256755:AAHlNR5j7UlZqi-y4IomHu2pD0kSrBLyZuY'
const RECEIPT_ORIGIN = 'https://nimonimo.tech'

export async function getParentTelegramId(studentId) {
  const { data, error } = await supabase
    .from('parents')
    .select('telegram_chat_id, name')
    .eq('student_id', studentId)
    .single()
  if (error) throw error
  return data
}

export async function sendTelegramReceipt(payment) {
  const parent = await getParentTelegramId(payment.student_id)

  if (!parent?.telegram_chat_id) {
    throw new Error('Parent has no Telegram linked.')
  }

  const receiptUrl = `${RECEIPT_ORIGIN}/receipt/${payment.id}`
  const msg =
    `🧾 *Receipt — ${payment.receipt_no}*\n\n` +
    `👦 Student: ${payment.students?.name}\n` +
    `📅 Month: ${payment.month} ${payment.year}\n` +
    `💰 Amount: RM ${parseFloat(payment.amount).toFixed(2)}\n` +
    `💳 Payment: ${payment.payment_method}\n` +
    `📆 Date: ${new Date(payment.paid_date).toLocaleDateString('en-MY')}\n\n` +
    `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: parent.telegram_chat_id,
      text: msg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{
          text: `🧾 View Receipt — ${payment.students?.name} (${payment.month} ${payment.year})`,
          url: receiptUrl,
        }]],
      },
    }),
  })

  const result = await res.json()
  if (!result.ok) throw new Error(result.description)
  return result
}
