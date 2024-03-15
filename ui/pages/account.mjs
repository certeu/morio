import { useState } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { UserIcon } from 'components/icons.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import {
  AccountOverview,
  AccountApiKeys,
  LogoutButton,
  AccountToken,
  RenewTokenButton,
  NewApiKeyButton,
  ShowTokenButton,
} from 'components/account.mjs'

const AccountPage = (props) => {
  const { account, logout, renewToken } = useAccount()
  const [showToken, setShowToken] = useState(false)

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={UserIcon}>
        <div className="max-w-4xl">
          {account ? (
            <>
              <Tabs tabs="Account Data, API Keys">
                <Tab key="account">
                  <AccountOverview />
                  <div className="grid grid-cols-3 gap-4 items-center my-6">
                    <ShowTokenButton />
                    <RenewTokenButton />
                    <LogoutButton />
                  </div>
                  {showToken ? <AccountToken /> : null}
                </Tab>
                <Tab key="apikeys">
                  <AccountApiKeys />
                  <div className="grid grid-cols-3 gap-4 items-center my-6">
                    <span></span>
                    <NewApiKeyButton />
                    <span></span>
                  </div>
                </Tab>
              </Tabs>
            </>
          ) : null}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default AccountPage

export const getStaticProps = () => ({
  props: {
    title: 'Your Account',
    page: ['account'],
  },
})
