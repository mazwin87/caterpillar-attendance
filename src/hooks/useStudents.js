import { useEffect, useState } from 'react'
import {
  getStudents, getBranches, getTodayAttendanceMap,
  generateStudentNo, addStudent, addParent,
  updateStudent, deactivateStudent, getBranchStudentsForPrint,
} from '../lib/services/students.service'
import { generateQRDataURL, openQRBatchPrint } from '../lib/utils/qr'

export function useStudents(session) {
  const [students, setStudents]   = useState([])
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [printingQR, setPrintingQR] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState([])

  useEffect(() => {
    Promise.all([
      getStudents(session?.role === 'teacher' ? session?.branch_id : null),
      getBranches(),
      getTodayAttendanceMap(),
    ]).then(([s, b, a]) => {
      setStudents(s)
      setTodayAttendance(a)
      setBranches(session?.role === 'teacher' ? b.filter(br => br.id === session?.branch_id) : b)
    }).finally(() => setLoading(false))
  }, [])

  async function getAutoStudentNo(branchId) {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return ''
    return generateStudentNo(branchId, branch.slug)
  }

  async function add(formData) {
    setSaving(true)
    try {
      const student = await addStudent({
        name:          formData.name,
        student_no:    formData.student_no,
        branch_id:     formData.branch_id,
        date_of_birth: formData.date_of_birth || null,
        monthly_fee:   parseFloat(formData.monthly_fee) || 0,
        age_group:     formData.age_group || null,
      })
      if (formData.parent_name || formData.parent_phone || formData.parent_email) {
        await addParent({
          student_id: student.id,
          name:       formData.parent_name  || null,
          phone:      formData.parent_phone || null,
          email:      formData.parent_email || null,
        })
      }
      setStudents(prev => [student, ...prev])
      return student
    } finally {
      setSaving(false)
    }
  }

  async function update(studentId, formData) {
    setSaving(true)
    try {
      const updated = await updateStudent(studentId, formData)
      setStudents(prev => prev.map(s => s.id === studentId ? updated : s))
      return updated
    } finally {
      setSaving(false)
    }
  }

  async function remove(studentId) {
    await deactivateStudent(studentId)
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  async function batchPrintQR(branchId) {
    const branchStudents = await getBranchStudentsForPrint(branchId)
    if (!branchStudents.length) throw new Error('No students found for this branch')
    setPrintingQR(true)
    try {
      const studentsWithQR = await Promise.all(
        branchStudents.map(s =>
          generateQRDataURL(s.id, { color: { dark: '#000000', light: '#ffffff' } })
            .then(url => ({ ...s, qrUrl: url }))
        )
      )
      openQRBatchPrint(studentsWithQR)
    } finally {
      setPrintingQR(false)
    }
  }

  const attendanceMap = Object.fromEntries(todayAttendance.map(a => [a.student_id, a.status]))

  return {
    students, branches, loading, saving, printingQR, attendanceMap,
    getAutoStudentNo, add, update, remove, batchPrintQR,
  }
}
