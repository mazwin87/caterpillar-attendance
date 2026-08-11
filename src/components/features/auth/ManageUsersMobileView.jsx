import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineArrowBack, MdOutlineLockReset, MdClose } from 'react-icons/md'
import { Modal, Input, Button, EmptyState } from '../../ui'

const ROLE_LABEL = { admin: 'Admin', teacher: 'Teacher' }
const ROLE_COLOR = { admin: '#4a6fa5', teacher: '#2d7a4f' }

const FIELD = { style: { fontSize: 15, padding: '13px 16px' } }

export default function ManageUsersMobileView({ users, loading, saving, isSuperAdmin, resetPassword }) {
  const navigate = useNavigate()

  const [resetUser,   setResetUser]   = useState(null)
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError]             = useState('')
  const [toast, setToast]             = useState('')

  function openReset(user) {
    setResetUser(user)
    setNewPass('')
    setConfirmPass('')
    setError('')
  }

  function closeReset() {
    setResetUser(null)
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (newPass.length < 6)     { setError('Password must be at least 6 characters.'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }

    try {
      await resetPassword(resetUser.id, newPass)
      const name = resetUser.username
      closeReset()
      setToast(`Password reset for ${name}`)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 'var(--navbar-height)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', padding: '52px 20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="ghost" onClick={() => navigate('/admin')} style={{ padding: 0, display: 'flex' }}>
          <MdOutlineArrowBack size={22} />
        </Button>
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
          <EmptyState>No users found.</EmptyState>
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
            <Button
              variant="secondary"
              onClick={() => openReset(u)}
              style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <MdOutlineLockReset size={15} /> Reset
            </Button>
          </div>
        ))}
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <Modal onClose={closeReset} variant="center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Reset Password</div>
            <Button variant="ghost" onClick={closeReset} style={{ padding: 0, display: 'flex' }}>
              <MdClose size={20} />
            </Button>
          </div>

          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Setting a new password for <strong style={{ color: 'var(--text)' }}>{resetUser.username}</strong>.
          </div>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input required type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" style={FIELD.style} />
            <Input required type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm new password" style={FIELD.style} />

            {error && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={saving} style={{ padding: 14, fontSize: 15 }}>
              {saving ? 'Saving...' : 'Reset Password'}
            </Button>
          </form>
        </Modal>
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
