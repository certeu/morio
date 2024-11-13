// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import {
  BriefcaseIcon,
  CertificateIcon,
  CogIcon,
  PackageIcon,
  OpenLockIcon,
  ClosedLockIcon,
  UserIcon,
} from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ToolsPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={CogIcon} title={props.title}>
      <div className="max-w-4xl">
        <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
          <Card
            title="Accounts"
            href="/tools/accounts"
            desc="Manage local Morio accounts or list accounts from various identity providers."
            width="w-full"
            Icon={UserIcon}
            role="manager"
          />
          <Card
            title="Client Packages"
            href="/tools/pkgs"
            desc="Generate morio-client packages that are pre-configured to integrate with this Morio deployment."
            width="w-full"
            Icon={PackageIcon}
            role="operator"
          />
          <Card
            title="Decrypt Data"
            href="/tools/decrypt"
            desc="Decrypt data using Morio's symmetric encryption key, which will decrypt data encrypted by Morio."
            width="w-full"
            Icon={OpenLockIcon}
            role="engineer"
          />
          <Card
            title="Downloads"
            href="/tools/downloads"
            desc="High-level overview of files available in the /downloads/ folder."
            width="w-full"
            Icon={OpenLockIcon}
          />
          <Card
            title="Encrypt Data"
            href="/tools/encrypt"
            desc="Encrypt data using Morio's symmetric encryption key, allowing decryption by Morio at a later time."
            width="w-full"
            Icon={ClosedLockIcon}
          />
          <Card
            title="Export Data"
            href="/tools/export"
            desc="Export different types of Morio data, for backup or advanced configuration scenarios."
            width="w-full"
            Icon={BriefcaseIcon}
            role="user"
          />
          <Card
            title="X.509 Certificates"
            href="/tools/certificates"
            desc="Sign certificate signing requests, or generate certificates with the internal Morio Certificate Authority."
            width="w-full"
            Icon={CertificateIcon}
          />
        </div>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ToolsPage

export const getStaticProps = () => ({
  props: {
    title: 'Tools',
    page: ['tools'],
  },
})
