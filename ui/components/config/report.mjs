// Components
import { OkIcon, WarningIcon } from 'components/icons.mjs'

/**
 * A React component to display a configuration report
 *
 * @param {object} report - The report object returns from the API
 * @return {functino} component - The React component
 */
export const ConfigReport = ({ report }) => (
  <div className="py-2">
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <div className="text-inherit">
          This configuration
          {report.valid ? <span> is </span> : <b className="px-1 underline">is NOT</b>}
          valid
        </div>
      </div>
    </Box>
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon /> : <WarningIcon />}
        <div className="text-inherit">
          This configuration
          {report.valid ? <span> can </span> : <b className="px-1 underline">CANNOT</b>}
          be deployed
        </div>
      </div>
    </Box>
    {['errors', 'warnings', 'info'].map((type) =>
      report[type].length > 0 ? (
        <div key={type} className="mt-3">
          <h6 className="capitalize">{type}</h6>
          <Messages list={report[type]} />
        </div>
      ) : null
    )}
  </div>
)

/**
 * A React compnent to display messages from a configuration report
 */
const Messages = ({ list }) => (
  <ul className="list list-disc list-inside pl-2">
    {list.map((msg, i) => (
      <li key={i}>{msg}</li>
    ))}
  </ul>
)

/**
 * Little helper component to display a box in the report
 */
const Box = ({ color, children }) => (
  <div
    className={`bg-${color} text-${color}-content rounded-lg p-4 w-full bg-opacity-80 shadow mb-2`}
  >
    {children}
  </div>
)
