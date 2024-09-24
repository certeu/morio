// Hooks
import { useState } from 'react'
// Components
import { RightIcon, LeftIcon } from 'components/icons.mjs'
import { MainMenu, iconProps } from 'components/navigation/main-menu.mjs'

export const Sidebar = ({ page, role }) => {
  const [dense, setDense] = useState(false)

  return (
    <div
      className={`2xl:w-96 lg:w-64 min-h-screen pt-4
      shrink-0 grow-0 self-stretch
      transition-all
      ${dense ? 'lg:-ml-[13rem] 2xl:-ml-[21rem]' : 'ml-0'}`}
    >
      <aside className="sticky top-4 lg:top-24">
        <div className="flex flex-col items-center w-full">
          <button
            onClick={() => setDense(!dense)}
            label="Navigation"
            className="flex flex-row justify-between uppercase font-think text-sm text-secondary hover:bg-accent hover:text-accent-content w-full px-4 py-2 items-center rounded-r-lg"
          >
            Navigation
            <div className="w-12 -mr-4 text-center flex items-center justify-center">
              {dense ? (
                <RightIcon className={iconProps.className} stroke={4} />
              ) : (
                <LeftIcon className={iconProps.className} stroke={4} />
              )}
            </div>
          </button>
          <MainMenu current={page} dense={dense} role={role} />
        </div>
      </aside>
    </div>
  )
}
