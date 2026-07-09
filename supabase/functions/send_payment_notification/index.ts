import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN    = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { payment_ids } = await req.json()

  if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'payment_ids is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, amount, month, year, payment_method, paid_date, receipt_no, students(name, parents(telegram_chat_id))')
    .in('id', payment_ids)

  if (error || !payments || payments.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || 'Payments not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    })
  }

  const chatId      = (payments[0].students as any)?.parents?.telegram_chat_id
  const studentName = (payments[0].students as any)?.name

  if (!chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'no_telegram' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sorted = [...payments].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month))

  let text: string
  let inline_keyboard: { text: string, url: string }[][]

  if (sorted.length === 1) {
    const p = sorted[0]
    text =
      `🧾 *Receipt — ${p.receipt_no}*\n\n` +
      `👦 Student: ${studentName}\n` +
      `📅 Month: ${p.month} ${p.year}\n` +
      `💰 Amount: RM ${parseFloat(p.amount).toFixed(2)}\n` +
      `💳 Payment: ${p.payment_method}\n` +
      `📆 Date: ${new Date(p.paid_date).toLocaleDateString('en-MY')}\n\n` +
      `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`
    inline_keyboard = [[{
      text: `🧾 View Receipt — ${studentName} (${p.month} ${p.year})`,
      url: `https://nimonimo.tech/receipt/${p.id}`,
    }]]
  } else {
    const total      = sorted.reduce((s, p) => s + parseFloat(p.amount), 0)
    const monthsList = sorted.map(p => p.month).join(', ')
    text =
      `🧾 *Receipts — ${sorted.length} months*\n\n` +
      `👦 Student: ${studentName}\n` +
      `📅 Months: ${monthsList} ${sorted[0].year}\n` +
      `💰 Total: RM ${total.toFixed(2)}\n` +
      `💳 Payment: ${sorted[0].payment_method}\n` +
      `📆 Date: ${new Date(sorted[0].paid_date).toLocaleDateString('en-MY')}\n\n` +
      `_Thank you for your payment! 🙏_\n_Caterpillar Playtime_`
    inline_keyboard = sorted.map(p => ([{
      text: `🧾 ${p.month} ${p.year} — RM ${parseFloat(p.amount).toFixed(2)}`,
      url: `https://nimonimo.tech/receipt/${p.id}`,
    }]))
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard },
    }),
  })
  const result = await res.json()

  return new Response(JSON.stringify({ ok: result.ok, description: result.description }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
