import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard || undefined,
    }),
  })
  return res.json()
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const today = new Date().toISOString().split('T')[0]

  const { data: absentees, error } = await supabase
    .from('attendance')
    .select(`
      id,
      date,
      students (
        name,
        student_no,
        classes ( name ),
        branches ( name ),
        parents ( telegram_chat_id, name )
      )
    `)
    .eq('date', today)
    .eq('status', 'ABSENT')

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  console.log(`Found ${absentees?.length} absent students today`)

  const results = []

  for (const record of absentees || []) {
    const student = record.students as any
    const parent  = student?.parents
    const branch  = student?.branches?.name?.replace('Caterpillar_', '')
    const cls     = student?.classes?.name

    if (!parent?.telegram_chat_id) {
      console.log(`No Telegram for ${student?.name} — skipping`)
      results.push({ student: student?.name, status: 'no_telegram' })
      continue
    }

    const message =
      `📋 <b>Notis Kehadiran</b>\n\n` +
      `Ibu/Bapa yang dihormati,\n\n` +
      `Anak anda <b>${student.name}</b>${cls ? ` (${cls})` : ''} dari <b>Caterpillar ${branch}</b> ` +
      `<b>tidak hadir</b> ke sekolah hari ini, <b>${today}</b>.\n\n` +
      `Sila pilih sebab ketidakhadiran:`

    // Inline keyboard with reason buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🤒 Sick',           callback_data: `reason:${record.id}:sick` },
          { text: '✈️ Outstation',     callback_data: `reason:${record.id}:outstation` },
        ],
        [
          { text: '🚨 Emergency',      callback_data: `reason:${record.id}:emergency` },
          { text: '👨‍👩‍👧 Family matter', callback_data: `reason:${record.id}:family_matter` },
        ],
        [
          { text: '—  No reason',      callback_data: `reason:${record.id}:no_reason` },
        ],
      ]
    }

    const tgRes = await sendMessage(parent.telegram_chat_id, message, keyboard)
    console.log(`Sent to ${student.name}:`, tgRes.ok ? 'OK' : tgRes.description)

    await supabase.from('notifications').insert({
      attendance_id: record.id,
      channel: 'telegram',
      status: tgRes.ok ? 'sent' : 'failed',
      sent_at: tgRes.ok ? new Date().toISOString() : null,
      error_msg: tgRes.ok ? null : tgRes.description,
    })

    results.push({ student: student.name, ok: tgRes.ok })
  }

  return new Response(JSON.stringify({ date: today, notified: results.length, results }), {
    headers: { 'Content-Type': 'application/json' }
  })
})