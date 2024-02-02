// Hooks
import { useState, useEffect } from 'react'
import { useApi, morioConfig } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { DownloadIcon, PackageIcon } from 'components/icons.mjs'
import { Apple, Debian, Microsoft, RedHat } from 'components/brands.mjs'
import { Link, WebLink } from 'components/link.mjs'
import { Popout } from 'components/popout.mjs'
import { Ext } from 'components/ext.mjs'

const clients = {
  deb: ['Debian Linux', Debian],
  rpm: ['RedHat Linux', RedHat],
  msi: ['Microsoft Windows', Microsoft],
  pkg: ['Apple MacOS', Apple],
}

const DownloadsPage = (props) => {
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
      <ContentWrapper {...props} Icon={DownloadIcon} title={props.title}>
        <div className="max-w-4xl">
        <h2 className="flex flex-row gap-2 items-center pl-2">
          <PackageIcon className="w-10 h-10" />
          <span>Client Packages</span>
        </h2>
        {Object.keys(clients).map(ext => {
          const Icon = clients[ext][1]
          return (
            <div key={ext}>
              <h3 className="flex flex-row gap-2 items-center pl-6">
                <Icon />
                <span>For {clients[ext][0]}</span>
              </h3>
              <ul className="list list-inside ml-10">
                {pkgs[ext] && pkgs[ext].length > 0
                  ? pkgs[ext].sort().map(pkg => (
                    <li key={pkg} className="flex flex-row gap-2 items-center py-0.5">
                      <Icon className="w-4 h-4"/>
                      <WebLink href={pkg}>{pkg}</WebLink>
                    </li>
                  ))
                  : <li className='opacity-50 italic'>No downloads available</li>
                }
              </ul>
            </div>
          )}
        )}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DownloadsPage

export const getStaticProps = () => ({
  props: {
    title: 'Downloads',
    page: ['downloads'],
  },
})
