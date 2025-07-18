import { getQueryParams } from 'lib/utils.mjs'
import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Link } from 'components/link.mjs'
import { OidcLayout } from 'components/layout/oidc.mjs'
import { BoolYesIcon, WarningIcon } from 'components/icons.mjs'
import { MorioIcon, MorioWordmark } from 'components/branding.mjs'
import { useAccount } from 'hooks/use-account.mjs'

const OidcLoginPage = (props) => {
  const { account } = useAccount()
  const [uid, setUid] = useState('')
  const [name, setName] = useState('NoName')
  const [by, setBy] = useState('NoBy')

  useEffect(() => {
    try {
      setUid(getQueryParams('uid'))
      setName(getQueryParams('name'))
      setBy(getQueryParams('by'))
    }
    catch (err) {
      console.log('failed to parse query parameters')
    }
  },[])

  // Scopes and Claims
  const scopes = ['openid', 'profile']
  const claims = ['sub', 'preferred_username', 'user', 'provider', 'role', 'available_roles']

  return (
    <PageWrapper {...props} layout={OidcLayout} header={false}>
      <div className="p-8 w-full max-w-2xl mx-auto mt-12">
        <div className="border border-secondary p-0 rounded-lg shadow">
          <div className={`flex justify-between px-6 py-3 border-b border-secondary rounded-t-lg`}>
            <div className="flex flex-row gap-4 items-center">
              <div className="font-medium">Sign in with <MorioWordmark /></div>
            </div>
            <MorioIcon className="w-14 h-14"/>
          </div>
        <div className="p-4 px-8">
          <h4>
            <span className="text-warning">{name}</span> by <span className="text-warning">{by}
            </span> wants to access your Morio account
          </h4>
          <p className="mt-4">
            This will allow <span className="text-warning">{name}</span> to:
          </p>
          <ul className="list list-inside ml-4">
            <li className="flex flex-row items-center gap-2">
              <BoolYesIcon /> Read data from
              the <span className="text-warning font-bold">{account.user}<small>@</small>{account.provider}
              </span> Morio account
            </li>
            <li className="flex flex-row items-center gap-2">
              <BoolYesIcon /> Act on your behalf, with the <b className="text-warning">{account.role}</b> role
            </li>
          </ul>
          <div className="py-4">
            <h6 className="flex flex-row items-center gap-4 my-4">
              <WarningIcon className="text-warning h-6 w-6"/>
              <div>
                Make sure that you
                trust <span className="text-warning font-bold">{name}
                </span> by <span className="text-warning font-bold">{by}
                </span> before you allow this
              </div>
            </h6>
            <p>
              You may be sharing sensitve information with this website or app.
              Please ensure that you can trust its developer(s) before you allow this access.
            </p>
              <form action={`/interaction/${uid}/confirm`} method="POST">
                <input type="hidden" name="prompt" value="consent" />
                {scopes.map(scope => <input key={scope} type="hidden" name="grantedScopes" value={scope} />)}
                {claims.map(claim => <input key={claim} type="hidden" name="grantedClaims" value={claim} />)}
                <button type="submit" className="btn btn-secondary w-full">Allow</button>
              </form>
              <Link className="btn btn-error btn-outline mt-2 w-full" href="/">Cancel</Link>
          </div>
        </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default OidcLoginPage

export const getStaticProps = () => ({
  props: {
    title: 'Sign in with Morio',
    page: ['oidc', 'login'],
  },
})
