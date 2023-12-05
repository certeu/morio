import { MorioIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'

export const Breadcrumbs = ({ page }) => (
  <ul className="flex flex-row gap-2 flex-wrap items-center">
    <li className="inline"><PageLink href="/"><MorioIcon className="w-4 h-4" stroke={1} /></PageLink></li>
    {page.map(crumb => [
      <li className="inline" key={crumb+'-'}>/</li>,
      <li className="inline" key={crumb}><PageLink href={`/${crumb}`}>{crumb}</PageLink></li>,
    ])}
  </ul>
)
