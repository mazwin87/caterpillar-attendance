import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useFees } from '../../../hooks/useFees'
import FeesMobileView from './FeesMobileView'
import FeesDesktopView from './FeesDesktopView'

export default function FeesPage({ session }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const fees = useFees(session)
  return isDesktop
    ? <FeesDesktopView {...fees} />
    : <FeesMobileView  {...fees} />
}
