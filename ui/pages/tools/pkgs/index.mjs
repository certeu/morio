// Hooks
import { useState, useEffect } from 'react'
import { useApi, morioConfig } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PackageIcon } from 'components/icons.mjs'
import { Apple, Debian, Microsoft, RedHat } from 'components/brands.mjs'
import { Link, WebLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Ext } from 'components/ext.mjs'

const Card = ({ title, ext, desc, href, Icon = null, width = 'w-72', disabled=false }) => (
  <div className={`${width} border px-4 pb-4 rounded shadow flex flex-col ${disabled ? 'opacity-50 grayscale' : ''}`} title={title}>
    <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between text-2xl">
      {title}
      <Icon className="w-8 h-8 shrink-0 grow-0" />
    </h3>
    <p className="grow">{desc}</p>
    <p className="mt-2">
      <Link className="btn btn-outline btn-primary w-full" href={disabled ? '#' : href}>
        Create a new <Ext ext={ext} /> package
      </Link>
    </p>
  </div>
)

const ClientsPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={PackageIcon} title={props.title}>
      <div className="max-w-4xl">
        <Popout tip>
          <h5>Client packages are automatically built</h5>
          <p>
            Morio will automatically build client repository packages during its initial setup and on subsequent upgrades.
            <br />
            As such, there is typically no reason to trigger a manual build.
          </p>
        </Popout>
        <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
          <Card
            title="For Debian Linux"
            href="/tools/pkgs/deb"
            ext="deb"
            desc={
              <span>
                Generate a <b>.deb</b> package that installs the Morio client on Debian-based Linux systems.
              </span>
            }
            width="w-full"
            Icon={Debian}
          />
          <Card
            disabled
            title="For RedHat Linux"
            ext="rpm"
            href="/tools/pkgs/rpm"
            desc={
              <span>
                Generate an <b>.rpm</b> package that installs the Morio client on RedHat-based Linux systems.
              </span>
            }
            width="w-full"
            Icon={RedHat}
          />
          <Card
            disabled
            title="For Microsoft Windows"
            ext="msi"
            href="/tools/pkgs/msi"
            desc={
              <span>
                Generate an <b>.msi</b> package that you can deploy on Windows systems.
              </span>
            }
            width="w-full"
            Icon={Microsoft}
          />
          <Card
            disabled
            title="For Apple MacOS"
            ext="pkg"
            href="/tools/pkgs/pkg"
            desc={
              <span>
                Generate a <b>.pkg</b> package that you can deploy on macOS systems.
              </span>
            }
            width="w-full"
            Icon={Apple}
          />
        </div>
        <h2>Repository installer packages</h2>
        <Popout tip>
          <h5>Repo(sitory) installer packages are automatically built</h5>
          <p>
            Morio will automatically build repo installer packages during its initial setup and on subsequent upgrades.
            <br />
            As such, there is typically no reason to trigger a manual build.
          </p>
        </Popout>
        <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
          <Card
            title="For Debian Linux"
            href="/tools/pkgs/deb-repo"
            ext="deb"
            desc={
              <span>
                Generate a <b>.deb</b> package that will add <a href="/repos/apt/">
                this Morio collector&apos;s APT repository</a> to Debian-based Linux systems,
                so that you can install the Morio client from it.
              </span>
            }
            width="w-full"
            Icon={Debian}
          />
          <Card
            disabled
            title="For RedHat Linux"
            href="/tools/pkgs/rpm-repo"
            ext="rpm"
            desc={
              <span>
                Generate a <b>.rpm</b> package that will add <a href="/repos/rpm/">
                this Morio collector&apos;s RPM repository</a> to RedHat-based Linux systems,
                so that you can install the Morio client from it.
              </span>
            }
            width="w-full"
            Icon={RedHat}
          />
        </div>
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ClientsPage

export const getStaticProps = () => ({
  props: {
    title: 'Client Packages',
    page: ['tools', 'clients'],
  },
})
