import { MorioIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import get from 'lodash.get'

/**
 * Helper method to determine whether a page has children
 * Importing this here breaks MDX somehow
 */
export const pageChildren = (page) => {
  const children = {}
  for (const [key, val] of Object.entries(page)) {
    if (!['t', 'o'].includes(key)) children[key] = val
  }

  return Object.keys(children).length > 0 ? children : false
}

const filepathAsHref = (filepath) => {
  if (filepath.slice(-10) === '/index.mdx') filepath = filepath.slice(5, -10)
  else filepath = filepath.slice(5)

  return filepath
}

export const ReadMore = ({ filepath, links, levels = 1 }) => (
  <ChildPages
    pages={pageChildren(get(links, filepath.split('/').slice(1, -1), {}))}
    levels={levels}
    level={1}
    href={filepathAsHref(filepath)}
    {...{ levels, links }}
  />
)

const ChildPages = ({ pages = false, links, level, levels = 1, href }) =>
  pages ? (
    <ul className="list list-inside list-disc ml-2">
      {Object.entries(pages)
        .filter(([key, page]) => !['t', 'o'].includes(key))
        .map(([key, page]) => (
          <li key={key}>
            <PageLink href={`${href}/${key}`}>
              {page.t || <span className="capitalize">{key}</span>}
            </PageLink>
            {level < levels ? (
              <ChildPages
                pages={page}
                levels={levels}
                level={level + 1}
                href={`${href}/${key}`}
                links={links}
              />
            ) : null}
          </li>
        ))}
    </ul>
  ) : null
