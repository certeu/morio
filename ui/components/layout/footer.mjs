// Components
import { MorioBanner } from 'components/branding.mjs'

export const Footer = () => (
  <footer className="bg-base-100 py-8">
    <div className="w-full sm:w-auto flex flex-row gap-1 items-center justify-center">
      <MorioBanner className="h-4" shadow />
      <span className="text-xs font-bold opacity-70">by CERT-EU</span>
    </div>
  </footer>
)
