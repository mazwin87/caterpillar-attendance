import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MdOutlineArrowBack, MdOutlineLockReset, MdClose } from 'react-icons/md'

const ROLE_LABEL = { admin: 'Admin', teacher: 'Teacher' }
const ROLE_COLOR = { admin: '#4a6fa5', teacher: '#2d7a4f' }

const inputClass = "w-full box-border bg-page border border-border rounded-[10px] px-4 py-3.5 text-[15px] text-ink outline-none"

export default function ManageUsers({ session }) {
  const navigate = useNavigate()
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [resetUser,   setResetUser]   = useState(null)
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [toast,       setToast]       = useState('')

  const isSuperAdmin = session?.role === 'superadmin'

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    let query = supabase
      .from('app_users')
      .select('id, username, role, branch_id, branches(name)')
      .neq('role', 'superadmin')
      .order('role', { ascending: true })
      .order('username', { ascending: true })

    if (!isSuperAdmin) {
      query = query.eq('role', 'teacher')
      if (session.branch_id) query = query.eq('branch_id', session.branch_id)
    }

    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  function openReset(user) {
    setResetUser(user)
    setNewPass('')
    setConfirmPass('')
    setError('')
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (newPass.length < 6)      { setError('Password must be at least 6 characters.'); return }
    if (newPass !== confirmPass)  { setError('Passwords do not match.'); return }

    setSaving(true)
    const { error: dbErr } = await supabase
      .rpc('reset_user_password', { p_user_id: resetUser.id, p_new_password: newPass, p_must_change: false })

    setSaving(false)
    if (dbErr) { setError(`Failed to reset: ${dbErr.message}`); return }

    const name = resetUser.username
    setResetUser(null)
    setToast(`Password reset for ${name}`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="min-h-full bg-page" style={{ paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div className="pt-[52px] lg:pt-8 bg-surface border-b border-border pb-5 px-5 flex items-center gap-3">
        <button onClick={() => navigate('/admin')}
          className="bg-transparent border-0 cursor-pointer text-muted p-0 flex">
          <MdOutlineArrowBack size={22} />
        </button>
        <div>
          <div className="text-[11px] text-muted tracking-[0.08em] uppercase mb-1">Admin Panel</div>
          <div className="text-[22px] font-medium text-ink">Manage Users</div>
        </div>
      </div>

      {/* User list */}
      <div className="lg:max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-2.5 p-4 py-5">
        {loading ? (
          <div className="text-center text-muted p-10">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-muted p-10">No users found.</div>
        ) : users.map(u => (
          <div key={u.id} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium text-ink">{u.username}</div>
              <div className="text-xs text-muted mt-0.5">
                <span style={{ color: ROLE_COLOR[u.role] || 'var(--muted)' }} className="font-medium">
                  {ROLE_LABEL[u.role] || u.role}
                </span>
                {u.branches?.name && ` · ${u.branches.name}`}
              </div>
            </div>
            <button onClick={() => openReset(u)}
              className="bg-page border border-border rounded-lg px-3.5 py-2 text-xs text-ink cursor-pointer flex items-center gap-1.5 flex-shrink-0">
              <MdOutlineLockReset size={15} />
              Reset
            </button>
          </div>
        ))}
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-[360px] border border-border">

            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-medium text-ink">Reset Password</div>
              <button onClick={() => setResetUser(null)}
                className="bg-transparent border-0 cursor-pointer text-muted p-0 flex">
                <MdClose size={20} />
              </button>
            </div>

            <div className="text-[13px] text-muted mb-4">
              Setting a new password for <strong className="text-ink">{resetUser.username}</strong>.
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <input required type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" className={inputClass} />
              <input required type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm new password" className={inputClass} />

              {error && (
                <div className="bg-absent-bg border border-absent rounded-lg px-3.5 py-2.5 text-[13px] text-absent">
                  {error}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="bg-present text-white border-0 rounded-[10px] py-3.5 text-[15px] font-medium cursor-pointer disabled:opacity-70">
                {saving ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[200] bg-[#1a1a1a] text-white rounded-[10px] px-5 py-2.5 text-[13px] whitespace-nowrap"
          style={{ bottom: 'calc(var(--navbar-height) + 16px)' }}
        >
          {toast}
        </div>
      )}

    </div>
  )
}
