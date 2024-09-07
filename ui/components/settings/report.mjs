// Components
import { OkIcon, WarningIcon } from 'components/icons.mjs'
import { Box } from 'components/box.mjs'

/**
 * A React component to display a settings report
 *
 * @param {object} report - The report object returns from the API
 * @return {functino} component - The React component
 */
export const SettingsReport = ({ report }) => (
  <div className="py-2">
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon stroke={4} /> : <WarningIcon />}
        <div className="text-inherit">
          These settings
          {report.valid ? <span> are </span> : <b className="px-1 underline">are NOT</b>}
          valid
        </div>
      </div>
    </Box>
    <Box color={report.deployable ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.deployable ? <OkIcon stroke={4} /> : <WarningIcon />}
        <div className="text-inherit">
          These settings
          {report.deployable ? <span> can </span> : <b className="px-1 underline">CANNOT</b>}
          be deployed
        </div>
      </div>
    </Box>
    {['errors', 'warnings', 'info'].map((type) =>
      report[type] && report[type].length > 0 ? (
        <div key={type} className="mt-3">
          <h6 className="capitalize">{type}</h6>
          <Messages list={report[type]} />
        </div>
      ) : null
    )}
  </div>
)

/**
 * A React compnent to display messages from a settings report
 */
const Messages = ({ list }) => (
  <ul className="list list-disc list-inside pl-2">
    {list.map((msg, i) => (
      <li key={i}>{msg}</li>
    ))}
  </ul>
)
