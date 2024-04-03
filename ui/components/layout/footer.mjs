// Components
import { MorioLogo } from 'components/logos/morio.mjs'

const spacer = <span className="px-2 text-accent font-bold">&middot;</span>

export const Footer = () => (
  <footer className="bg-base-100 py-8">
    <div className="w-full sm:w-auto flex flex-col gap-2 items-center justify-center">
      <MorioLogo className="h-16 text-secondary" />
      <p className="text-base-content leading-5 text-xs text-center -mt-2 font-thin opacity-70">
        Connect{spacer}Stream{spacer}Observe{spacer}Respond
      </p>
    </div>
  </footer>
)
