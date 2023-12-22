// Dependencies
import { iconSize } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { LeftIcon, RightIcon } from 'components/icons.mjs'

export const MainSideView = ({ children, page, title, side, sideTitle, Icon = null }) => {
  const [dense, setDense] = useState(false)

  return (
    <div className="flex flex-row-reverse gap-8 justify-between">
      <div
        className={`w-80 border-l border-2 border-y-0 border-r-0 shrink-0 pt-12 min-h-screen sticky top-4
          border-secondary bg-base-300 bg-opacity-40 transition-all ${dense ? '-mr-80' : '-mr-0'}`}
      >
        <button
          className={`w-full flex items-center justify-between py-2 uppercase text-primary ${
            dense
              ? 'flex-row -ml-10 rounded-full bg-accent text-accent-content px-2'
              : 'flex-row-reverse hover:bg-accent hover:text-accent-content px-4'
          }`}
          onClick={() => setDense(!dense)}
        >
          {dense ? (
            <LeftIcon className={iconSize} stroke={4} />
          ) : (
            <RightIcon className={iconSize} stroke={4} />
          )}
          <span>{sideTitle}</span>
        </button>
        {side}
      </div>
      <div className={`mx-auto p-8 w-full ${dense ? 'max-w-full' : 'max-w-4xl'}`}>
        <Breadcrumbs page={page} />
        <h1 className="capitalize flex max-w-4xl justify-between">
          {title}
          {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
        </h1>
        {children}
      </div>
    </div>
  )
}
