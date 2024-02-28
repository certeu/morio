// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ClosedLockIcon, LeftIcon } from 'components/icons.mjs'
import { TextInput, ToggleInput } from 'components/inputs.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'

/**
 * The actual component, in case we want to extract it for re-use later
 */
const Decrypt = () => {
  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * State
   */
  const [result, setResult] = useState(false)
  const [data, setData] = useState('')

  /*
   * We'll need the API
   */
  const { api } = useApi()

  /*
   * Method that triggers the API request
   */
  const process = async () => {
    setLoadingStatus([true, 'Contacting Morio Management API'])
    let json
    try {
      json = JSON.parse(data)
    } catch (err) {
      setResult(err)
      setLoadingStatus([true, 'Failed to parse input as JSON', true, false])
      return
    }

    const [body, status] = await api.decrypt(json)
    if (status === 200) {
      setResult(body)
      setLoadingStatus([true, 'decryption completed', true, true])
    } else {
      setLoadingStatus([true, 'Decryption request failed', true, false])
    }
  }

  /*
   * Return result (if we have it)
   */
  if (result) {
    const btn = (
      <button className="btn btn-primary btn-outline" onClick={() => setResult(false)}>
        <LeftIcon stroke={3} /> Back
      </button>
    )
    if (result instanceof Error)
      return (
        <>
          <h2>We were unable to decrypt your data</h2>
          <Highlight js={result.data} title="Error" />
          {btn}
        </>
      )
    return (
      <>
        <h2>Your data has been decrypted</h2>
        <Highlight js={result.data} title="Decrypted Data" />
        {btn}
      </>
    )
  }

  /*
   * Return form
   */
  return (
    <>
      <TextInput
        placeholder={`{
  "iv": "initialization vector",
  "ct": "ciphertext"
}`}
        label="Ciphertext"
        labelBL="A multi-line description"
        valid={() => true}
        current={data}
        update={setData}
      />
      <p className="text-center">
        <button onClick={process} className="btn btn-primary btn-lg">
          Decrypt Data
        </button>
      </p>
    </>
  )
}

const DecryptPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ClosedLockIcon} title={props.title}>
        <div className="max-w-4xl">
          <Decrypt />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DecryptPage

export const getStaticProps = () => ({
  props: {
    title: 'Decrypt data',
    page: ['tools', 'decrypt'],
  },
})
