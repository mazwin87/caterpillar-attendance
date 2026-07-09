import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setSession } from '../lib/auth'

const inputClass = "w-full bg-page border border-border rounded-[10px] px-4 py-3.5 text-[15px] text-ink outline-none"

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

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-9">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Caterpillar Playtime" className="w-[100px] h-[100px] object-contain mx-auto mb-4 block" />
          <div className="text-[22px] font-medium text-ink">Caterpillar Playtime</div>
          <div className="text-[13px] text-muted mt-1">Attendance System</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-3">

            <input
              required
              value={username}
              onChange={e => checkUsername(e.target.value)}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect="off"
              className={inputClass}
            />

            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
            />

            {isTeacher && (
              <div className="animate-[slideDown_0.2s_ease]">
                <input
                  required
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="Your name e.g. Cikgu Siti"
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <div className="bg-absent-bg border border-absent rounded-lg px-3.5 py-2.5 text-[13px] text-absent">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white border-0 rounded-[10px] py-3.5 text-[15px] font-medium cursor-pointer mt-1 disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 text-xs text-muted">
          Session expires at midnight
        </div>

        <div className="text-center mt-3">
          <a href="/guide.html" target="_blank"
            className="text-xs text-primary no-underline inline-flex items-center gap-1">
            📖 View Teacher Guide
          </a>
        </div>
      </div>
    </div>
  )
}
