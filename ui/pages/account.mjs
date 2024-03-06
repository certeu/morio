import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { useAccount } from 'hooks/use-account.mjs'
import { RestartIcon, UserIcon, LogoutIcon } from 'components/icons.mjs'
import { TimeToGo } from 'components/time-ago.mjs'

const AccountPage = (props) => {
  const { account, logout, renewToken } = useAccount()

  return (
    <PageWrapper {...props} Icon={UserIcon}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl">
          {account ? (
            <>
              <h2>You</h2>
              <p>
                You are user <span className="badge badge-primary">{account.user}</span> and were
                authenticated via the{' '}
                <span className="badge badge-neutral">{account.provider}</span> authentication
                provider.
              </p>
              <h2>Your roles</h2>
              <p>
                Your hold the following roles:{' '}
                {account.roles.map((role) => (
                  <span className="badge badge-success ml-1" key={role}>
                    {role}
                  </span>
                ))}
              </p>
              <h2>Your access</h2>
              <p>
                Your access will expire in{' '}
                <b>
                  <TimeToGo time={account.exp} />
                </b>
                .
              </p>
              <div className="flex flex-row gap-2">
                <button className="btn btn-primary" onClick={renewToken}>
                  <RestartIcon />
                  <span className="pl-4"> Renew Token</span>
                </button>
                <button className="btn btn-neutral" onClick={logout}>
                  <LogoutIcon />
                  <span className="pl-4"> Logout</span>
                </button>
              </div>
              <h2>Your data</h2>
              <p>Your raw account data is included below:</p>
              <Highlight js={account} title="Account Data" />
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
