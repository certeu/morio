// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { DownloadIcon } from 'components/icons.mjs'

const X509DownloadPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={DownloadIcon} title={props.title}>
      <div className="max-w-4xl">
        <p>These are the most importent Morio X.509 certificates:</p>
        <ul className="list list-disc list-inside ml-4 mb-8">
          <li>
            <b className="text-lg">Morio CA Root Certificate</b>
            <ul className="pl-6 mb-4">
              <li>Root certificate of the Morio internal CA.</li>
              <li>
                <a href="/downloads/certs/ca.pem">/downloads/certs/root.pem</a>
              </li>
            </ul>
          </li>
          <li>
            <b className="text-lg">Morio CA Intermediate Certificate</b>
            <ul className="pl-6 mb-4">
              <li>Intermediate certificate of the Morio internal CA.</li>
              <li>
                <a href="/downloads/certs/intermediate.pem">/downloads/certs/intermediate.pem</a>
              </li>
            </ul>
          </li>
          <li>
            <b className="text-lg">Morio Broker Certificate</b>
            <ul className="pl-6 mb-4">
              <li>Certificate of the Morio Kafka API.</li>
              <li>
                <a href="/downloads/certs/broker.pem">/downloads/certs/broker.pem</a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default X509DownloadPage

export const getStaticProps = () => ({
  props: {
    title: 'Download Certificates',
    page: ['tools', 'certificates', 'download'],
  },
})
