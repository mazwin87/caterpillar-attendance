import { useState } from 'react'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { importStudentsCSV } from '../../../lib/services/importer.service'
import { BRANCH_SLUGS } from '../../../lib/constants/branches'
import { AGE_GROUPS } from '../../../lib/constants/ageGroups'
import { MONTHS, PAYMENT_METHODS } from '../../../lib/constants/months'
import ImporterMobileView from './ImporterMobileView'
import ImporterDesktopView from './ImporterDesktopView'

export default function ImporterPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [importData, setImportData]     = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting]       = useState(false)
  const [importDone, setImportDone]     = useState(null)

  function downloadTemplate() {
    const headers  = 'name,student_no,branch_slug,age_group,date_of_birth,monthly_fee,parent_name,parent_phone,parent_email,fee_month,fee_year,fee_amount,fee_payment_method,fee_paid_date'
    const example1 = 'Muhammad Aqil bin Hafiz,MXIM-010,MXIM,3year,2021-03-15,650,Hafiz bin Ahmad,0123456789,hafiz@email.com,April,2026,650,Cash,2026-04-01'
    const example2 = 'Nur Sofia binti Razak,MXIM-011,MXIM,2year,2022-07-20,650,Razak bin Ali,0187654321,razak@email.com,,,,'
    const example3 = 'Ahmad Luqman bin Ismail,KLTS-010,KLTS,1year,2023-01-10,600,Ismail bin Daud,0112223333,,,,,,'
    const csv = [headers, example1, example2, example3].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'students_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleCSVFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text    = ev.target.result
      const lines   = text.trim().split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      const rows    = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj    = {}
        headers.forEach((h, i) => { obj[h] = values[i] || '' })
        return obj
      }).filter(r => r.name?.trim())

      const errors = []
      rows.forEach((r, i) => {
        const n = i + 2
        if (!r.name?.trim())          errors.push(`Row ${n}: name is required`)
        if (!r.student_no?.trim())    errors.push(`Row ${n}: student_no is required`)
        if (!r.branch_slug?.trim())   errors.push(`Row ${n}: branch_slug is required`)
        if (!r.date_of_birth?.trim()) errors.push(`Row ${n}: date_of_birth is required`)
        if (!r.monthly_fee?.trim())   errors.push(`Row ${n}: monthly_fee is required`)
        if (!r.parent_name?.trim())   errors.push(`Row ${n}: parent_name is required`)
        if (!r.parent_phone?.trim())  errors.push(`Row ${n}: parent_phone is required`)
        if (r.branch_slug && !BRANCH_SLUGS.includes(r.branch_slug.trim().toUpperCase())) {
          errors.push(`Row ${n}: branch_slug "${r.branch_slug}" is invalid — must be KLTS, SNTL, WGMJ or MXIM`)
        }
        if (!r.age_group?.trim()) errors.push(`Row ${n}: age_group is required`)
        if (r.age_group && !AGE_GROUPS.includes(r.age_group.trim())) {
          errors.push(`Row ${n}: age_group "${r.age_group}" is invalid — must be one of: ${AGE_GROUPS.join(', ')}`)
        }
        if (r.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(r.date_of_birth.trim())) {
          errors.push(`Row ${n}: date_of_birth must be YYYY-MM-DD format`)
        }
        if (r.fee_month && !MONTHS.includes(r.fee_month.trim())) {
          errors.push(`Row ${n}: fee_month "${r.fee_month}" is invalid — use full month name e.g. April`)
        }
        if (r.fee_payment_method && !PAYMENT_METHODS.includes(r.fee_payment_method.trim())) {
          errors.push(`Row ${n}: fee_payment_method must be Cash, Bank Transfer or Cheque`)
        }
        if (r.fee_paid_date && !/^\d{4}-\d{2}-\d{2}$/.test(r.fee_paid_date.trim())) {
          errors.push(`Row ${n}: fee_paid_date must be YYYY-MM-DD format`)
        }
      })

      setImportErrors(errors)
      setImportData(rows)
      setImportDone(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (importErrors.length > 0) { alert('Please fix all errors before importing'); return }
    if (importData.length === 0) { alert('No data to import'); return }
    setImporting(true)
    const results = await importStudentsCSV(importData)
    setImportDone(results)
    setImporting(false)
  }

  function reset() {
    setImportData([])
    setImportErrors([])
    setImportDone(null)
  }

  const props = { importData, importErrors, importing, importDone, downloadTemplate, handleCSVFile, handleImport, reset }

  return isDesktop
    ? <ImporterDesktopView {...props} />
    : <ImporterMobileView  {...props} />
}
