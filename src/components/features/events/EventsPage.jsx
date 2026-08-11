import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useEvents } from '../../../hooks/useEvents'
import EventsMobileView from './EventsMobileView'
import EventsDesktopView from './EventsDesktopView'

export default function EventsPage({ t }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const ev = useEvents()
  return isDesktop
    ? <EventsDesktopView {...ev} />
    : <EventsMobileView  {...ev} />
}
