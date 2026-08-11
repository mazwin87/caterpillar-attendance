import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useStudents } from '../../../hooks/useStudents'
import StudentsMobileView from './StudentsMobileView'
import StudentsDesktopView from './StudentsDesktopView'

export default function StudentsPage({ session }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const hook = useStudents(session)
  return isDesktop
    ? <StudentsDesktopView session={session} {...hook} />
    : <StudentsMobileView  {...hook} />
}
