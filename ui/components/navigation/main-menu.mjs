// Dependencies
import { capitalize, pageChildren } from 'lib/utils.mjs'
import { docsNavs } from 'prebuild/docs-navs.mjs'
// Components
import {
  BookIcon,
  CertificateIcon,
  CheckCircleIcon,
  ComponentIcon,
  CodeIcon,
  CogIcon,
  ContainerIcon,
  ContainerImageIcon,
  DesktopIcon,
  DocumentIcon,
  DownloadIcon,
  LayersIcon,
  MorioIcon,
  PackageIcon,
  QuestionIcon,
  ServersIcon,
  SettingsIcon,
  StatusIcon,
  StorageIcon,
  TaskIcon,
  UlIcon,
  WifiIcon,
  WrenchIcon,
} from 'components/icons.mjs'
import { Docker, RedPanda, RedPandaConsole, Traefik } from 'components/brands.mjs'
import { Link } from 'components/link'

/*
 * Shared props for icons in the sidebar/navigation
 */
export const iconProps = { className: 'w-6 h-6 shrink-0 grow-0', stroke: 1.25 }

/*
 * Object to map icons to page
 */
const icons = {
  api: CodeIcon,
  broker: RedPanda,
  ca: CertificateIcon,
  certificates: CertificateIcon,
  core: MorioIcon,
  components: ComponentIcon,
  containers: ContainerIcon,
  console: RedPandaConsole,
  docker: Docker,
  docs: BookIcon,
  downloads: DownloadIcon,
  faq: QuestionIcon,
  images: ContainerImageIcon,
  morio: MorioIcon,
  networks: WifiIcon,
  nodes: ServersIcon,
  pkgs: PackageIcon,
  presets: CheckCircleIcon,
  proxy: Traefik,
  reference: UlIcon,
  services: LayersIcon,
  settings: SettingsIcon,
  show: DocumentIcon,
  tasks: TaskIcon,
  tools: CogIcon,
  ui: DesktopIcon,
  volumes: StorageIcon,
  status: StatusIcon,
  wizard: WrenchIcon,
}

/*
 * Object to match titles to a page
 */

/*
 * This object represents the navigation structure
 */
export const links = {
  settings: {
    t: 'Settings',
    show: {
      t: 'Show Settings',
    },
    presets: {
      t: 'Show Presets',
    },
    wizard: {
      t: 'Update Settings',
    },
  },
  docs: {
    t: 'Documentation',
    faq: {
      t: 'FAQ',
    },
    reference: {
      t: 'Reference',
    },
  },
  status: {
    docker: {
      containers: {},
      images: {},
      networks: {},
      nodes: {},
      services: {},
      tasks: {},
      volumes: {},
    },
  },
  tools: {
    certificates: {
      t: 'X.509 Certificates',
    },
    pkgs: {
      t: 'Client Packages',
    },
    downloads: {},
  },
  ...docsNavs,
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
  page,
  target,
  current,
  parents,
  level = 0,
  onClick = false,
  extraClasses = 'lg:hover:bg-secondary lg:hover:text-secondary-content',
}) => {
  /*
   * Pre-calculate some things we need
   */
  const href = getHref(target, parents)
  const active = isActive(href, current)
  const children = pageChildren(page)
  const here = `/${current.join('/')}` === href
  const title = page.t || capitalize(target)
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
  const Icon = parents[0] === 'docs' ? Null : icons[target] || Null
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
      {active && children
        ? Object.entries(children).map(([key, page]) => (
            <NavButton
              key={key}
              page={page}
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
  for (const [key, page] of Object.entries(navs))
    list.push(<NavButton page={page} target={key} key={key} {...{ current, parents, level }} />)

  return list
}
