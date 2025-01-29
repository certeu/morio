import { useState } from 'react'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { NarrowIcon, WideIcon } from 'components/icons.mjs'

export const MainSideView = ({ children, page, title, side, sideTitle, Icon = null }) => {
  const [wide, setWide] = useState(false)

  return (
    <div className="flex flex-row-reverse gap-8 justify-between">
      <div className="w-80 shrink-0 pt-12 min-h-screen sticky top-4">
        <h3>{sideTitle}</h3>
        {side}
      </div>
      <div className={`mx-auto p-8 w-full ${wide ? '' : 'max-w-4xl'}`}>
        <div className="">
          <Breadcrumbs page={page} />
          <button
            onClick={() => setWide(!wide)}
            className="border-0 bg-transparent hover:cursor-pointer"
          >
            {wide ? <NarrowIcon /> : <WideIcon />}
          </button>
        </div>
        <h1 className={`flex ${wide ? '' : 'max-w-4xl'} justify-between`}>
          {title}
          {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
        </h1>
        {children}
      </div>
    </div>
  )
}
