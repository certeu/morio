// Dependencies
import { rbac } from 'lib/utils.mjs'
// Hooks
import { useAccount } from 'hooks/use-account.mjs'
import { useEffect, useState } from 'react'
import { useScrollPosition } from '@n8tb1t/use-scroll-position'
import { useRouter } from 'next/router'
// Components
import Link from 'next/link'
import { QuestionIcon, LightThemeIcon, DarkThemeIcon } from 'components/icons.mjs'
import { GitHub } from 'components/brands.mjs'
import { MorioBanner } from 'components/branding.mjs'

export const NavButton = ({
  href,
  label,
  children,
  onClick = false,
  extraClasses = '',
  active = false,
  toggle = false,
  dense = false,
}) => {
  const className = `border-0 px-1 lg:px-3 xl:px-4 text-base text-center
    items-center rounded-b-lg grow-0 relative capitalize ${extraClasses}
    ${dense ? 'py-0' : 'py-2 md:py-4'}
    ${
      active
        ? 'bg-primary bg-opacity-30 text-base-content'
        : toggle
          ? 'text-secondary hover:bg-accent hover:text-accent-content'
          : 'text-base-content hover:bg-primary hover:text-primary-content'
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

const BannerMessage = () => null
//(
//  <div className="mt-14 -mb-12 text-center p-0.5">
//    <div className="flex flex-row gap-2 items-center justify-center w-full">
//      <WarningIcon className="w-5 h-5 text-warning" />
//      <span>Morio v{pkg.version} | this is alpha code</span>
//      <WarningIcon className="w-5 h-5 text-warning" />
//    </div>
//  </div>
//)

const isActive = (page, path) => path.slice(0, page.length) === page

export const Header = ({
  theme, // Name of the current theme (light or dark)
  toggleTheme, // Method to change the theme
}) => {
  const { account } = useAccount()
  const [user, setUser] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { asPath } = useRouter()

  /*
   * Avoid hydration errros
   */
  useEffect(() => {
    if (!user && account) setUser(true)
  }, [account])

  /*
   * Style header differently upon scroll (add shadow)
   */
  useScrollPosition(
    ({ currPos }) => {
      if (!scrolled && currPos.y < -20) setScrolled(true)
      else if (scrolled && currPos.y > -5) setScrolled(false)
    },
    [scrolled]
  )

  const operator = rbac(account.role, 'operator')

  return (
    <>
      <header
        className={`fixed top-0 left-0 bg-base-100 w-full z-20 ${
          scrolled ? 'drop-shadow' : ''
        } transition-shadow duration-200 ease-in`}
      >
        <div className="m-auto p-2 py-0 md:px-8">
          <div className="p-0 flex flex-row gap-0 justify-between items-center">
            <Link href="/" label="Home" title="Home" className="text-current hover:text-primary">
              <MorioBanner className="h-6" shadow />
            </Link>
            <div className="flex lg:px-2 flex-row items-start justify-between w-full max-w-6xl mx-auto">
              <div className="grow pl-4 justify-start flex flex-row">
                {operator ? (
                  <NavButton href="/settings" label="Settings" active={isActive('/settings', asPath)}>
                    Settings
                  </NavButton>
                ) : null}
                <NavButton
                  href="/status"
                  label="Status"
                  extraClasses="hidden lg:flex"
                  active={isActive('/status', asPath)}
                >
                  Status
                </NavButton>
                <NavButton href="/tools" label="Tools" active={isActive('/tools', asPath)}>
                  Tools
                </NavButton>
              </div>
              <div className="flex flex-row">
                <NavButton
                  href="/about"
                  label="Support"
                  extraClasses="hidden lg:flex"
                  active={isActive('/about', asPath)}
                >
                  About Morio
                </NavButton>
                {user ? (
                  <NavButton
                    href="/account"
                    label="Your Account"
                    active={isActive('/account', asPath)}
                  >
                    Your Account
                  </NavButton>
                ) : null}
              </div>
            </div>
            <NavButton onClick={toggleTheme} label="Change theme" toggle>
              {theme === 'dark' ? <LightThemeIcon /> : <DarkThemeIcon />}
            </NavButton>
            <NavButton href="https://morio.it/" label="Documentation on morio.it">
              <QuestionIcon />
            </NavButton>
            <NavButton href="https://github.com/certeu/morio" label="Source code on Github">
              <GitHub />
            </NavButton>
          </div>
        </div>
      </header>
      <BannerMessage scrolled={scrolled} />
    </>
  )
}
