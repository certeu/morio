// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PackageIcon } from 'components/icons.mjs'
import { Apple, Debian, Microsoft, RedHat } from 'components/brands.mjs'
import { Card } from 'components/card.mjs'

const ClientsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={PackageIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title={(
                <span>
                  <small className="lowercase font-black mr-2 text-warning">.deb</small>
                  For Debian Linux
                </span>
              )}
              href="/tools/pkgs/deb"
              desc={<span>Generate a <b>.deb</b> package that you can deploy on Debian-based Linux systems.</span>}
              width="w-full"
              Icon={Debian}
            />
            <Card
              title={(
                <span>
                  <small className="lowercase font-black mr-2 text-warning">.rpm</small>
                  For RedHat Linux
                </span>
              )}
              href="/tools/pkgs/rpm"
              desc={<span>Generate an <b>.rpm</b> package that you can deploy on RedHat-based Linux systems.</span>}
              width="w-full"
              Icon={RedHat}
            />
            <Card
              title={(
                <span>
                  <small className="lowercase font-black mr-2 text-warning">.msi</small>
                  For Microsoft Windows
                </span>
              )}
              href="/tools/pkgs/msi"
              desc={<span>Generate an <b>.msi</b> package that you can deploy on Windows systems.</span>}
              width="w-full"
              Icon={Microsoft}
            />
            <Card
              title={(
                <span>
                  <small className="lowercase font-black mr-2 text-warning">.pkg</small>
                  For Apple MacOS
                </span>
              )}
              href="/tools/pkgs/pkg"
              desc={<span>Generate a <b>.pkg</b> package that you can deploy on MacOS systems.</span>}
              width="w-full"
              Icon={Apple}
            />
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ClientsPage

export const getStaticProps = () => ({
  props: {
    title: 'Client Packages',
    page: ['tools', 'clients'],
  },
})
