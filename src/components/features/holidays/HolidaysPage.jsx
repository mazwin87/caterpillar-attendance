import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useHolidays } from '../../../hooks/useHolidays'
import HolidaysMobileView from './HolidaysMobileView'
import HolidaysDesktopView from './HolidaysDesktopView'

export default function HolidaysPage({ isAdmin }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const hook = useHolidays()
  return isDesktop
    ? <HolidaysDesktopView isAdmin={isAdmin} {...hook} />
    : <HolidaysMobileView  isAdmin={isAdmin} {...hook} />
}
