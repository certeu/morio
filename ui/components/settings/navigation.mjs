/**
 * This React component renders the side menu with a list of various settings views
 */
export const SettingsNavigation = ({
  view, // The current view
  nav, // Views for which to render a navigation structure
  loadView, // Method to load a view
  mConf, // The current mConf configuration
  lead = [], // Lead for looking up IDs
}) => (
  <ul className="list list-inside list-disc ml-4">
    {Object.entries(nav)
      .map(([key, val]) =>
        typeof val === 'function' ? { ...val(mConf), id: key } : { ...val, id: key }
      )
      .filter((entry) => !entry.hide)
      .map((entry) => (
        <li key={entry.id}>
          <button
            className={`btn ${
              entry.id === view ? 'btn-ghost' : 'btn-link no-underline hover:underline'
            } px-0 btn-sm`}
            onClick={() => loadView([...lead, entry.id].join('/'))}
          >
            <span className={`${entry.children ? 'uppercase font-bold' : 'capitalize'}`}>
              {entry.title ? entry.title : entry.label}
            </span>
          </button>
          {entry.children && (
            <SettingsNavigation
              {...{ view, loadView, mConf }}
              nav={entry.children}
              lead={[...lead, entry.id]}
            />
          )}
        </li>
      ))}
  </ul>
)
