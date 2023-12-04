// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useContext, useEffect, useState } from 'react'
import { useTheme } from 'hooks/use-theme.mjs'
// Components
import Head from 'next/head'
import { DefaultLayout } from './base.mjs'
import { Header } from './header.mjs'
import { Footer } from './footer.mjs'

/*
 * This React component should wrap all pages
 */
export const PageWrapper = ({
  children = [],
  footer = true,
  header = true,
  layout = DefaultLayout,
  page = [''],
  title = 'morio',
}) => {

  /*
   * Create slug from page array
   */
  const slug = page.join('/')

  /*
   * Contexts that are provided to all pages
   * - Modal: Simple access to modal window
   * - Loading: Simple access to loading indicator
   */
  const { modalContent } = useContext(ModalContext)
  const { LoadingStatus } = useContext(LoadingStatusContext)

  /*
   * This forces a re-render upon initial bootstrap of the app
   * This is needed to avoid hydration errors because theme can't be set reliably in SSR
   */
  const { theme, toggleTheme } = useTheme()
  const [currentTheme, setCurrentTheme] = useState()
  useEffect(() => setCurrentTheme(theme), [currentTheme, theme])

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
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LoadingStatus />
      <div className="flex flex-col justify-between min-h-screen bg-base-100 w-full">
        {header && <Header {...{ theme, toggleTheme }} />}
        <main>
          {Layout
            ? <Layout {...{ title }}>{children}</Layout>
            : children
          }
        </main>
        {footer && <Footer />}
      </div>
      {typeof modalContent === 'function' ? modalContent() : modalContent}
    </div>
  )
}
