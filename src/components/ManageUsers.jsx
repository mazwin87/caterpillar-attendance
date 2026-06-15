import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MdOutlineArrowBack, MdOutlineLockReset, MdClose } from 'react-icons/md'

const ROLE_LABEL = { admin: 'Admin', teacher: 'Teacher' }
const ROLE_COLOR = { admin: '#4a6fa5', teacher: '#2d7a4f' }

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

  const inp = {
    style: {
      width: '100%',
      background: 'var(--bg)',
      border: '0.5px solid var(--border)',
      borderRadius: 10,
      padding: '13px 16px',
      fontSize: 15,
      color: 'var(--text)',
      outline: 'none',
      boxSizing: 'border-box',
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}>
          <MdOutlineArrowBack size={22} />
        </button>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Panel</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Manage Users</div>
        </div>
      </div>

      {/* User list */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No users found.</div>
        ) : users.map(u => (
          <div key={u.id} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{u.username}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                <span style={{ color: ROLE_COLOR[u.role] || 'var(--muted)', fontWeight: 500 }}>
                  {ROLE_LABEL[u.role] || u.role}
                </span>
                {u.branches?.name && ` · ${u.branches.name}`}
              </div>
            </div>
            <button onClick={() => openReset(u)}
              style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <MdOutlineLockReset size={15} />
              Reset
            </button>
          </div>
        ))}
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, border: '0.5px solid var(--border)' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Reset Password</div>
              <button onClick={() => setResetUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, display: 'flex' }}>
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Setting a new password for <strong style={{ color: 'var(--text)' }}>{resetUser.username}</strong>.
            </div>

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" {...inp} />
              <input required type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm new password" {...inp} />

              {error && (
                <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 'calc(var(--navbar-height) + 16px)', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, zIndex: 200, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

    </div>
  )
}
