// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'

export const MainSideView = ({ children, page, title, side, sideTitle, Icon = null }) => (
  <div className="flex flex-row-reverse gap-8 justify-between">
    <div className="w-80 shrink-0 pt-12 min-h-screen sticky top-4">
      <h3>{sideTitle}</h3>
      {side}
    </div>
    <div className="mx-auto p-8 w-full max-w-4xl">
      <Breadcrumbs page={page} />
      <h1 className="capitalize flex max-w-4xl justify-between">
        {title}
        {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
      </h1>
      {children}
    </div>
  </div>
)
