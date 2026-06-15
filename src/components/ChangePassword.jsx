import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { updateSession } from '../lib/auth'

export default function ChangePassword({ session, onDone }) {
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPass.length < 6)      { setError('Password must be at least 6 characters.'); return }
    if (newPass !== confirmPass)  { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: dbErr } = await supabase
      .from('app_users')
      .update({ password: newPass, must_change_password: false })
      .eq('id', session.id)

    if (dbErr) {
      setError('Failed to update password. Please try again.')
      setLoading(false)
      return
    }

    updateSession({ must_change_password: false })
    onDone()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Caterpillar Playtime" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Change Password</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>You must set a new password before continuing.</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              required
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password"
              {...inp}
            />
            <input
              required
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              {...inp}
            />

            {error && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
