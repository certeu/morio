import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { GroupIcon } from 'components/icons.mjs'
import { GroupDetail } from 'components/inventory/group.mjs'
import { useApi } from 'hooks/use-api.mjs'

export default function InventoryGroupPage({ id = false }) {
  const { api } = useApi()
  const [data, setData] = useState([])
  const [members, setMembers] = useState([])
  const [memberOf, setMemberOf] = useState([])
  const [title, setTitle] = useState('Loading group data...')

  const meta = {
    title: title ? id : 'Loading group data',
    page: ['inventory', 'groups', id ? id : 'unknown'],
    Icon: GroupIcon,
  }

  useEffect(() => {
    if (id)
      runGroupApiCall(api, id).then((result) => {
        setData(result)
        setTitle(result.fqdn)
      })
    runGroupMembersApiCall(api, id).then((result) => setMembers(result))
    runGroupMemberOfApiCall(api, id).then((result) => setMemberOf(result))
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id])

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <GroupDetail data={data} members={members} memberOf={memberOf} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

async function runGroupApiCall(api, id) {
  const result = await api.getInventoryGroup(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}
async function runGroupMembersApiCall(api, id) {
  const result = await api.getInventoryGroupMembers(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

async function runGroupMemberOfApiCall(api, id) {
  const result = await api.getInventoryGroupMemberOf(id)
  if (Array.isArray(result) && result[1] === 200) return result[0]
  else return false
}

export const getStaticProps = ({ params }) => ({
  props: {
    id: params.id,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
