import { useState } from 'react'
import { NarrowIcon, WideIcon  } from 'components/icons.mjs'
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'

export const ContentWrapper = ({ page, title, Icon, children = null }) => {
  const [wide, setWide] = useState(false)
  const wClass = wide ? 'max-w-screen' : 'max-w-4xl'

  return (
    <div className="p-8 w-full">
      <div className={`flex flex-row items-start justify-between ${wClass}`}>
        <Breadcrumbs page={page} />
        <button className="btn btn-ghost btn-sm" onClick={() => setWide(!wide)} title="Toggle between narrow and wide views">
          {wide ? <NarrowIcon /> : <WideIcon />}
        </button>
      </div>
      <h1 className={`capitalize flex justify-between ${wClass}`}>
        {title}
        {typeof Icon === 'function' ? <Icon className="w-16 h-16" /> : Icon}
      </h1>
      <div className={wClass}>{children}</div>
    </div>
  )
}
