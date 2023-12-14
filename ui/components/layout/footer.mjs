// Components
import { WebLink } from 'components/link.mjs'
import { MorioLogo } from 'components/logos/morio.mjs'

const spacer = <span className="px-2 text-neutral-content font-bold">&middot;</span>

export const Footer = () => (
  <footer className="bg-neutral">
    <div className="w-full sm:w-auto flex flex-col gap-2 items-center justify-center pt-12">
      <MorioLogo className="h-16 text-secondary" />
      <p className="text-neutral-content leading-5 text-xs text-center -mt-2 font-thin opacity-70">
        Connect{spacer}Stream{spacer}Observe{spacer}Respond
      </p>
    </div>

    <div className="w-full max-w-xl text-center pt-12 m-auto">
      <p className="leading-5 text-center">
        <a
          href="https://github.com/certeu/morio/"
          className="p-3 underline decoration-2 hover:decoration-4 text-secondary"
        >
          About CERT-EU
        </a>
        {spacer}
        <a
          href="https://github.com/certeu/morio/"
          className="p-3 underline decoration-2 hover:decoration-4 text-secondary"
        >
          About MORIO
        </a>
      </p>
      <p className="leading-5 text-center text-neutral-content mt-12 text-sm">&copy; CERT-EU</p>
    </div>
  </footer>
)
