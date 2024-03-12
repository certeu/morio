// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { UserIcon } from 'components/icons.mjs'
import { ListAccounts, AddLocalAccount } from 'components/accounts/index.mjs'

const AccountsPage = (props) => (
  <PageWrapper {...props} role="manager">
    <ContentWrapper {...props} Icon={UserIcon} title={props.title}>
      <div className="max-w-4xl mdx">
        <AddLocalAccount />
        <ListAccounts />
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default AccountsPage

export const getStaticProps = () => ({
  props: {
    title: 'Accounts',
    page: ['tools', 'accounts'],
  },
})
