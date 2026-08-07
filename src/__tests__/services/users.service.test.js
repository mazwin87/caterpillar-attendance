import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, fail } from '../helpers/mockSupabase'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  loginWithCredentials, getUserRole,
  adminResetPassword, changeOwnPassword,
  getUsers,
} from '../../lib/services/users.service'

beforeEach(() => vi.clearAllMocks())

describe('loginWithCredentials', () => {
  const user = { id: 'u1', username: 'admin1', role: 'admin', branches: { name: 'KL Traders', slug: 'KLTS' } }

  it('returns user data when credentials are valid', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: user, error: null })
    const result = await loginWithCredentials('admin1', 'pass123')
    expect(result).toEqual(user)
    expect(supabase.rpc).toHaveBeenCalledWith('verify_login', { p_username: 'admin1', p_password: 'pass123' })
  })

  it('throws when RPC returns an error (wrong password)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } })
    await expect(loginWithCredentials('admin1', 'wrong')).rejects.toThrow('Incorrect username or password.')
  })

  it('throws when user does not exist (null data)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })
    await expect(loginWithCredentials('nobody', 'pass')).rejects.toThrow('Incorrect username or password.')
  })
})

describe('getUserRole', () => {
  it('returns "admin" for an admin user', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ role: 'admin' }))
    expect(await getUserRole('adminuser')).toBe('admin')
  })

  it('returns "teacher" for a teacher user', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ role: 'teacher' }))
    expect(await getUserRole('teacheruser')).toBe('teacher')
  })

  it('returns "superadmin" for a superadmin user', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok({ role: 'superadmin' }))
    expect(await getUserRole('superuser')).toBe('superadmin')
  })

  it('returns null when user does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getUserRole('nobody')).toBeNull()
  })
})

describe('adminResetPassword', () => {
  it('resolves without error on success', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })
    await expect(adminResetPassword('caller-1', 'u1', 'newpass')).resolves.toBeUndefined()
    expect(supabase.rpc).toHaveBeenCalledWith('reset_user_password', {
      p_caller_id: 'caller-1', p_user_id: 'u1', p_new_password: 'newpass', p_must_change: true,
    })
  })

  it('throws when caller is not admin/superadmin (RPC raises Unauthorized)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Unauthorized' } })
    await expect(adminResetPassword('teacher-id', 'u1', 'newpass')).rejects.toThrow('Failed to reset: Unauthorized')
  })

  it('throws when target user does not exist', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'User not found' } })
    await expect(adminResetPassword('caller-1', 'bad-id', 'newpass')).rejects.toThrow('Failed to reset: User not found')
  })
})

describe('changeOwnPassword', () => {
  it('resolves without error on success', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })
    await expect(changeOwnPassword('u1', 'oldpass', 'newpass')).resolves.toBeUndefined()
    expect(supabase.rpc).toHaveBeenCalledWith('change_own_password', {
      p_user_id: 'u1', p_current_password: 'oldpass', p_new_password: 'newpass',
    })
  })

  it('throws specific message when current password is wrong', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Current password is incorrect.' } })
    await expect(changeOwnPassword('u1', 'wrong', 'newpass')).rejects.toThrow('Current password is incorrect.')
  })

  it('throws generic message for other RPC errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Internal error' } })
    await expect(changeOwnPassword('u1', 'oldpass', 'newpass')).rejects.toThrow('Failed to update password. Please try again.')
  })
})

describe('getUsers', () => {
  const users = [
    { id: 'u1', username: 'teacher1', role: 'teacher', branch_id: 'b1', branches: { name: 'KL Traders' } },
    { id: 'u2', username: 'admin1',   role: 'admin',   branch_id: 'b2', branches: { name: 'Sentul' } },
  ]

  it('superadmin receives all non-superadmin users', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(users))
    const result = await getUsers({ isSuperAdmin: true, branchId: null })
    expect(result).toEqual(users)
    expect(supabase.from).toHaveBeenCalledWith('app_users')
  })

  it('admin only receives teachers from their own branch', async () => {
    const teachers = [users[0]]
    vi.mocked(supabase.from).mockReturnValue(ok(teachers))
    const result = await getUsers({ isSuperAdmin: false, branchId: 'b1' })
    expect(result).toEqual(teachers)
  })

  it('returns empty array when query returns null', async () => {
    vi.mocked(supabase.from).mockReturnValue(ok(null))
    expect(await getUsers({ isSuperAdmin: true, branchId: null })).toEqual([])
  })
})
