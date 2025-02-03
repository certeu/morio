// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { KeyIcon } from 'components/icons.mjs'
import { KvStore } from './[...key].mjs'

const KvPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={KeyIcon} title={props.title}>
      <div className="max-w-4xl">
        <KvStore />
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default KvPage

export const getStaticProps = () => ({
  props: {
    title: 'KV Store',
    page: ['tools', 'kv'],
  },
})
