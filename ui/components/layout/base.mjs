import { Sidebar } from './sidebar.mjs'
import { Breadcrumbs } from './breadcrumbs.mjs'

/*
 * The default full-page morio layout
 */
export const DefaultLayout = ({ title, page, children = [] }) => (
  <div className="flex flex-row items-start w-full justify-between p-0 gap-0 lg:gap-4 xl:gap-8 3xl:gap-12 items-stretch min-h-[75vh]">
    <Sidebar page={page} />
    <div className="grow w-full m-auto my-8 grow">
      {title && (
        <div className="xl:pl-4 bg-base-100">
          <Breadcrumbs page={page} />
          <h1 className="break-words">{title}</h1>
        </div>
      )}
      <div className="xl:pl-4">{children}</div>
    </div>
  </div>
)
