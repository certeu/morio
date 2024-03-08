import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { RestartIcon, UserIcon, LogoutIcon } from 'components/icons.mjs'
import { TimeToGo } from 'components/time-ago.mjs'
import { roles } from 'config/roles.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const dangerRoles = roles.slice(-2)

const AccountPage = (props) => {
  const { account, logout, renewToken } = useAccount()

  const level = roles.indexOf(account.role)
  const maxLevel = roles.indexOf(account.maxRole)

  return (
    <PageWrapper {...props} Icon={UserIcon}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl">
          {account ? (
            <>
              <Tabs tabs="Account Data, Account Token">
                <Tab key="account">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-36 text-right">Description</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="w-36 text-right font-bold">Username</td>
                        <td>
                          <span className="badge badge-primary">{account.user}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-36 text-right font-bold">Current role</td>
                        <td>
                          <span
                            className={`badge badge-${
                              dangerRoles.includes(account.role) ? 'warning' : 'success'
                            }`}
                          >
                            {account.role}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-36 text-right font-bold">Maximum role</td>
                        <td>
                          <span
                            className={`badge badge-${
                              dangerRoles.includes(account.maxRole) ? 'warning' : 'success'
                            }`}
                          >
                            {account.maxRole}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-36 text-right font-bold">Identity Provider</td>
                        <td>
                          <span className="badge badge-neutral">{account.provider}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-36 text-right font-bold">Session</td>
                        <td>
                          Your session will expire in{' '}
                          <b>
                            <TimeToGo time={account.exp} />
                          </b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Tab>
                <Tab key="token">
                  <Highlight js={account} title="JSON Web Token" />
                </Tab>
              </Tabs>
              <div className="flex flex-row gap-8 justify-center">
                <button className="btn btn-primary" onClick={renewToken}>
                  <RestartIcon />
                  <span className="pl-4"> Renew Token</span>
                </button>
                <button className="btn btn-neutral" onClick={logout}>
                  <LogoutIcon />
                  <span className="pl-4"> Logout</span>
                </button>
              </div>
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
