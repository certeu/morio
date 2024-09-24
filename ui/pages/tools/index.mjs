// Dependencies
import { rbac } from 'lib/utils.mjs'
// hooks
import { useAccount } from 'hooks/use-account.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import {
  CertificateIcon,
  CogIcon,
  PackageIcon,
  OpenLockIcon,
  ClosedLockIcon,
  UserIcon,
} from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const ToolsPage = (props) => {
  const { account } = useAccount()
  const manager = rbac(account.role, 'manager')
  const operator = rbac(account.role, 'operator')
  const engineer = rbac(account.role, 'engineer')
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CogIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            {manager ? (
              <Card
                title="Accounts"
                href="/tools/accounts"
                desc="Manage local Morio accounts or list accounts from various identity providers."
                width="w-full"
                Icon={UserIcon}
              />
            ) : null}
            {operator ? (
              <Card
                title="Client Packages"
                href="/tools/pkgs"
                desc="Generate morio-client packages that are pre-configured to integration with this Morio deployment."
                width="w-full"
                Icon={PackageIcon}
              />
            ) : null}
            {engineer ? (
              <Card
                title="Decrypt Data"
                href="/tools/decrypt"
                desc="Decrypt data using Morio's symmetric encryption key, which will decrypt data encrypted by Morio"
                width="w-full"
                Icon={OpenLockIcon}
              />
            ) : null}
            <Card
              title="Downloads"
              href="/tools/downloads"
              desc="Decrypt data using Morio's symmetric encryption key, which will decrypt data encrypted by Morio"
              width="w-full"
              Icon={OpenLockIcon}
            />
            <Card
              title="Encrypt Data"
              href="/tools/encrypt"
              desc="Encrypt data using Morio's symmetric encryption key, allowing decryption by Morio at a later time"
              width="w-full"
              Icon={ClosedLockIcon}
            />
            <Card
              title="X.509 Certificates"
              href="/tools/certificates"
              desc="Sign certificate signing requests, or generate certificates  with the internal Morio Certificate Authority."
              width="w-full"
              Icon={CertificateIcon}
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
