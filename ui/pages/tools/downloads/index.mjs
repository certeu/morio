// Hooks
import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { CertificateIcon, DownloadIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { WebLink } from 'components/link.mjs'

const DownloadsPage = (props) => {
  const { api } = useApi()
  const [certs, setCerts] = useState([])

  useEffect(() => {
    const loadFiles = async () => {
      const match = '/downloads/certs/'
      const files = await api.listDownloads()
      const arr = []
      if (files[1] === 200) {
        for (const file of files[0]) {
          if (file.slice(0, match.length) === match) arr.push(file)
        }
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
            {certs.sort().map((cert) => (
              <li key={cert} className="flex flex-row gap-2 items-center py-0.5">
                <CertificateIcon className="w-4 h-4" />
                <WebLink href={cert}>{cert}</WebLink>
              </li>
            ))}
          </ul>
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
