import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'

export const ContentWrapper = ({ page, title, Icon, children = null }) => (
  <div className="p-8 w-full">
    <div className="max-w-4xl">
      <Breadcrumbs page={page} />
    </div>
    <h1 className="capitalize flex max-w-4xl justify-between">
      {title}
      {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
    </h1>
    {children}
  </div>
)
