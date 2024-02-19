import { QuestionIcon } from 'components/icons.mjs'

/**
 * This React component renders the side menu with a list of various settings views
 */
export const SettingsNavigation = ({
  view, // The current view
  nav, // Views for which to render a navigation structure
  loadView, // Method to load a view
  mSettings, // The current mSettings
  lead = [], // Lead for looking up IDs
  edit = false, // Set this to true when editing settings in an active deployment
}) => (
  <ul className="list list-inside list-disc ml-4">
    {Object.entries(nav)
      .map(([key, val]) =>
        typeof val === 'function' ? { ...val(mSettings), id: key } : { ...val, id: key }
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
              {...{ view, loadView, mSettings }}
              nav={entry.children}
              lead={[...lead, entry.id]}
            />
          )}
        </li>
      ))}
    {edit ? (
      <>
        <li>
          <button
            className="btn-link no-underline hover:underline px-0 btn-sm text-warning"
            onClick={() => loadView('start')}
          >
            <span className="uppercase font-bold">Operator Actions</span>
          </button>
          <ul className="list list-inside ml-4">
            <li>
              <button
                className="btn-link no-underline hover:underline px-0 btn-sm flex flex-row gap-2 items-center text-warning font-bold capitalize"
                onClick={() => loadView('start')}
              >
                <QuestionIcon />
                <span>Getting Started</span>
              </button>
            </li>
            <li>
              <button
                className="btn-link no-underline hover:underline px-0 btn-sm flex flex-row gap-2 items-center text-warning font-bold capitalize"
                onClick={() => loadView('start')}
              >
                <QuestionIcon />
                <span>Save Changes</span>
              </button>
            </li>
            <li>
              <button
                className="btn-link no-underline hover:underline px-0 btn-sm flex flex-row gap-2 items-center text-warning font-bold capitalize"
                onClick={() => loadView('start')}
              >
                <QuestionIcon />
                <span>Save Settings</span>
              </button>
            </li>
            <li>
              <button
                className="btn-link no-underline hover:underline px-0 btn-sm"
                onClick={() => loadView('start')}
              >
                <span className="captalize text-warning">Apply Settings</span>
              </button>
            </li>
          </ul>
        </li>
      </>
    ) : null}
  </ul>
)
