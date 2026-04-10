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
      width: '100%', background: '#f8f8f6', border: '0.5px solid #e8e8e4',
      borderRadius: 10, padding: '13px 16px', fontSize: 15,
      color: '#1a1a1a', outline: 'none',
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, background: '#2d7a4f', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px' }}>🐛</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a' }}>Caterpillar Playtime</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Attendance System</div>
        </div>

        {/* Form */}
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

          {/* Teacher name field — only shows for teacher accounts */}
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
            <div style={{ background: '#fdeaea', border: '0.5px solid #f09595', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b03030' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#2d7a4f', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#bbb' }}>
          Session expires at midnight
        </div>
      </div>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}