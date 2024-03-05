// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useTheme } from 'hooks/use-theme.mjs'
import { useAccount } from 'hooks/use-account.mjs'
// Components
import Head from 'next/head'
import { DefaultLayout } from './base.mjs'
import { Header } from './header.mjs'
import { Footer } from './footer.mjs'
import { AuthWrapper } from 'components/auth/wrapper.mjs'

/*
 * This React component should wrap all pages
 */
export const PageWrapper = ({
  children = [],
  footer = true,
  header = true,
  layout = DefaultLayout,
  page = [''],
  title = false,
  role = 'user',
}) => {
  /*
   * Contexts that are provided to all pages
   * - Modal: Simple access to modal window
   * - Loading: Simple access to loading indicator
   */
  const { modalContent } = useContext(ModalContext)
  const { LoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Load the account so signing out forces a rerender
   */
  const { account, setAccount } = useAccount()

  /*
   * This forces a re-render upon initial bootstrap of the app
   * This is needed to avoid hydration errors because theme can't be set reliably in SSR
   */
  const { theme, toggleTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState()
  useEffect(() => {
    if (currentTheme !== theme) setCurrentTheme(theme)
  }, [currentTheme, theme])

  /*
   * Make layout prop into a (uppercase) component
   */
  const Layout = layout

  /*
   * Return wrapper
   */
  return (
    <div
      data-theme={currentTheme} // This facilitates CSS selectors
      key={currentTheme} // This forces the data-theme update
    >
      <Head>
        <title>{title ? `Morio: ${title}` : 'Morio'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <LoadingStatus />
      <AuthWrapper {...{ account, setAccount, role }}>
        <div className="flex flex-col justify-between bg-neutral w-full">
          {header && <Header {...{ theme, toggleTheme, page }} />}
          <main className={`bg-base-100 grow ${header ? 'mt-12' : ''}`}>
            {Layout ? <Layout {...{ title, page }}>{children}</Layout> : children}
          </main>
          {footer && <Footer />}
        </div>
      </AuthWrapper>
      {modalContent}
    </div>
  )
}
