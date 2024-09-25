/**
 * This React component renders the side menu with a list of various settings views
 */
export const SettingsNavigation = ({
  view, // The current view
  nav, // Views for which to render a navigation structure
  loadView, // Method to load a view
  mSettings, // The current mSettings
  lead = [], // Lead for looking up IDs
  level = 0,
}) => (
  <ul className="list list-inside pl-2">
    {Object.entries(nav)
      .map(([key, val]) =>
        typeof val === 'function' ? { ...val(mSettings), id: key } : { ...val, id: key }
      )
      .filter((entry) => !entry.hide)
      .map((entry) => (
        <li key={entry.id}>
          <NavButton {...{ lead, entry, loadView, view, level }}>
            <span className={`${entry.children ? 'uppercase font-bold' : 'capitalize'}`}>
              {entry.title ? entry.title : entry.label}
            </span>
          </NavButton>
          {entry.children && (
            <SettingsNavigation
              {...{ view, loadView, mSettings }}
              nav={entry.children}
              lead={[...lead, entry.id]}
              level={level + 1}
            />
          )}
        </li>
      ))}
  </ul>
)

export const NavButton = ({
  entry,
  view,
  loadView,
  level = 0,
  lead = [],
  extraClasses = 'lg:hover:bg-primary lg:hover:text-primary-content',
}) => {
  const targetView = [...lead, entry.id].join('.')
  const here = view === targetView
  const active = targetView.slice(0, view.length) === view

  /*
   * Pre-calculate some things we need
   */
  const className = `w-full flex flex-row items-center px-4 py-2 rounded-l-lg ${extraClasses} ${
    active
      ? here
        ? 'bg-secondary bg-opacity-20 font-bold text-inherit border-secondary border border-r-0'
        : 'text-base-content '
      : ` text-base-content ${level > 0 ? 'font-thin text-sm italic' : 'font-medium'}`
  }`

  /*
   * Return button if onClick is set, link if not
   */
  return (
    <button onClick={() => loadView([...lead, entry.id].join('/'))} className={className}>
      {entry.title ? entry.title : entry.label}
    </button>
  )
}
