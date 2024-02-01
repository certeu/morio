// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon, CogIcon, PackageIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ToolsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CogIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title="X.509 Certificates"
              href="/tools/certificates"
              desc="Sign certificate signing requests, or generate certificates  with the internal Morio Certificate Authority."
              width="w-full"
              Icon={CertificateIcon}
            />
            <Card
              title="Client Packages"
              href="/tools/pkgs"
              desc="Generate morio-client packages that are pre-configured to integration with this Morio deployment."
              width="w-full"
              Icon={PackageIcon}
            />
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ToolsPage

export const getStaticProps = () => ({
  props: {
    title: 'Tools',
    page: ['tools'],
  },
})
