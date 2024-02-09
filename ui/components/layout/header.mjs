// Components
import Link from 'next/link'
import { LightThemeIcon, DarkThemeIcon } from 'components/icons.mjs'
import { MorioLogo } from 'components/logos/morio.mjs'

export const NavButton = ({
  href,
  label,
  children,
  onClick = false,
  extraClasses = '',
  active = false,
}) => {
  const className =
    'dark border-0 px-1 lg:px-3 xl:px-4 text-base py-3 md:py-4 text-center items-center ' +
    `hover:bg-accent hover:text-accent-content grow-0 relative capitalize ${extraClasses} ${
      active ? 'font-heavy' : ''
    }`

  return onClick ? (
    <button {...{ onClick, className }} title={label}>
      {children}
    </button>
  ) : (
    <Link {...{ href, className }} title={label}>
      {children}
    </Link>
  )
}

export const Header = ({
  theme, // Name of the current theme (light or dark)
  toggleTheme, // Method to change the theme
}) => (
  <header
    className={`
    fixed top-0 left-0
    bg-neutral drop-shadow-xl w-full
    border-2 border-t-0 border-l-0 border-r-0 border-solid border-accent z-20
  `}
  >
    <div className="m-auto p-2 lg:py-0 md:px-8">
      <div className="p-0 flex flex-row gap-2 justify-between text-neutral-content items-center">
        <div className="flex lg:px-2 flex-row items-center justify-between w-full max-w-7xl mx-auto">
          <Link href="/" label="Home" className="text-secondary hover:text-accent py-0">
            <MorioLogo className="h-8" noLine />
          </Link>
          <div className="grow pl-4 justify-start flex flex-row">
            <NavButton href="/config" label="Configuration" extraClasses="hidden lg:flex">
              Configuration
            </NavButton>
            <NavButton href="/docs" label="Documentation" extraClasses="hidden lg:flex">
              Documentation
            </NavButton>
            <NavButton href="/status" label="Status" extraClasses="hidden lg:flex">
              Status
            </NavButton>
            <NavButton href="/tools" label="Status" extraClasses="hidden lg:flex">
              Tools
            </NavButton>
          </div>
          <div className="flex flex-row">
            <NavButton href="/support" label="Support" extraClasses="hidden lg:flex">
              support
            </NavButton>
            <NavButton onClick={toggleTheme} label="Change theme" extraClasses="hidden lg:flex">
              {theme === 'dark' ? <LightThemeIcon /> : <DarkThemeIcon />}
            </NavButton>
          </div>
        </div>
      </div>
    </div>
  </header>
)
