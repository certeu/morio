import { useState } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { TipIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
import { Note  } from 'components/boards/note.mjs'

const key = 'notestream'

/**
 * A helper method to parse a Redis/ValKey stream into an object
 *
 * @param {array} stream - The Data from the cache in stream format
 * @return {object} data - The same data pased into an object structure
 */
const cacheStreamAsObj = (stream) => {
  if (!stream) return false
  const data = {}
  for (const entry of stream) {
    const [id, d] = entry
    data[id] = {}
    for (let i=0; i < d.length; i += 2) {
      if (d[i] === 'data')  {
        let parsed
        try {
          parsed = JSON.parse(d[i+1])
          data[id][d[i]] = parsed
        }
        catch (err) {
          console.log(`Failed to parse JSON`, d[i+1], err)
          data[id][d[i]] = d[i+1]
        }
      }
      else data[id][d[i]] = d[i+1]
    }
  }

  return data
}

/**
 * This method handles the actual query
 *
 * @param {object} api - The api from from useApi hook
 * @return {object} result - The query result or false in case of trouble
 */
const poll = async (api) => {
  const result = await api.getCacheKey(key)
  return result[1] === 200 ? result[0] : false
}


const FixmeDashboardsPage = (props) => {

  const [tip, setTip] = useState(true)
  const { api } = useApi()

  const { data, isLoading, error } = useQuery ({
    queryKey: [key],
    queryFn: () => poll(api),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  if (isLoading) return (
    <PageWrapper title="Notes" page={['dashboards', 'notes']}>
      <ContentWrapper title="Notes" page={['dashboards', 'notes']} Icon={TipIcon}>
        <div className="max-w-4xl">
          loading...
        </div>
      </ContentWrapper>
    </PageWrapper>
  )

  return (
    <PageWrapper title="Notes" page={['dashboards', 'notes']}>
      <ContentWrapper title="Notes" page={['dashboards', 'notes']} Icon={TipIcon}>
        <div className="max-w-4xl">
          {tip ? (
            <Popout tip>
              <h4>What are notes? And why are notes?</h4>
              <p>
                Notes are closely related to the Tap service.
                This service handles stream processing and typically handles all log entries flowing through Morio.
              </p>
              <p>
                This creates a potential feedback loop when logging inside a Tap handler will cause these log lines
                to be ingested and also processed by the same Tap handler, which will log more data, and things
                will snowball from there.
              </p>
              <p>
                So as a general rule, Tap handlers never log, but instead add <code>notes</code> to the cache directly.
                <br />
                As such, these notes typically provide information about
                unexptected data or formatting issues detected by a Tap handler.
              </p>
              <p className="text-right">
                <button className="btn btn-primary btn-outline" onClick={() => setTip(false)}>Dismiss Tip</button>
              </p>
            </Popout>
          ) : null}
          {Object.entries(cacheStreamAsObj(data.value)).map(([id, note]) => <Note key={id} id={id} note={note} />)}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default FixmeDashboardsPage

