import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setSession } from '../lib/auth'

export default function Login({ onLogin }) {
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [isTeacher, setIsTeacher]     = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('app_users')
      .select('*, branches(name, slug)')
      .eq('username', username.toLowerCase().trim())
      .eq('password', password)
      .single()

    if (dbError || !data) {
      setError('Incorrect username or password.')
      setLoading(false)
      return
    }

    if (data.role === 'teacher' && !teacherName.trim()) {
      setError('Please enter your name.')
      setLoading(false)
      return
    }

    setSession(data, teacherName.trim())
    onLogin(data, teacherName.trim())
    setLoading(false)
  }

  async function checkUsername(val) {
    setUsername(val)
    if (val.length < 2) { setIsTeacher(false); return }
    const { data } = await supabase
      .from('app_users')
      .select('role')
      .eq('username', val.toLowerCase().trim())
      .single()
    setIsTeacher(data?.role === 'teacher')
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
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/logo.png" alt="Caterpillar Playtime" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>Caterpillar Playtime</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Attendance System</div>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <input
              required
              value={username}
              onChange={e => checkUsername(e.target.value)}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect="off"
              {...inp}
            />

            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              {...inp}
            />

            {/* Teacher name — only shows for teacher accounts */}
            {isTeacher && (
              <div style={{ animation: 'slideDown 0.2s ease' }}>
                <input
                  required
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="Your name e.g. Cikgu Siti"
                  {...inp}
                />
              </div>
            )}

            {error && (
              <div style={{ background: 'var(--absent-bg)', border: '0.5px solid var(--absent)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--absent)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--present)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
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