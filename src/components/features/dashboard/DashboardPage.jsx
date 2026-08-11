import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useDashboard } from '../../../hooks/useDashboard'
import DashboardMobileView from './DashboardMobileView'
import DashboardDesktopView from './DashboardDesktopView'

export default function DashboardPage({ t, session, isAdmin }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const hook = useDashboard(session)
  return isDesktop
    ? <DashboardDesktopView session={session} isAdmin={isAdmin} {...hook} />
    : <DashboardMobileView  t={t} session={session} isAdmin={isAdmin} {...hook} />
}
