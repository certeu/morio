// Hooks
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PackageIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'
import { StringInput } from 'components/inputs.mjs'

const EnrollClientsPage = (props) => {
  const [fqdn, setFqdn] = useState('cluster-fqdn-here')
  const [flags, setFlags] = useState({})
  const [invite, setInvite] = useState('invite-here')
  const { api } = useApi()

  useEffect(
    () => {
      getFqdn({ api, setFlags, setFqdn })
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  )

  let step2 = null

  if (flags.ENFORCE_HTTP_MTLS)
    step2 = (
      <Popout warning>
        <h5>Joining a client to an mTLS-protected cluster is not supported</h5>
        <p>
          This Morio cluster has the <code>ENFORCE_HTTP_MTLS</code> feature flag enabled.
          <br />
          Automatic enrollment of a client to an mTLS-protected cluster is currently not supported.
        </p>
        <p>As a workaround, we recommend to (temporarily) disable this feature flag.</p>
        <p className="text-sm italic">
          You can mitigate your risk by blocking access to TCP port 443 from untrusted hosts.
        </p>
      </Popout>
    )
  else if (flags.REQUIRE_CLIENT_INVITES)
    step2 = (
      <>
        <Popout note>
          <h5>This cluster requires client invites</h5>
          <p>
            The <code>REQUIRE_CLIENT_INVITES</code> feature flag is enabled on this cluster,
            meaning that clients cannot join without providing an invite code.
          </p>
          <p>
            If you have an invite code, you can enter it below to auto-update the command examples.
            <br />
            If you do not have an invite code, you can generate one with the buttons below.
          </p>
          <div className="flex flex-col gap-2">
            <StringInput label="Invite code" current={invite} update={setInvite} />
            <div className="flex flex-row flex-wrap gap-2 justify-center">
              <button
                className="btn btn-primary"
                onClick={() => getInvite({ setInvite, api, type: 'once' })}
              >
                Generate one-time invite code
              </button>
              <button
                className="btn btn-primary"
                onClick={() => getInvite({ setInvite, api, type: 'many' })}
              >
                Generate multi-use invite code
              </button>
            </div>
          </div>
        </Popout>
        <Tabs tabs="Linux, macOS, Windows">
          <Tab name="Linux" key="lin">
            <p>Hook up the Morio client to this cluster by running the following command:</p>
            <Highlight language="shell">{`sudo morio join ${fqdn} --invite ${invite}`}</Highlight>
          </Tab>
          <Tab name="macOS" key="mac">
            <Popout fixme>Provide instructions for macOS</Popout>
          </Tab>
          <Tab name="Windows" key="win">
            <Popout fixme>Provide instructions for Windows</Popout>
          </Tab>
        </Tabs>
      </>
    )
  else
    step2 = (
      <Tabs tabs="Linux, macOS, Windows">
        <Tab name="Linux" key="lin">
          <p>Hook up the Morio client to this cluster by running the following command:</p>
          <Highlight language="shell">{`sudo morio join ${fqdn}`}</Highlight>
        </Tab>
        <Tab name="macOS" key="mac">
          <Popout fixme>Provide instructions for macOS</Popout>
        </Tab>
        <Tab name="Windows" key="win">
          <Popout fixme>Provide instructions for Windows</Popout>
        </Tab>
      </Tabs>
    )

  return (
    <PageWrapper {...props} role="operator">
      <ContentWrapper {...props} Icon={PackageIcon} title={props.title}>
        <div className="max-w-4xl">
          <p>Enrolling a new Morio client is a 3-step process:</p>
          <h2>Step 1: Install the Morio client</h2>
          <Tabs tabs="Linux, macOS, Windows">
            <Tab name="Linux" key="lin">
              <p>
                To install the Morio client for Linux, run the following command from an account
                with <code>sudo</code> rights:
              </p>
              <Highlight language="shell">{`curl -fsSL https://install.morio.it/client/ | bash`}</Highlight>
            </Tab>
            <Tab name="macOS" key="mac">
              <Popout fixme>Provide instructions for macOS</Popout>
            </Tab>
            <Tab name="Windows" key="win">
              <Popout fixme>Provide instructions for Windows</Popout>
            </Tab>
          </Tabs>
          <h2>Step 2: Join the client to this cluster</h2>
          {step2}
          <h2>Step 3: Enable relevant modules</h2>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default EnrollClientsPage

export const getStaticProps = () => ({
  props: {
    title: 'Enroll Clients',
    page: ['actions', 'clients', ['enroll', 'Enroll Clients']],
  },
})

async function getFqdn({ api, setFqdn, setFlags }) {
  const result1 = await api.getClusterFqdn()
  if (result1[1] === 200) {
    setFqdn(result1[0].fqdn)
  } else setFqdn(false)
  const result2 = await api.getDynamicFlagsConfig()
  if (result2[1] === 200) {
    setFlags(result2[0])
  } else setFlags(false)
}

async function getInvite({ api, setInvite, type }) {
  const result = await api.createClientInvite(type)
  if (result[1] === 200) {
    setInvite(result[0].invite)
  } else setInvite(false)
}
