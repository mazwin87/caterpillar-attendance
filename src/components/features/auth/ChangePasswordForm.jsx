import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Input, Button } from '../../ui'

const FIELD = { style: { fontSize: 15, padding: '13px 16px' } }

export default function ChangePasswordForm({ session, onDone }) {
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPass.length < 6)     { setError('Password must be at least 6 characters.'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPass })
      if (pwErr) throw new Error(pwErr.message)
      await supabase.auth.updateUser({ data: { must_change_password: false } })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            <Input
              required
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password"
              style={FIELD.style}
            />
            <Input
              required
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              style={FIELD.style}
            />

            {error && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} style={{ padding: 14, fontSize: 15, marginTop: 4 }}>
              {loading ? 'Saving...' : 'Set New Password'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}
