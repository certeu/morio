import { Header } from 'site/components/header/index.mjs'
import { Footer } from 'shared/components/footer/index.mjs'

export const LayoutWrapper = ({ children = [], header = false, footer = true, slug }) => (
  <div className="flex flex-col justify-between min-h-screen bg-base-100">
    {header && <Header slug={slug} />}
    <main className="grow transition-margin duration-300 ease-in-out">{children}</main>
    {footer && <Footer />}
  </div>
)
