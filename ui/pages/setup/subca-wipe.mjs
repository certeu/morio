// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useEffect, useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { Link } from 'components/link.mjs'
import { WarningIcon } from 'components/icons.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import { ErrorNoCsr, PendingStatus, LocalPageWrapper } from './subca-complete.mjs'

const WipeSubcaSettingsPage = (props) => {
  /*
   * React state
   */
  const [csr, setCsr] = useState('')
  const [serial, setSerial] = useState('')
  const [error, setError] = useState(false)
  const [status, setStatus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wiped, setWiped] = useState(false)

  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { api } = useApi()

  useEffect(() => {
    const loadStatus = async () => {
      const [content] = await api.getStatus()
      setStatus(true)
      if (!content?.core?.node?.subca_csr) setError('noCsr')
      else {
        setCsr(content.core.node.subca_csr)
        setSerial(content.core.node.subca_serial)
      }
    }
    if (!status || wiped) loadStatus()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [wiped])

  /*
   * Helper method to wipe the configuration
   */
  const wipe = async () => {
    setLoading(true)
    setLoadingStatus([true, 'Wiping your settings, this will take a while'])
    const result = await api.wipeSubca(serial)
    setLoading(false)
    if (result[1] === 204) {
      setLoadingStatus([true, 'Settings wiped', true, true])
      setWiped(true)
    } else {
      setWiped(false)
      return setLoadingStatus([true, `Unable to wipe the settings`, true, false])
    }
  }

  /*
   * Don't bother without a CSR
   */
  if (error === 'noCsr') return <ErrorNoCsr {...props} />

  return (
    <LocalPageWrapper {...props}>
      <div className="mt-8 py-4 px-8 max-w-xl m-auto">
        {loading ? (
          <div className="w-52 mx-auto text-center text-lg font-bold">
            <Spinner className="w-8 h-8 text-primary animate-spin inline mb-4" />
            <br />
            <span className="animate-pulse">One moment please</span>
          </div>
        ) : null}
        {!loading && !wiped ? (
          <>
            <h3 className="flex flex-row items-center gap-2 justify-between">
              <div>{props.title}</div>
              <WarningIcon className="w-10 h-10 text-error" />
            </h3>
            <p>
              <b>Current status:</b>
            </p>
            <PendingStatus {...{ pushModal, serial, csr }} />
            <p className="text-center">
              <button
                className="btn btn-error btn-outline mt-4"
                onClick={() =>
                  pushModal(
                    <ModalWrapper bg="error" bgOpacity={80}>
                      <div className="text-center">
                        <WarningIcon className="mx-auto w-24 h-24 text-error" />
                        <h2>There is no way back from this</h2>
                        <p>If you wipe the pending settings, you will need to start over.</p>
                        <button className="btn btn-error btn-lg" onClick={wipe}>
                          I understand, wipe anyway
                        </button>
                        <br />
                        <button className="btn btn-ghost mt-4">Cancel</button>
                      </div>
                    </ModalWrapper>
                  )
                }
              >
                Wipe Pending Settings
              </button>
              <br />
              <Link className="btn btn-ghost mt-2" href="/setup/subca-complete/">
                Cancel
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </LocalPageWrapper>
  )
}

export default WipeSubcaSettingsPage

export const getStaticProps = () => ({
  props: {
    title: 'Wipe Pending Settings',
    page: ['setup', 'subca-wipe'],
  },
})
