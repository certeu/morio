// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { KeyIcon } from 'components/icons.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'

const warning = (
  <Popout warning>
    <h4>Morio key data is highly sensitive</h4>
    <p>
      This data holds the cryptographic seeds that are required to bootstrap Morio.
      <br />
      It is <b>not safe to backup or store this data on disk</b> without adequate protection or
      encryption.
    </p>
  </Popout>
)

const ExportKeysPage = (props) => {
  const [keys, setKeys] = useState()
  const [error, setError] = useState(false)
  const { api } = useApi()
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const exportKeys = async () => {
    setLoadingStatus([true, 'Exporting key data'])
    const result = await api.exportKeys()
    if (result[1] === 200 && result[0].keys) {
      setKeys(result[0].keys)
      setLoadingStatus([true, 'Key data exported', true, true])
    } else {
      setError('Failed to export key data')
      setLoadingStatus([true, 'Failed to export key data', true, false])
    }
  }

  const clear = () => {
    setKeys()
    setError(false)
  }

  return (
    <PageWrapper {...props} role="root">
      <ContentWrapper {...props} Icon={KeyIcon} title={props.title}>
        <div className="max-w-4xl">
          {error ? (
            <Popout warning>
              <h4>Unable to export key data</h4>
              <p>This is unexpected. Is the API up?</p>
            </Popout>
          ) : keys ? (
            <>
              <h2>Exported Morio Key Data</h2>
              <Highlight title="Morio key data">
                <pre>{JSON.stringify(keys)}</pre>
              </Highlight>
              <Popout tip>
                <h5>
                  Store this data in <code>preseed.keys</code> to preseed a Morio instance with it
                </h5>
                <p>
                  Refer to the{' '}
                  <a href="https://morio.it/docs/guides/settings/preseed/">Preseeding Guide</a> for
                  all details.
                </p>
              </Popout>
              <p className="text-center">
                <button className="btn btn-neutral btn-outline" onClick={clear}>
                  Clear page
                </button>
              </p>
              {warning}
            </>
          ) : (
            <>
              <p>
                Morio&apos;s key data allows you to deploy different Morio instances with the same
                cryptographic DNA.
              </p>
              <p>
                This is an advanced use case that allows for blue/green deployments, or seamless
                migration of Morio clients between staging and production environments.
              </p>
              <p>You can click the button below to start the export of the Morio key data.</p>
              <p className="text-center">
                <button className="btn btn-primary btn-lg" onClick={exportKeys}>
                  Export key data
                </button>
              </p>
              {warning}
            </>
          )}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ExportKeysPage

export const getStaticProps = () => ({
  props: {
    title: 'Export Morio Keys',
    page: ['tools', 'export', 'keys'],
  },
})
