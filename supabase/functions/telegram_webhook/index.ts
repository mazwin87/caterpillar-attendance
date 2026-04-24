import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN    = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard || { remove_keyboard: true }
    }),
  })
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

const REASON_LABELS: Record<string, string> = {
  sick:                '🤒 Sick',
  outstation:          '✈️ Outstation',
  emergency:           '🚨 Emergency',
  family_matter:       '👨‍👩‍👧 Family matter',
  medical_appointment: '🏥 Medical appointment',
  transport_issue:     '🚗 Transport issue',
  bad_weather:         '🌧️ Bad weather',
  no_reason:           '— No reason given',
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const body     = await req.json()

  // ── Handle button tap (callback query) ──
  if (body.callback_query) {
    const cb         = body.callback_query
    const chatId     = cb.message.chat.id
    const messageId  = cb.message.message_id
    const data       = cb.data

    if (data.startsWith('reason:')) {
      const parts        = data.split(':')
      const attendanceId = parts[1]
      const reason       = parts[2]
      const reasonLabel  = REASON_LABELS[reason] || reason

      const { error } = await supabase
        .from('attendance')
        .update({ absence_reason: reason })
        .eq('id', attendanceId)

      if (error) {
        await answerCallback(cb.id, '❌ Failed to save. Please try again.')
        return new Response('ok')
      }

      const { data: record } = await supabase
        .from('attendance')
        .select('students(name)')
        .eq('id', attendanceId)
        .single()

      const studentName = (record?.students as any)?.name || 'your child'

      await answerCallback(cb.id, '✅ Reason saved!')
      await editMessage(chatId, messageId,
        `📋 <b>Attendance Notice</b>\n\n` +
        `Your child <b>${studentName}</b> was absent today.\n\n` +
        `Reason: <b>${reasonLabel}</b>\n\n` +
        `Thank you for letting us know. 🙏`
      )
    }

    return new Response('ok')
  }

  // ── Handle regular messages ──
  const msg = body.message
  if (!msg) return new Response('ok')

  const chatId    = msg.chat.id
  const text      = msg.text?.trim() || ''
  const firstName = msg.chat.first_name || 'Parent'

  // ── /start with student ID ──
  if (text.startsWith('/start ')) {
    const studentId = text.split(' ')[1]

    const { data: student } = await supabase
      .from('students')
      .select('id, name, branches(name)')
      .eq('id', studentId)
      .single()

    if (!student) {
      await sendMessage(chatId, `❌ Student not found. Please check the link with your child's teacher.`)
      return new Response('ok')
    }

    const { data: parentRow } = await supabase
      .from('parents')
      .select('id, phone, name, telegram_chat_id')
      .eq('student_id', studentId)
      .single()

    if (!parentRow) {
      await sendMessage(chatId, `❌ Parent record not found. Please contact the school.`)
      return new Response('ok')
    }

    if (parentRow.telegram_chat_id) {
      await sendMessage(chatId,
        `✅ You are already registered for <b>${student.name}</b>.\n\nYou will receive notifications if your child is absent.`
      )
      return new Response('ok')
    }

    // Set pending on ALL parent rows with the same phone — covers siblings
    await supabase.from('parents')
      .update({ pending_chat_id: chatId, pending_student_id: studentId })
      .eq('phone', parentRow.phone)

    await sendMessage(chatId,
      `Hi ${firstName}! 👋\n\n` +
      `To register for attendance notifications for <b>${student.name}</b>, ` +
      `please reply with your phone number registered with the school.\n\n` +
      `Example: <code>0171234567</code>`
    )

    return new Response('ok')
  }

  // ── /start with no params ──
  if (text === '/start') {
    await sendMessage(chatId,
      `Hi ${firstName}! 👋\n\nPlease use the registration link provided by your child's teacher to get started.`
    )
    return new Response('ok')
  }

  // ── Phone number verification ──
  const cleanPhone = text
    .replace(/^tel:/, '')
    .replace(/[\s\-\(\)]/g, '')
    .replace(/^\+60/, '0')
    .replace(/^60/, '0')
    .trim()

  if (/^01\d{8,9}$/.test(cleanPhone)) {
    // Use maybeSingle + filter instead of single to avoid PGRST116
    const { data: pendingRows } = await supabase
      .from('parents')
      .select('*, students(name, branches(name))')
      .eq('pending_chat_id', chatId)

    const pendingRow = pendingRows?.[0] || null

    if (!pendingRow) {
      await sendMessage(chatId,
        `❌ No pending registration found. Please tap the registration link from your child's teacher first.`
      )
      return new Response('ok')
    }

    if (pendingRow.phone !== cleanPhone) {
      // Clear pending on all rows with this chat id
      await supabase.from('parents')
        .update({ pending_chat_id: null, pending_student_id: null })
        .eq('pending_chat_id', chatId)

      await sendMessage(chatId,
        `❌ Phone number does not match our records.\n\n` +
        `Please contact your child's teacher to verify your registered phone number.`
      )
      return new Response('ok')
    }

    // Link ALL parent rows with same phone to this Telegram account
    await supabase
      .from('parents')
      .update({
        telegram_chat_id:   chatId,
        pending_chat_id:    null,
        pending_student_id: null,
      })
      .eq('phone', cleanPhone)

    // Get all children linked to this phone
    const { data: allChildren } = await supabase
      .from('parents')
      .select('students(name)')
      .eq('phone', cleanPhone)

    const childNames = allChildren
      ?.map((p: any) => `• ${p.students?.name}`)
      .join('\n') || `• ${pendingRow.students?.name}`

    const branchName = (pendingRow.students?.branches as any)?.name
      ?.replace('Caterpillar Playtime ', '') || ''

    await sendMessage(chatId,
      `✅ <b>Registration successful!</b>\n\n` +
      `Dear ${pendingRow.name || firstName},\n\n` +
      `You are now linked to the following child(ren) at Caterpillar Playtime ${branchName}:\n\n` +
      `${childNames}\n\n` +
      `You will receive a Telegram notification if any of your children are absent. 🏫\n\n` +
      `Thank you! 🙏`
    )

    return new Response('ok')
  }

  await sendMessage(chatId, `Hi! Please use the registration link provided by your child's teacher.`)
  return new Response('ok')
})