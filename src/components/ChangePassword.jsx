import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { updateSession } from '../lib/auth'

const inputClass = "w-full box-border bg-page border border-border rounded-[10px] px-4 py-3.5 text-[15px] text-ink outline-none"

export default function ChangePassword({ session, onDone }) {
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

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
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-9">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Caterpillar Playtime" className="w-[100px] h-[100px] object-contain mx-auto mb-4 block" />
          <div className="text-[22px] font-medium text-ink">Change Password</div>
          <div className="text-[13px] text-muted mt-1">You must set a new password before continuing.</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              required
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password"
              className={inputClass}
            />
            <input
              required
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              className={inputClass}
            />

            {error && (
              <div className="bg-absent-bg border border-absent rounded-lg px-3.5 py-2.5 text-[13px] text-absent">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white border-0 rounded-[10px] py-3.5 text-[15px] font-medium cursor-pointer mt-1 disabled:opacity-70">
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
