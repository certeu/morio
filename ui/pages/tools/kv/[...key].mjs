// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { UlIcon, KeyIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { linkClasses } from 'components/link.mjs'

/**
 * The actual component, in case we want to extract it for re-use later
 */
export const KvStore = ({ k = '' }) => {
  /*
   * State
   */
  const [key, setKey] = useState(k)
  const [keys, setKeys] = useState([])
  const [val, setVal] = useState('')
  const [glob, setGlob] = useState('')

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * We'll need the API
   */
  const { api } = useApi()

  /*
   * Method that triggers the API request
   */
  const kvWrite = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const result = await api.kvWrite(key, val)
    if (result[1] === 204) {
      setLoadingStatus([true, 'Key written', true, true])
    } else if (result[1] === 403) {
      setLoadingStatus([true, `Access denied when contacting the API`, true, false])
    } else {
      setLoadingStatus([true, 'Failed to write key', true, false])
    }
  }
  const kvRead = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [body, status] = await api.kvRead(key)
    if (status === 200) {
      setVal(body.value)
      setLoadingStatus([true, `Read key ${key}`, true, true])
    } else if (status === 403) {
      setLoadingStatus([true, `Access denied when contacting the API`, true, false])
    } else {
      setLoadingStatus([true, 'Failed to read key', true, false])
    }
  }
  const kvGlob = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [body, status] = await api.kvGlob(glob)
    if (status === 200) {
      setKeys(body)
      setLoadingStatus([true, `Found ${body.length} keys`, true, true])
    } else if (status === 403 && body.title) {
      setLoadingStatus([true, `Access denied when contacting the API`, true, false])
    } else {
      setLoadingStatus([true, 'Failed to load keys from the API', true, false])
    }
  }
  const kvList = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [body, status] = await api.kvList()
    if (status === 200) {
      setKeys(body)
      setLoadingStatus([true, `Found ${body.length} keys`, true, true])
    } else if (status === 403 && body.title) {
      setLoadingStatus([true, `Access denied when contacting the API`, true, false])
    } else {
      setLoadingStatus([true, 'Failed to load keys from the API', true, false])
    }
  }
  const kvDel = async () => {
    setLoadingStatus([true, 'Contacting Morio API'])
    const [body, status] = await api.kvDel(key)
    if (status === 204) {
      setKeys(body)
      setLoadingStatus([true, `Removed key: ${key}`, true, true])
    } else if (status === 403 && body.title) {
      setLoadingStatus([true, `Access denied when contacting the API`, true, false])
    } else {
      setLoadingStatus([true, 'Failed to remove key', true, false])
    }
  }

  return (
    <>
      <div className="flex flex-row gap-2 items-end">
        <StringInput
          placeholder="**"
          label="Key glob"
          valid={true}
          current={glob}
          update={setGlob}
        />
        <button onClick={kvGlob} className="btn btn-primary" disabled={!glob || glob.length === 0}>
          Search Keys
        </button>
        <button onClick={kvList} className="btn btn-primary btn-outline">
          <UlIcon />
        </button>
      </div>
      {keys.length > 0 ? (
        <>
          <h5>Search results</h5>
          <ul>
            {keys.map((k) => (
              <li key={k}>
                <button key={k} onClick={() => setKey(k)} className={`text-primary ${linkClasses}`}>
                  {k}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="flex flex-row gap-2 items-end">
        <StringInput
          placeholder="morio/ui/markdown/home"
          label="Key"
          valid={true}
          current={key}
          update={setKey}
        />
        <button onClick={kvRead} className="btn btn-primary">
          Read Key
        </button>
        <button onClick={kvDel} className="btn btn-error">
          <TrashIcon />
        </button>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <TextInput
          placeholder="Your value here"
          label="Value"
          valid={true}
          current={val}
          update={setVal}
        />
        <button onClick={kvWrite} className="btn btn-primary">
          Write Key
        </button>
      </div>
    </>
  )
}

const KvPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={KeyIcon} title={props.title}>
      <div className="max-w-4xl">
        <KvStore k={Array.isArray(props.k) ? props.k.join('/') : props.k} />
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default KvPage

export const getStaticProps = ({ params }) => ({
  props: {
    title: 'KV Store',
    page: ['tools', 'kv', ...(Array.isArray(params.key) ? params.key : [params.key])],
    k: params.key,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
