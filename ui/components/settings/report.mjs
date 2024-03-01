// Components
import { OkIcon, WarningIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'
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
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon stroke={4} /> : <WarningIcon />}
        <div className="text-inherit">
          These settings
          {report.valid ? <span> can </span> : <b className="px-1 underline">CANNOT</b>}
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
 * A React compnent to display a deployment (request) report
 */
export const DeploymentReport = ({ result }) =>
  result.result === 'success' ? (
    <>
      <Box color="success">
        <div className="flex flex-row gap-4 items-center w-full">
          <OkIcon stroke={4} />
          Settings were <b>accepted</b> for deployment
        </div>
      </Box>
      {result.root_token ? (
        <Popout important>
          <h5>Store the Morio Root Token in a safe place now</h5>
          <p>Below is the Morio Root Token for this deployment:</p>
          <Highlight title="Root Token">{result.root_token}</Highlight>
        </Popout>
      ) : null}
      <h4>What now?</h4>
      <p>Morio core will configure this Morio deployment according to these settings.</p>
      <p>Give it some time until the logs stabilize and you see this line:</p>
      <pre>Morio Core ready - Configuration resolved</pre>
    </>
  ) : (
    <>
      <h3>Unexpected deployment result</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
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
