// Dependencies
import { capitalize } from 'lib/utils.mjs'
// Hooks
import { useState } from 'react'
// Components
import {
  ComponentIcon,
  CodeIcon,
  ConfigurationIcon,
  ContainerIcon,
  ContainerImageIcon,
  LayersIcon,
  MorioIcon,
  ServersIcon,
  StatusIcon,
  StorageIcon,
  TaskIcon,
  WifiIcon,
} from 'components/icons.mjs'
import { Docker } from 'components/brands.mjs'
import { Link } from 'components/link'

/*
 * Shared props for icons in the sidebar/navigation
 */
export const iconProps = { className: 'w-6 h-6 shrink-0 grow-0', stroke: 1.25 }

/*
 * Object to map icons to page
 */
const icons = {
  APIs: CodeIcon,
  components: ComponentIcon,
  config: ConfigurationIcon,
  docker: Docker,
  containers: ContainerIcon,
  images: ContainerImageIcon,
  morio: MorioIcon,
  networks: WifiIcon,
  nodes: ServersIcon,
  services: LayersIcon,
  tasks: TaskIcon,
  volumes: StorageIcon,
  status: StatusIcon,
}

/*
 * This object represents the navigation structure
 */
const links = {
  APIs: {
    subs: {
      morio: {},
    },
  },
  components: {
    subs: {
      ca: {},
      traefik: {},
    },
  },
  config: {},
  docker: {
    subs: {
      containers: {},
      images: {},
      networks: {},
      nodes: {},
      services: {},
      tasks: {},
      volumes: {},
    },
  },
  status: {},
}

const Null = () => null

/**
 * Helper method to determine whether a page is active, as in on the path to
 * the current page.
 *
 */
const isActive = (href, current) => `/${current.join('/')}`.slice(0, href.length) === href

/**
 * This is a component to render a navigation button, which is an entry in the menu
 *
 * @param {object} subs - Any additional children (sub-pages) to render
 * @param {string} current - The current page
 * @param {string} target - The target page
 * @param {array} parents - The page's parents
 * @parem {function} onClick - Set this to make the element a button
 */
export const NavButton = ({
  subs,
  current,
  target,
  parents,
  level = 0,
  onClick = false,
  extraClasses = 'lg:hover:bg-secondary lg:hover:text-secondary-content',
}) => {
  /*
   * Allow sub pages to be toggles
   */
  const [open, setOpen] = useState(false)

  /*
   * Pre-calculate some things we need
   */
  const href = getHref(target, parents)
  const title = getTitle(target)
  const active = isActive(href, current)
  const here = `/${current.join('/')}` === href
  const className = `w-full flex flex-row items-center px-4 py-2 ${extraClasses} ${
    active
      ? here
        ? 'bg-secondary font-bold text-secondary-content'
        : 'bg-secondary text-neutral-content bg-opacity-20 font-bold'
      : `bg-neutral text-neutral-content ${level > 0 ? 'font-thin text-sm italic' : 'font-medium'}`
  }`
  const span = (
    <span className="block grow text-left" style={{ paddingLeft: level * 8 + 'px' }}>
      {title}
    </span>
  )
  const Icon = icons[target] || Null
  const sizedIcon =
    level > 0 ? (
      <Icon className="w-6 h-6 shrink-0 grow-0 opacity-80" stroke={1.5} />
    ) : (
      <Icon className="w-7 h-7 shrink-0 grow-0" stroke={1.25} />
    )

  /*
   * Return button if onClick is set, link if not
   */
  return onClick ? (
    <button {...{ onClick, className }} title={title}>
      {span}
      <div className="w-12">{sizedIcon}</div>
    </button>
  ) : (
    <>
      <Link {...{ href, className }} title={title}>
        {span}
        <div className="w-12 -mr-4 text-center flex items-center justify-center">{sizedIcon}</div>
      </Link>
      {active && subs
        ? Object.entries(subs).map(([key, nav]) => (
            <NavButton
              subs={nav.children}
              target={key}
              level={level + 1}
              parents={[...parents, target]}
              {...{ current, key }}
            />
          ))
        : null}
    </>
  )
}

/**
 * Helper method to construct the href attribute
 *
 * @param {string} page - The page key in the nav object
 * @parent {array} parents - A list of page keys that are (grand) parents
 * @parent {string} slug - The page slug (alternative way to call this method)
 * @return {string} href - The href attribute to link to this page
 */
const getHref = (page, parents = [], slug = false) =>
  slug
    ? `/${slug.toLowerCase()}`
    : parents.length > 0
      ? `/${parents.join('/')}/${page}`.toLowerCase()
      : `/${page}`.toLowerCase()

/**
 * Helper method to retrieve the title/label
 *
 * @param {string} page - The page key in the nav object
 * @parent {string} slug - The page slug (alternative way to call this method)
 * @return {string} title - The title for this page
 */
const getTitle = (page, slug = false) =>
  slug ? capitalize(slug.split('/').pop()) : capitalize(page)

/**
 * This is the MainMenu component that renders the main navigation menu
 *
 * It will call itself recursively when it encountes subs in the navs object
 *
 * @param {string} current - The slug of the current page (path without leading slash)
 * @param {object} navs - The navigation structure to render
 * @param {level} number - An integer indicating the depth, used when called recursively to indent
 * @param {array} parent - An array holding the parents of the current page, allowing to construct the href
 */
export const MainMenu = ({ current, navs = false, level = 0, parents = [] }) => {
  if (!navs) navs = links
  const list = []
  for (const [key, nav] of Object.entries(navs))
    list.push(<NavButton subs={nav.subs} target={key} {...{ current, key, parents, level }} />)

  return list
}
