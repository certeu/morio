import { MorioIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'

export const Breadcrumbs = ({ page }) => {
  const path = []

  return (
    <ul className="flex flex-row gap-2 flex-wrap items-center">
      <li className="inline">
        <PageLink href="/">
          <MorioIcon className="w-4 h-4" stroke={1} />
        </PageLink>
      </li>
      {page.map((crumb, i) => {
        const [slug, label] = Array.isArray(crumb) ? crumb : [crumb, crumb]
        path.push(slug)
        return [
          <li className="inline" key={slug + '-'}>
            /
          </li>,
          <li className="inline" key={slug}>
            {i + 1 === page.length ? (
              <span className="">{label}</span>
            ) : (
              <PageLink href={`/${path.map((p) => `${p}`.toLowerCase()).join('/')}`}>{label}</PageLink>
            )}
          </li>,
        ]
      })}
    </ul>
  )
}
