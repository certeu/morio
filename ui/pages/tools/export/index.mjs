// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon, CogIcon, KeyIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ExportPage = (props) => (
  <PageWrapper {...props} role="user">
    <ContentWrapper {...props} Icon={CogIcon} title={props.title}>
      <div className="max-w-4xl">
        <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
          <Card
            role="user"
            title="Morio Certificates"
            href="/tools/export/certificates"
            desc="Export the root and intermediate certificates of the Morio Certificate Authority (CA)"
            width="w-full"
            Icon={CertificateIcon}
          />
          <Card
            role="root"
            title="Morio Keys"
            href="/tools/export/keys"
            desc="Export the cryptographic DNA of this Morio instance, this allows blue/green deployments"
            width="w-full"
            Icon={KeyIcon}
          />
        </div>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ExportPage

export const getStaticProps = () => ({
  props: {
    title: 'Export Data',
    page: ['tools', 'export'],
  },
})
