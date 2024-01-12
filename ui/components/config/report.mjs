import { useContext } from 'react'
// Context
import { ModalContext } from 'context/modal.mjs'
// Components
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { OkIcon, WarningIcon } from 'components/icons.mjs'
import { PageLink } from 'components/link.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'

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
        {report.valid ? <OkIcon stroke={4} /> : <WarningIcon />}
        <div className="text-inherit">
          This configuration
          {report.valid ? <span> is </span> : <b className="px-1 underline">is NOT</b>}
          valid
        </div>
      </div>
    </Box>
    <Box color={report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {report.valid ? <OkIcon stroke={4} /> : <WarningIcon />}
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
 * A React compnent to display a deployment (request) report
 */
export const DeploymentReport = ({ result }) => {
  const { setModal } = useContext(ModalContext)

  return result.result === 'success' ? (
    <>
      <Box color="success">
        <div className="flex flex-row gap-4 items-center w-full">
          <OkIcon stroke={4} />
          Configuration was <b>accepted</b> for deployment
        </div>
      </Box>
      {result.fresh_deploy && result.root_token ? (
        <Popout important>
          <h5>Store the Morio Root Token in a safe place now</h5>
          <p>Below is the Morio Root Token for this deployment:</p>
          <Highlight title='Root Token'>{result.root_token}</Highlight>
          <p>You should use it as your initial login before configuring an authentication provider.</p>
        </Popout>
      ) : null }
      <h4>What now?</h4>
      <p>Morio core will reconfigure this Morio deployment to run <button
        className=""
        onClick={() => setModal(
          <ModalWrapper>
            <Highlight language="json" js={result.config} />
          </ModalWrapper>
        )}>the new configuration</button>.</p>
      <p>We suggest you <PageLink href="/">return to the home page</PageLink> and wait for the new configuration to be applied.</p>
    </>
  ) : (
    <>
      <h3>Unexpected deployment result</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
  )
}

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
export const Box = ({ color, children }) => (
  <div
    className={`bg-${color} text-${color}-content rounded-lg p-4 w-full bg-opacity-80 shadow mb-2`}
  >
    {children}
  </div>
)
