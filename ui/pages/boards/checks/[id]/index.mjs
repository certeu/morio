import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CheckInCircleIcon } from 'components/icons.mjs'
import { Check } from 'components/boards/checks.mjs'

export default function HealthcheckPage ({ id }) {
  const meta = {
    title: `Health check`,
    page: ['boards', 'checks', id],
    Icon: CheckInCircleIcon
  }

  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Check id={id} />
      </ContentWrapper>
    </PageWrapper>
  )
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


