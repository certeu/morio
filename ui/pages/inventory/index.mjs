import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ServersIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { useApi } from 'hooks/use-api.mjs'

const meta = {
  title: 'Inventory',
  page: ['inventory'],
  Icon: ServersIcon,
}

export default function InventoryPage() {
  const { api } = useApi()

  const [data, setData] = useState()
  const [count, setCount] = useState(0)

  useEffect(() => {
    runApiCall(api).then(result => setData(result))
  },[count])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <button className="btn btn-primary" onClick={() => setCount(count+1)}>Trigger Update</button>
          <Popout fixme>
            <h4>Apologies, but this is a work in progress</h4>
            <p>This page is here to indicate the direction we are going in, but we are not there yet.</p>
          </Popout>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}


async function runApiCall (api) {
  const result = api.getInventoryHosts()
  return result
}
