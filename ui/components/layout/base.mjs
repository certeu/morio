import { Sidebar } from './sidebar.mjs'

/*
 * The default full-page morio layout
 */
export const DefaultLayout = ({ page, role, children = [] }) => (
  <div className="flex flex-row items-start w-full justify-between p-0 gap-0 items-stretch min-h-screen xl:gap-8">
    <Sidebar page={page} role={role} />
    <div className="w-full m-0 p-0 h-full min-h-screen flex-auto">{children}</div>
  </div>
)
