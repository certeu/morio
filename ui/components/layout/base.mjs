import { Sidebar } from './sidebar.mjs'

/*
 * The default full-page morio layout
 */
export const DefaultLayout = ({ page, children = [] }) => (
  <div className="flex flex-row items-start w-full justify-between p-0 gap-0 items-stretch min-h-screen">
    <Sidebar page={page} />
    <div className="grow w-full m-0 p-0 grow h-full min-h-screen">{children}</div>
  </div>
)
