import { useTheme } from 'hooks/use-theme.mjs'
import { RightIcon, DarkThemeIcon, LightThemeIcon } from 'components/icons.mjs'
import { MorioIcon, MorioWordmark } from 'components/branding.mjs'

export const Arrows = () => (
  <>
    <RightIcon className="w-4 h-4 text-success" />
    <RightIcon className="w-4 h-4 -ml-3 text-secondary" />
    <RightIcon className="w-4 h-4 -ml-3 text-accent" />
  </>
)

export const AuthLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 h-screen bg-gradient-to-br from-secondary to-neutral">
      <div className="bg-neutral w-full flex flex-col justify-center bg-opacity-60 px-8 pt-12 pb-24 lg:pt-4 lg:pt-4">
        <h1 className="flex flex-row gap-2 items-center justify-between w-full max-w-lg mx-auto">
          <MorioIcon className="w-12 h-12 text-secondary" />
          <MorioWordmark className="h-12 text-neutral-content" shadow />
          <button onClick={toggleTheme} title="Switch between dark and light mode">
            {theme === 'dark' ? (
              <LightThemeIcon className="w-12 h-12 text-accent hover:text-warning" />
            ) : (
              <DarkThemeIcon className="w-12 h-12 text-warning hover:text-accent" />
            )}
          </button>
        </h1>
        <div className="max-w-lg text-center mx-auto text-neutral-content opacity-80 italic">
          <div className="italic">
            <div className="flex flex-row items-center">
              <span className="px-2">Connect</span>
              <Arrows />
              <span className="px-2">Stream</span>
              <Arrows />
              <span className="px-2">Observe</span>
              <Arrows />
              <span className="px-2">Respond</span>
            </div>
          </div>
          <div className="opacity-80 font-thin text-xs mt-4">
            By{' '}
            <a href="https://www.cert.europa.eu/" className="underline text-secondary px-1">
              CERT-EU
            </a>
          </div>
        </div>
      </div>
      <div className="bg-base-100 bg-opacity-60 flex flex-col h-full justify-center px-8 pb-12">
        {children}
      </div>
    </div>
  )
}
