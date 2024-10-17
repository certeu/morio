// Hooks
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon, DownloadIcon, PackageIcon } from 'components/icons.mjs'
import { Apple, Debian, Microsoft, RedHat } from 'components/brands.mjs'
import { Popout } from 'components/popout.mjs'
import { WebLink } from 'components/link.mjs'

const clients = {
  deb: ['Debian Linux', Debian],
//  rpm: ['RedHat Linux', RedHat],
//  msi: ['Microsoft Windows', Microsoft],
//  pkg: ['Apple MacOS', Apple],
}



const DownloadsPage = (props) => {
  const { api } = useApi()
  const [pkgs, setPkgs] = useState({})
  const [rpkgs, setRpkgs] = useState({})
  const [certs, setCerts] = useState([])

  useEffect(() => {
    const loadFiles = async () => {
      const types = ['deb', 'rpm', 'msi', 'pkg']
      const match1 = '/downloads/clients/'
      const match2 = '/downloads/certs/'
      const files = await api.listDownloads()
      const obj = {}
      const arr = []
      if (files[1] === 200) {
        for (const file of files[0]) {
          if (file.slice(0, match1.length) === match1) {
            const type = file.slice(-4)
            const ext = file.slice(-3)
            if (types.map((t) => `.${t}`).includes(type)) {
              if (typeof obj[ext] === 'undefined') obj[ext] = []
              obj[ext].push(file)
            }
          }
          else if (file.slice(0, match2.length) === match2) arr.push(file)
        }
        setPkgs(obj)
        setCerts(arr)
      }
    }
    loadFiles()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={DownloadIcon} title={props.title}>
        <div className="max-w-4xl">
          <Popout tip compact noP>
            Go to <a href="/downloads/">/downloads/</a> to browse all files.
          </Popout>

          <h2 className="flex flex-row gap-2 items-center pl-2" id="certs">
            <CertificateIcon className="w-10 h-10" />
            <span>Certificates</span>
          </h2>
          <ul className="list list-inside ml-10">
            {certs.sort().map(cert => (
              <li key={cert} className="flex flex-row gap-2 items-center py-0.5">
                <CertificateIcon className="w-4 h-4" />
                <WebLink href={cert}>{cert}</WebLink>
              </li>
            ))}
            </ul>
          <h2 className="flex flex-row gap-2 items-center pl-2" id="packages">
            <PackageIcon className="w-10 h-10" />
            <span>Client Packages</span>
          </h2>
          {Object.keys(clients).map((ext) => {
            const Icon = clients[ext][1]
            return (
              <div key={ext}>
                <h3 className="flex flex-row gap-2 items-center pl-6">
                  <Icon />
                  <span>For {clients[ext][0]}</span>
                </h3>
                <ul className="list list-inside ml-10">
                  {pkgs[ext] && pkgs[ext].length > 0 ? (
                    pkgs[ext].sort().filter(pkg => pkg.includes('morio-client')).map((pkg) => (
                      <li key={pkg} className="flex flex-row gap-2 items-center py-0.5">
                        <Icon className="w-4 h-4" />
                        <WebLink href={pkg}>{pkg}</WebLink>
                      </li>
                    ))
                  ) : (
                    <li className="opacity-50 italic">No downloads available</li>
                  )}
                </ul>
              </div>
            )
          })}
          <h2 className="flex flex-row gap-2 items-center pl-2" id="packages">
            <PackageIcon className="w-10 h-10" />
            <span>Client Repository Packages</span>
          </h2>
          {Object.keys(clients).map((ext) => {
            const Icon = clients[ext][1]
            return (
              <div key={ext}>
                <h3 className="flex flex-row gap-2 items-center pl-6">
                  <Icon />
                  <span>For {clients[ext][0]}</span>
                </h3>
                <ul className="list list-inside ml-10">
                  {pkgs[ext] && pkgs[ext].length > 0 ? (
                    pkgs[ext].sort().filter(pkg => pkg.includes('morio-repo')).map((pkg) => (
                      <li key={pkg} className="flex flex-row gap-2 items-center py-0.5">
                        <Icon className="w-4 h-4" />
                        <WebLink href={pkg}>{pkg}</WebLink>
                      </li>
                    ))
                  ) : (
                    <li className="opacity-50 italic">No downloads available</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DownloadsPage

export const getStaticProps = () => ({
  props: {
    title: 'Downloads',
    page: ['tools', 'downloads'],
  },
})
