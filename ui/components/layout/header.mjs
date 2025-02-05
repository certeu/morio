// Hooks
import { useState } from 'react'
import { useScrollPosition } from '@n8tb1t/use-scroll-position'
import { useRouter } from 'next/router'
import { useApi } from 'hooks/use-api.mjs'
import { useQuery } from '@tanstack/react-query'
// Components
import Link from 'next/link'
import { TipIcon, QuestionIcon, LightThemeIcon, DarkThemeIcon } from 'components/icons.mjs'
import { GitHub } from 'components/brands.mjs'
import { MorioBanner } from 'components/branding.mjs'
import { Markdown } from 'components/markdown.mjs'

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

const BannerMessage = () => {
  const { api } = useApi()
  const key = 'morio/ui/markdown/banner'
  const { data } = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const result = await api.kvRead(key)
      if (result[1] === 200 && result[0].value) return result[0].value
      return false
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
  })

  return data ? (
    <div className="mt-14 -mb-12 text-center py-1">
      <div className="flex flex-row gap-2 items-center justify-center w-full bg-gradient-to-r from-success/20 via-warning/30 to-success/20 py-1">
        <TipIcon className="w-5 h-5 text-accent" />
        <Markdown className="mdx dense">{data}</Markdown>
        <TipIcon className="w-5 h-5 text-accent" />
      </div>
    </div>
  ) : null
}

const isActive = (page, path) => path.slice(0, page.length) === page

export const Header = ({
  theme, // Name of the current theme (light or dark)
  toggleTheme, // Method to change the theme
}) => {
  const [scrolled, setScrolled] = useState(false)
  const { asPath } = useRouter()
  const { api } = useApi()

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

  const key = 'morio/ui/urls/help'
  const { data } = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const result = await api.kvRead(key)
      if (result[1] === 200 && result[0].value) return result[0].value
      return false
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
  })

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
                <NavButton href="/actions" label="Actions" active={isActive('/actions', asPath)}>
                  Actions
                </NavButton>
                <NavButton href="/boards" label="Dashboards" active={isActive('/boards', asPath)}>
                  Dashboards
                </NavButton>
                <NavButton
                  href="/inventory"
                  label="Inventory"
                  active={isActive('/inventory', asPath)}
                >
                  Inventory
                </NavButton>
                <NavButton href="/settings" label="Settings" active={isActive('/settings', asPath)}>
                  Settings
                </NavButton>
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
                <NavButton
                  href="/account"
                  label="Your Account"
                  active={isActive('/account', asPath)}
                >
                  Your Account
                </NavButton>
              </div>
            </div>
            <NavButton onClick={toggleTheme} label="Change theme" toggle>
              {theme === 'dark' ? <LightThemeIcon /> : <DarkThemeIcon />}
            </NavButton>
            <NavButton href={data ? data : 'https://morio.it/'} label="Get help">
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
