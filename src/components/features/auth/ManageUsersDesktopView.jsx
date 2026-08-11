import { useState } from 'react'
import { MdOutlineLockReset, MdClose } from 'react-icons/md'
import { PageHeader, Table, Modal, Input, Button } from '../../ui'

const ROLE_LABEL = { admin: 'Admin', teacher: 'Teacher', superadmin: 'Super Admin' }
const ROLE_COLOR = { admin: '#4a6fa5', teacher: '#2d7a4f', superadmin: '#7c3aed' }

export default function ManageUsersDesktopView({ users, loading, saving, resetPassword }) {
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

  function closeReset() { setResetUser(null) }

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

  const columns = [
    { key: 'username', label: 'Username', sortable: true },
    {
      key: 'role', label: 'Role', sortable: true,
      render: (u) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          color: ROLE_COLOR[u.role] || 'var(--muted)',
          background: (ROLE_COLOR[u.role] || 'var(--muted)') + '18',
        }}>
          {ROLE_LABEL[u.role] || u.role}
        </span>
      ),
    },
    {
      key: 'branch', label: 'Branch', sortable: true,
      render: (u) => u.branches?.name || <span style={{ color: 'var(--muted)' }}>—</span>,
    },
    {
      key: 'actions', label: '',
      render: (u) => (
        <Button
          variant="secondary"
          onClick={() => openReset(u)}
          style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <MdOutlineLockReset size={14} /> Reset password
        </Button>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100%' }}>
      <PageHeader
        title="Manage Users"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''}`}
      />

      <div style={{ padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 60 }}>Loading...</div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <Table
              columns={columns}
              rows={users}
              emptyMessage="No users found."
            />
          </div>
        )}
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
            <Input required type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" style={{ fontSize: 15, padding: '13px 16px' }} />
            <Input required type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm new password" style={{ fontSize: 15, padding: '13px 16px' }} />

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
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, zIndex: 200, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
