// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon, DownloadIcon, PlusCircleIcon } from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ToolsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CertificateIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title="Download Certificates"
              href="/tools/certificates/download"
              desc="Download the various certificates used in this Morio deployment."
              width="w-full"
              Icon={DownloadIcon}
            />
            <Card
              title="Create Certificate"
              href="/tools/certificates/create"
              desc="Generate a certificate signed by Morio's internal Certificate Authority (CA)."
              width="w-full"
              Icon={PlusCircleIcon}
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
    title: 'X.509 Certificates',
    page: ['tools', 'certificates'],
  },
})
