import { useCookies } from 'react-cookie'
import { getQueryParams } from 'lib/utils.mjs'
import { useState, useEffect } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Link } from 'components/link.mjs'
import { OidcLayout } from 'components/layout/oidc.mjs'
import { BoolYesIcon, BoolNoIcon, FingerprintIcon } from 'components/icons.mjs'
import { MorioIcon, MorioWordmark } from 'components/branding.mjs'
import { useAccount } from 'hooks/use-account.mjs'

const OidcLoginPage = (props) => {
  const { account, logout } = useAccount()
  const [uid, setUid] = useState('')
  const [cookies] = useCookies(['morio'])
  useEffect(() => {
    try {
      setUid(getQueryParams('uid'))
    }
    catch (err) {
      console.log('failed to parse query parameters')
    }
  },[])

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
        <div className="p-4">
          <h4 className="px-4">
            You are currently signed in to Morio as <span className="text-warning font-bold">
            {account.user}<small>@</small>{account.provider}</span> using
            the <span className="text-warning font-bold">{account.role}</span> role
          </h4>
          <ul className="px-4 list list-inside m-4">
            <li className="flex flex-row items-center gap-2 py-1">You can:</li>
            <li className="flex flex-row items-center gap-2 py-1">
              <BoolYesIcon /> <b>Continue</b> with these credentials
            </li>
            <li className="flex flex-row items-center gap-2 py-1">
              <FingerprintIcon /> <b>Logout</b> to utilize a different account or role
            </li>
            <li className="flex flex-row items-center gap-2 py-1">
              <BoolNoIcon /> <b>Cancel</b> to back out safely
            </li>
          </ul>
          <div className="p-4">
            <form action={`/interaction/${uid}/login`} method="POST">
              <input type="hidden" name="prompt" value="login" />
              <input type="hidden" name="uid" value={uid} />
              <input type="hidden" name="token" value={cookies.morio} />
              <button type="submit" className="btn btn-secondary px-12 w-full">Continue</button>
            </form>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="btn btn-neutral btn-outline w-full" onClick={logout}>Logout</button>
              <Link className="btn btn-error btn-outline w-full" href="/">Cancel</Link>
            </div>
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
