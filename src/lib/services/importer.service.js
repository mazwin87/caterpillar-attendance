import { supabase, createPayment } from '../supabase'
import { getMYT } from '../utils/date'

export async function importStudentsCSV(rows) {
  const success = []
  const errors  = []

  for (const row of rows) {
    try {
      const { data: branch } = await supabase
        .from('branches').select('id').eq('slug', row.branch_slug.toUpperCase()).single()
      if (!branch) throw new Error(`Branch not found: ${row.branch_slug}`)

      const { data: student, error: sErr } = await supabase
        .from('students')
        .insert({
          name:          row.name.trim(),
          student_no:    row.student_no.trim(),
          branch_id:     branch.id,
          date_of_birth: row.date_of_birth || null,
          monthly_fee:   parseFloat(row.monthly_fee) || 0,
          age_group:     row.age_group?.trim() || null,
        })
        .select().single()
      if (sErr) throw new Error(sErr.message)

      if (row.parent_name || row.parent_phone) {
        await supabase.from('parents').insert({
          student_id: student.id,
          name:       row.parent_name  || null,
          phone:      row.parent_phone || null,
          email:      row.parent_email || null,
        })
      }

      if (row.fee_month && row.fee_year && row.fee_amount) {
        await createPayment({
          student_id:     student.id,
          branch_id:      branch.id,
          amount:         parseFloat(row.fee_amount),
          month:          row.fee_month,
          year:           parseInt(row.fee_year),
          paid_date:      row.fee_paid_date || getMYT(),
          payment_method: row.fee_payment_method || 'Cash',
          issued_by:      'Import',
        })
      }

      success.push(row)
    } catch (err) {
      errors.push({ row, reason: err.message })
    }
  }

  return { success, errors }
}
