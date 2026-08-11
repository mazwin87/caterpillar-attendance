import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useReports } from '../../../hooks/useReports'
import ReportsMobileView from './ReportsMobileView'
import ReportsDesktopView from './ReportsDesktopView'

export default function ReportsPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reports = useReports()
  return isDesktop
    ? <ReportsDesktopView {...reports} />
    : <ReportsMobileView  {...reports} />
}
