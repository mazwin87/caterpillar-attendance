import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { useManualReceipt } from '../../../hooks/useManualReceipt'
import ManualReceiptMobileView from './ManualReceiptMobileView'
import ManualReceiptDesktopView from './ManualReceiptDesktopView'

export default function ManualReceiptPage({ session }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const mr = useManualReceipt(session)
  return isDesktop
    ? <ManualReceiptDesktopView {...mr} />
    : <ManualReceiptMobileView  {...mr} />
}
