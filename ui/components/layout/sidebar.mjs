// Hooks
import { useState } from 'react'
// Components
import {
  RightIcon,
  LeftIcon,
  ConfigurationIcon,
  ComponentIcon,
  StatusIcon,
} from 'components/icons.mjs'
import { Link } from 'components/link'

const icons = {
  components: <ComponentIcon />,
  config: <ConfigurationIcon />,
  status: <StatusIcon />,
}

const links = {
  components: 'Components',
  config: 'Configuration',
  status: 'Status',
}

export const NavButton = ({
  href,
  label,
  children,
  onClick = false,
  active = false,
  extraClasses = 'lg:hover:bg-secondary lg:hover:text-secondary-content',
}) => {
  const className = `w-full flex flex-row items-center px-4 py-2 ${extraClasses} ${
    active
      ? 'bg-secondary text-secondary-content font-bold'
      : 'bg-neutral text-neutral-content'
  }`
  const span = <span className="block grow text-left">{label}</span>

  return onClick ? (
    <button {...{ onClick, className }} title={label}>
      {span}
      {children}
    </button>
  ) : (
    <Link {...{ href, className }} title={label}>
      {span}
      {children}
    </Link>
  )
}

export const Sidebar = ({ page }) => {
  const [dense, setDense] = useState(false)
  const iconSize = 'h-6 w-6 grow-0'

  return (
    <div className={`w-64 min-h-screen pt-4
      bg-neutral
      shrink-0 grow-0 self-stretch
      transition-all drop-shadow-xl
      border-l-0 border-t-0 border-b-0 border-2 border-secondary
      ${dense ? '-ml-52' : 'ml-0'}`}
    >
      <aside
        className={`
        sticky top-4 lg:top-28
        group
      `}
      >
        <div className="flex flex-col items-center w-full">
          <NavButton
            onClick={() => setDense(!dense)}
            label="Operator menu"
            extraClasses="uppercase font-bold hidden text-sm lg:flex text-secondary bg-neutral hover:bg-accent hover:text-accent-content"
          >
            {dense ? (
              <RightIcon
                className={`${iconSize} group-hover:animate-[bounceright_1s_3] animate-[bounceright_1s_3]`}
                stroke={4}
              />
            ) : (
              <LeftIcon className={`${iconSize} animate-bounce-right animate[bounceleft_1s_3]`} stroke={4} />
            )}
          </NavButton>
          {Object.keys(links).map(link => (
            <NavButton
              href={`/${link}`}
              label={links[link]}
              active={page[0] === link}
            >
            {icons[link]}
            </NavButton>
          ))}
        </div>
      </aside>
    </div>
  )
}
