import { useEffect, useState } from 'react'
import { getUsers, adminResetPassword } from '../lib/services/users.service'

export function useManageUsers(session) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const isSuperAdmin = session?.role === 'superadmin'

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await getUsers({ isSuperAdmin, branchId: session?.branch_id })
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(userId, newPassword) {
    setSaving(true)
    try {
      await adminResetPassword(userId, newPassword)
    } finally {
      setSaving(false)
    }
  }

  return { users, loading, saving, isSuperAdmin, resetPassword }
}
