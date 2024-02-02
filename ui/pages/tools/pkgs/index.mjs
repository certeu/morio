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

const Card = ({ title, ext, pkgs=[], desc, href, Icon = null, width = 'w-72' }) => (
  <div
    className={`${width} border px-4 pb-4 rounded shadow flex flex-col`}
    title={title}
  >
    <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between text-2xl">
      {title}
      <Icon className="w-8 h-8 shrink-0 grow-0" />
    </h3>
    <p className="grow">{desc}</p>
    <h6><em>Current <Ext ext={ext} /> packages:</em></h6>
    <ul className="list list-inside list-disc ml-2 mb-4">
    {pkgs.length > 0
      ? pkgs.sort().map(pkg => (
        <li key={pkg}>
          <WebLink href={pkg}>{pkg.split('/').pop()}</WebLink>
        </li>
      ))
      : <li className='opacity-50'>No <Ext ext={ext}/> packages available</li>
    }
    </ul>
    <p className="mt-2">
      <Link className="btn btn-outline btn-primary w-full" href={href}>
        Create a new <Ext ext={ext} /> package
      </Link>
    </p>
  </div>
)

const ClientsPage = (props) => {
  const { api } = useApi()
  const [pkgs, setPkgs] = useState({})

  useEffect(() => {
    const loadFiles = async () => {
      const types = ['deb', 'rpm', 'msi', 'pkg']
      const match = morioConfig.api + '/downloads/clients/'
      const files = await api.listDownloads()
      const obj = {}
      if (files[1] === 200) {
        for (const file of files[0]) {
          if (file.slice(0,match.length) === match) {
            const type = file.slice(-4)
            const ext = file.slice(-3)
            if (types.map(t => `.${t}`).includes(type)) {
              if (typeof obj[ext] === 'undefined') obj[ext] = []
              obj[ext].push(file)
            }
          }
        }
        setPkgs(obj)
      }
    }
    loadFiles()
  },[])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={PackageIcon} title={props.title}>
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              title="For Debian Linux"
              href="/tools/pkgs/deb"
              ext="deb"
              desc={<span>Generate a <b>.deb</b> package that you can deploy on Debian-based Linux systems.</span>}
              width="w-full"
              Icon={Debian}
              pkgs={pkgs.deb}
            />
            <Card
              title="For RedHat Linux"
              ext="rpm"
              href="/tools/pkgs/rpm"
              desc={<span>Generate an <b>.rpm</b> package that you can deploy on RedHat-based Linux systems.</span>}
              width="w-full"
              Icon={RedHat}
              pkgs={pkgs.rpm}
            />
            <Card
              title="For Microsoft Windows"
              ext="msi"
              href="/tools/pkgs/msi"
              desc={<span>Generate an <b>.msi</b> package that you can deploy on Windows systems.</span>}
              width="w-full"
              Icon={Microsoft}
              pkgs={pkgs.msi}
            />
            <Card
              title="For Apple MacOS"
              ext="pkg"
              href="/tools/pkgs/pkg"
              desc={<span>Generate a <b>.pkg</b> package that you can deploy on MacOS systems.</span>}
              width="w-full"
              Icon={Apple}
              pkgs={pkgs.pkg}
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
