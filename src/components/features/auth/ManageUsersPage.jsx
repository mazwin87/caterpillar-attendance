import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useManageUsers } from '../../../hooks/useManageUsers'
import ManageUsersMobileView from './ManageUsersMobileView'
import ManageUsersDesktopView from './ManageUsersDesktopView'

export default function ManageUsersPage({ session }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { users, loading, saving, isSuperAdmin, resetPassword } = useManageUsers(session)
  return isDesktop
    ? <ManageUsersDesktopView users={users} loading={loading} saving={saving} resetPassword={resetPassword} />
    : <ManageUsersMobileView  users={users} loading={loading} saving={saving} isSuperAdmin={isSuperAdmin} resetPassword={resetPassword} />
}
