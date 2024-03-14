import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { MorioIcon } from 'components/icons.mjs'
import { ActivateAccount } from 'components/accounts/index.mjs'

const MorioInvitePage = (props) => {
  const invite = props.params?.token?.[0] ? props.params.token[0].split('-').pop() : ''
  const user = props.params?.token?.[0]
    ? props.params.token[0].split('-').slice(0, -1).join('-')
    : ''

  return (
    <PageWrapper {...props} role={false}>
      <ContentWrapper {...props} Icon={MorioIcon} title={props.title}>
        <div className="max-w-2xl">
          <ActivateAccount invite={invite} user={user} />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default MorioInvitePage

export const getStaticProps = ({ params }) => ({
  props: {
    title: 'Activate a Morio Invite',
    page: ['morio', 'invite'],
    params,
  },
})

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})
