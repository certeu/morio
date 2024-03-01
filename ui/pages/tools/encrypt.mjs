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
import { Highlight } from 'components/highlight.mjs'

/**
 * The actual component, in case we want to extract it for re-use later
 */
const Encrypt = () => {
  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * State
   */
  const [result, setResult] = useState(false)
  const [data, setData] = useState('')
  const [json, setJson] = useState(false)

  /*
   * We'll need the API
   */
  const { api } = useApi()

  /*
   * Method that triggers the API request
   */
  const process = async () => {
    setLoadingStatus([true, 'Contacting Morio Management API'])
    let theData = data
    if (json) {
      try {
        theData = JSON.parse(data)
      } catch (err) {
        setResult(err)
        setLoadingStatus([true, 'Unable to parse data as JSON', true, false])
        return
      }
    }
    const [body, status] = await api.encrypt(theData)
    if (status === 200) {
      setResult(body)
      setLoadingStatus([true, 'Encryption completed', true, true])
    } else {
      setLoadingStatus([true, 'Encryption request failed', true, false])
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
          <h2>We were unable to encrypt your data</h2>
          <Highlight js={result} title="Error" />
          {btn}
        </>
      )
    return (
      <>
        <h2>Your data has been encrypted</h2>
        <Highlight js={result} title="Encrypted Data" />
        <p>If you prefer it on a single line:</p>
        <Highlight title="Encrypted Data">{JSON.stringify(result)}</Highlight>
        {btn}
      </>
    )
  }

  /*
   * Return form
   */
  return (
    <>
      <ToggleInput
        label="Treat data as JSON"
        valued={[true, false]}
        labels={['JSON', 'Text']}
        update={(val) => setJson(val)}
        current={json}
      />
      <TextInput
        placeholder={json ? 'Your JSON here' : 'Your data here'}
        label={json ? 'JSON' : 'Data'}
        labelBL="A multi-line description"
        valid={() => true}
        current={data}
        update={setData}
      />
      <p className="text-center">
        <button onClick={process} className="btn btn-primary btn-lg">
          Encrypt {json ? 'JSON' : 'Data'}
        </button>
      </p>
    </>
  )
}

const EncryptPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={ClosedLockIcon} title={props.title}>
        <div className="max-w-4xl">
          <Encrypt />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default EncryptPage

export const getStaticProps = () => ({
  props: {
    title: 'Encrypt data',
    page: ['tools', 'encrypt'],
  },
})
