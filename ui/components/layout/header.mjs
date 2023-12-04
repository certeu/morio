// Components
import Link from 'next/link'
import { MenuIcon, LightThemeIcon, DarkThemeIcon } from 'components/icons.mjs'
import { MorioLogo } from 'components/logos/morio.mjs'

export const iconSize = 'h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12'

export const NavButton = ({
  href,
  label,
  color,
  children,
  onClick = false,
  extraClasses = '',
  active = false,
}) => {
  const className =
    'border-0 px-1 lg:px-3 xl:px-4 text-base py-3 md:py-4 text-center flex flex-col items-center 2xl:w-36 ' +
    `hover:bg-${color} text-${color} hover:text-neutral grow xl:grow-0 relative ${extraClasses} ${
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

export const NavSpacer = () => (
  <div className="hidden xl:block text-base lg:text-4xl font-thin opacity-30 px-0.5 lg:px-2">|</div>
)

export const Header = ({
  theme,  // Name of the current theme (light or dark)
  toggleTheme, // Method to change the theme
}) => (
  <header
    className={`
    fixed bottom-0 left-0 md:relative
    bg-neutral drop-shadow-xl w-full
    border-t border-solid border-base-300 z-20
  `}
  >
    <div className="m-auto md:px-8">
      <div className="p-0 flex flex-row gap-2 justify-between text-neutral-content items-center">
        {/* Non-mobile content */}
        <div className="hidden lg:flex lg:px-2 flex-row items-center justify-between xl:justify-center w-full">
          <NavButton
            href="/"
            label="Home"
          >
            <MorioLogo className="h-16 text-secondary"/>
          </NavButton>
          <NavSpacer />
          <NavButton href="/guides" label="Guides" extraClasses="hidden lg:flex">
            alt
          </NavButton>
          <NavSpacer />
          <NavButton onClick={toggleTheme} label="Change theme" extraClasses="hidden lg:flex">
            {theme === 'dark' ? <LightThemeIcon /> : <DarkThemeIcon />}
          </NavButton>
        </div>

        {/* Mobile content */}
        <div className="flex lg:hidden flex-row items-center justify-between w-full">
          <NavButton href="/guides" label="Guides" extraClasses="hidden lg:flex">
            mobile
          </NavButton>
        </div>
      </div>
    </div>
  </header>
)


