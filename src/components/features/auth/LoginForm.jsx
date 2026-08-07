import { useState } from 'react'
import { setSession } from '../../../lib/auth'
import { loginWithCredentials } from '../../../lib/services/users.service'
import { Input, Button } from '../../ui'

const FIELD = { style: { fontSize: 15, padding: '13px 16px' } }

export default function LoginForm({ onLogin }) {
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [pendingUser, setPendingUser] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (pendingUser) {
      if (!teacherName.trim()) { setError('Please enter your name.'); return }
      setSession(pendingUser, teacherName.trim())
      onLogin(pendingUser, teacherName.trim())
      return
    }

    setLoading(true)
    try {
      const user = await loginWithCredentials(username, password)
      if (user.role === 'teacher') {
        setPendingUser(user)
      } else {
        setSession(user, '')
        onLogin(user, '')
      }
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
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Caterpillar Playtime</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Attendance System</div>
        </div>

        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!pendingUser ? (
              <>
                <Input
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={FIELD.style}
                />
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  style={FIELD.style}
                />
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', paddingBottom: 4 }}>
                  Logged in as <strong>{username}</strong>. Enter your display name.
                </div>
                <Input
                  required
                  autoFocus
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="Your name e.g. Cikgu Siti"
                  style={FIELD.style}
                />
              </>
            )}

            {error && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} style={{ padding: 14, fontSize: 15, marginTop: 4 }}>
              {loading ? 'Signing in...' : pendingUser ? 'Continue' : 'Sign in'}
            </Button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          Session expires at midnight
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="/guide.html" target="_blank"
            style={{ fontSize: 12, color: '#2d7a4f', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📖 View Teacher Guide
          </a>
        </div>
      </div>
    </div>
  )
}
