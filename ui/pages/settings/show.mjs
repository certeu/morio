import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'
import { Tab, Tabs } from 'components/tabs.mjs'
import { Popout } from 'components/popout.mjs'

const SettingsPage = (props) => {
  const { api } = useApi()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const loadSettings = async () => {
      const [content] = await api.getCurrentSettings()
      setSettings(content)
    }
    if (!settings) loadSettings()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl mx-auto">
          {settings ? <Highlight js={settings} title="Morio Settings" /> : null}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default SettingsPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Settings',
    page: ['settings', 'show'],
  },
})
