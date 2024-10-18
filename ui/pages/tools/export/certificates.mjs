// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon } from 'components/icons.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Popout } from 'components/popout.mjs'
// Hooks
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'

const X509DownloadPage = (props) => {
  const [certs, setCerts]  = useState()
  const [error, setError]  = useState(false)
  const { api } = useApi()

  useEffect(() => {
    const getCerts = async () => {
      const result = await api.getCertificates()
      if (result[1] === 200) setCerts(result[0])
      else setError('Failed to load certificates')
    }
    getCerts()
  },[])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CertificateIcon} title={props.title}>
        <div className="max-w-4xl">

          {error ? (
            <Popout warning>
              <h4>Unable to load certificates</h4>
              <p>This is unexpected. Is the API up?</p>
            </Popout>
          ) : certs ? (
            <>
              <p>
                Below are the <a href="#root">root</a> and <a href="#intermediate">intermediate</a> certificates
                of the Morio Certificate Authority, as well as the <a href="#chain">certificate chain</a> which combined them.
              </p>
              <Popout tip>
                <h5>Download links for certificates</h5>
                <span>You can also download the root and intermediate certificates from:</span>
                <ul className="list list-inside list-disc ml-4">
                  <li>
                    <a href="/downloads/certs/root.pem">/downloads/certs/root.pem</a>
                  </li>
                  <li>
                    <a href="/downloads/certs/intermediate.pem">/downloads/certs/intermediate.pem</a>
                  </li>
                </ul>
                <span>In addition, the broker certificate is available at <a href="/downloads/certs/broker.pem">/downloads/certs/broker.pem</a></span>

              </Popout>
              <h2 id="root">Root Certificate</h2>
              <Highlight title="Root Certificate of the Morio internal CA">{certs.root_certificate}</Highlight>
              <h2 id="intermediate">Intermediate Certificate</h2>
              <Highlight title="Intermediate Certificate of the Morio internal CA">{certs.intermediate_certificate}</Highlight>
              <h2 id="chain">Certificate Chain</h2>
              <Highlight title="Certificate chain of the Morio internal CA">{certs.intermediate_certificate + certs.root_certificate}</Highlight>
            </>
          ) : (
            <p>One moment please...</p>
          )}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default X509DownloadPage

export const getStaticProps = () => ({
  props: {
    title: 'Export Certificates',
    page: ['tools', 'export', 'certificates'],
  },
})
