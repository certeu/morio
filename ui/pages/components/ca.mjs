import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PageLink, WebLink } from 'components/link.mjs'
import { CertificateIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'
import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'
import { Tabs, Tab } from 'components/tabs.mjs'

const loading = <p>Loading...</p>

const CaPage = (props) => {
  const { api } = useApi()
  const [root, setRoot] = useState(false)
  const [config, setConfig] = useState(false)

  useEffect(() => {
    const loadRoot = async () => {
      const [rootContent, rootStatus] = await api.getCaRoot()
      if (rootStatus === 200) setRoot(rootContent)
      else setRoot(true)
      const [configContent, configStatus] = await api.getCurrentConfig()
      if (configStatus === 200) setConfig(configContent)
    }
    if (!root) loadRoot()
  }, [])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CertificateIcon} title={props.title}>
        <div className="max-w-4xl">
          <Tabs tabs="About, Trust, Fingerprint, Certificate, Use">
            <Tab key="About">
              <h2>About the Morio Certificate Authority</h2>
              <p className="max-w-prose">
                Morio relies on X509 certificates for TLS encryption, authentication, and access control.
                These certificates are provided by an internal certificate authority (CA) based on <WebLink
                href="https://smallstep.com/docs/step-ca/index.html">step-ca</WebLink>.
              </p>
              <p className="max-w-prose">
                The internal CA is initialized when Morio is first deployed.
                The CA is tied to the Morio deployment, so different Morio deployments will have a different CA.
              </p>
            </Tab>
            <Tab key="Trust">
              <h2>Can you trust the Morio Certificate Authority?</h2>
              <p className="max-w-prose">
                Out of the box, this CA will not be trusted by any of your systems.
                <br />
                Your browser will complain when visiting this website, and any software connecting to Morio will also be unhappy.
              </p>
              <p className="max-w-prose">
                Before we go into how to fix that, we should clarify what <em>trust</em> means.
              </p>
              <h3>Trust the encryption</h3>
              <p className="max-w-prose">
                Certificates are a requirement for TLS which allows us to encrypt traffic on the network.
              </p>
              <p className="max-w-prose">
                You can trust that the certificates provided by this CA will keep your data secure while in transit.
              </p>
              <h3>Verify the identity</h3>
              <p className="max-w-prose">
                Certificates can also be used to verify the identity of the remote party.
                For example by verifying domain ownership for a website.
              </p>
              <p className="max-w-prose">
                You should not on this CA for any verification. Instead, use your own judgement
                to determine whether a remote party presenting a certificate issued by this CA is trustworthy.
              </p>
              <h3>Fixing trust issues</h3>
              <p className="max-w-prose">
                To make those error messages in your browser go away, you need to trust the certificates generated
                by this CA. There are different ways you can accomplish this:
              </p>
                
              
              <h4>Trust this CA</h4>
              <p className="max-w-prose">
                The simplest solution is to add <WebLink href="/roots.pem">this CA&apos;
                root certificate</WebLink> as a trusted CA in your operating system&apos;s trust store.
              </p>
              <ul className="p-4 border rounded-lg max-w-prose ml-4 mb-4">
                <li><b>Pro:</b> Easy to do & no infrastructure requirements</li>
                <li><b>Con:</b> Needs to be done on every client connecting to Morio</li>
              </ul>
              <h4>Make this CA a subordinate of your internal CA</h4>
              <p className="max-w-prose">
                If you have your own internal CA, you can cross-sign the intermediate certificate of this CA.
                Doing so will make this CA a so-called <em>subordinate</em> of your internal CA, and systems
                that trust your internal CA will also trust certificates issues by this CA.
              </p>
              <ul className="p-4 border rounded-lg max-w-prose ml-4 mb-4">
                <li><b>Pro:</b> Transparent to clients</li>
                <li><b>Con:</b> Requires an internal CA</li>
              </ul>
              <Popout fixme compact>Implement support for this</Popout>
            </Tab>
            <Tab key="Fingerprint">
              <h2>Certificate Authority Root Fingerprint</h2>
              {root.fingerprint ? (
                <div className="flex flex-row gap-2 items-center">
                  <CopyToClipboard content={root.fingerprint} />
                  <pre className="text-xs my-2">{root.fingerprint}</pre>
                </div>
              ) : loading}
            </Tab>
            <Tab key="Certificate">
              <h2>Certificate Authority Root Certificate</h2>
              {root.certificate ? (
                <div className="flex flex-row gap-2 items-center">
                  <CopyToClipboard content={root.certificate} />
                  <pre className="text-xs my-2">{root.certificate}</pre>
                </div>
              ) : loading}
            </Tab>
            <Tab key="Use">
              <h2>Using the Certificate Authority</h2>
              <h3>With step-cli</h3>
              <ul>
                <li>Install <WebLink href="https://smallstep.com/docs/step-cli/">the Step command-line client</WebLink></li>
                <li>Bootstrap the client configuration with the following command:</li>
              </ul>
              {root.fingerprint && config.morio?.nodes?.[0] ? <Highlight title="Bootstrap step" raw={`step ca bootstrap \\<br />  --ca-url https://${config.morio.nodes[0]}/ \\<br />  --fingerprint ${root.fingerprint}`} /> : loading}
            </Tab>
          </Tabs>
        </div>
        {root === true ? (
          <Popout warning>
            <h5>Failed to load the root certificate</h5>
            <p>We were unable to load the root certificate. This is unexpected.</p>
            <p>You can try yourself with <WebLink href="/roots.pem">this link to the root certificate</WebLink>.</p>
          </Popout>
        ) : null}
        {root === false ? (<Popout important><h5>loading</h5></Popout>) : null}
      </ContentWrapper>
    </PageWrapper>
  )
}

export default CaPage

export const getStaticProps = () => ({
  props: {
    title: 'Certificate Authority',
    page: ['components', 'ca'],
  },
})
